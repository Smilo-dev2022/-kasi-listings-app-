const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    // This would typically fetch from a Payment model
    // For now, we'll return a placeholder
    res.json({
      payments: [],
      message: 'Payment history endpoint - implement with Payment model'
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create payment intent for advertisements
router.post('/create-payment-intent', [
  auth,
  body('amount').isInt({ min: 100 }).withMessage('Amount must be at least 100 cents'),
  body('currency').isIn(['zar', 'usd']).withMessage('Invalid currency')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, currency = 'zar' } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        userId: req.user.id,
        type: 'advertisement'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Process advertisement payment
router.post('/advertisement', [
  auth,
  body('advertisementId').isMongoId().withMessage('Invalid advertisement ID'),
  body('amount').isInt({ min: 100 }).withMessage('Amount must be at least 100 cents'),
  body('duration').isInt({ min: 1, max: 365 }).withMessage('Duration must be between 1 and 365 days')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { advertisementId, amount, duration } = req.body;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'zar',
            product_data: {
              name: 'Advertisement',
              description: `${duration} day advertisement`
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/ads/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/ads/cancel`,
      metadata: {
        userId: req.user.id,
        advertisementId,
        type: 'advertisement',
        duration
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error processing advertisement payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Process subscription payment
router.post('/subscription', [
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

    // Calculate amount based on plan and duration
    const amount = getPlanAmount(planType, duration);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'zar',
            product_data: {
              name: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Subscription`,
              description: `${duration} month subscription`
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscriptions/cancel`,
      metadata: {
        userId: req.user.id,
        type: 'subscription',
        planType,
        duration
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error processing subscription payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get payment methods
router.get('/payment-methods', auth, async (req, res) => {
  try {
    // This would typically fetch saved payment methods from Stripe
    res.json({
      paymentMethods: [],
      message: 'Payment methods endpoint - implement with Stripe Customer API'
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add payment method
router.post('/payment-methods', auth, async (req, res) => {
  try {
    // This would typically add a payment method to Stripe
    res.json({
      message: 'Payment method added successfully'
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove payment method
router.delete('/payment-methods/:id', auth, async (req, res) => {
  try {
    // This would typically remove a payment method from Stripe
    res.json({
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Payment webhook handler
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
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Payment webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler error' });
  }
});

// Helper functions
function getPlanAmount(planType, duration) {
  const prices = {
    basic: 99,
    premium: 199,
    business: 399
  };
  return prices[planType] * duration;
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  // Update advertisement or subscription status
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);
  // Handle payment failure
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout session completed:', session.id);
  // Process the completed payment based on metadata
}

module.exports = router; 