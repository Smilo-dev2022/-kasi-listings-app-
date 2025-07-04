const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');

// Get all subscriptions (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const subscriptions = await Subscription.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's subscriptions
router.get('/my-subscriptions', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get subscription by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('user', 'name email');

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if user can access this subscription
    if (req.user.role !== 'admin' && subscription.user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new subscription
router.post('/', [
  auth,
  body('planType').isIn(['basic', 'premium', 'business']).withMessage('Invalid plan type'),
  body('duration').isInt({ min: 1, max: 12 }).withMessage('Duration must be between 1 and 12 months')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planType, duration } = req.body;

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'zar',
            product_data: {
              name: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
              description: `${duration} month subscription`
            },
            unit_amount: getPlanPrice(planType, duration) * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscriptions/cancel`,
      metadata: {
        userId: req.user.id,
        planType,
        duration
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update subscription
router.put('/:id', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if user can update this subscription
    if (req.user.role !== 'admin' && subscription.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, endDate } = req.body;

    if (status) subscription.status = status;
    if (endDate) subscription.endDate = endDate;

    await subscription.save();

    res.json(subscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel subscription
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if user can cancel this subscription
    if (req.user.role !== 'admin' && subscription.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (subscription.stripeSubscriptionId) {
      // Cancel Stripe subscription
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete subscription (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await subscription.remove();

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        await handleInvoicePaymentFailed(failedInvoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler error' });
  }
});

// Helper functions
function getPlanPrice(planType, duration) {
  const prices = {
    basic: 99,
    premium: 199,
    business: 399
  };
  return prices[planType] * duration;
}

async function handleCheckoutSessionCompleted(session) {
  const { userId, planType, duration } = session.metadata;
  
  const subscription = new Subscription({
    user: userId,
    planType,
    duration,
    startDate: new Date(),
    endDate: new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000), // Add months
    status: 'active',
    stripeSessionId: session.id,
    amount: session.amount_total / 100
  });

  await subscription.save();
}

async function handleInvoicePaymentSucceeded(invoice) {
  // Handle recurring payment success
  console.log('Payment succeeded for invoice:', invoice.id);
}

async function handleInvoicePaymentFailed(invoice) {
  // Handle payment failure
  console.log('Payment failed for invoice:', invoice.id);
}

module.exports = router; 