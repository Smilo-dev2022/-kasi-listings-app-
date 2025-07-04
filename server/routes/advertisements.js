const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const { requireAuth, requireAdmin } = require('../middleware/auth'); // Uncomment when auth is ready

// Create a new advertisement (company uploads ad, sets duration, etc.)
router.post('/', /* requireAuth, */ async (req, res) => {
  try {
    const { title, content, imageUrl, targetAudience, durationDays } = req.body;
    const ad = new Advertisement({
      company: req.user ? req.user._id : null, // Replace with real user ID from auth
      title,
      content,
      imageUrl,
      targetAudience,
      durationDays,
      status: 'pending',
      paymentStatus: 'unpaid'
    });
    await ad.save();
    res.status(201).json(ad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all advertisements (admin or for display)
router.get('/', async (req, res) => {
  try {
    const ads = await Advertisement.find().populate('company', 'name email');
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single advertisement by ID
router.get('/:id', async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id).populate('company', 'name email');
    if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
    res.json(ad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update advertisement (company or admin)
router.put('/:id', /* requireAuth, */ async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
    res.json(ad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark ad as paid (after payment success)
router.post('/:id/pay', /* requireAuth, */ async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'paid', status: 'pending' },
      { new: true }
    );
    if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
    res.json(ad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve or reject ad (admin only)
router.post('/:id/approve', /* requireAdmin, */ async (req, res) => {
  try {
    const { approve } = req.body;
    const status = approve ? 'active' : 'rejected';
    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
    res.json(ad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Analytics: increment views/clicks
router.post('/:id/track', async (req, res) => {
  try {
    const { type } = req.body; // 'view' or 'click'
    const update = type === 'click' ? { $inc: { clicks: 1 } } : { $inc: { views: 1 } };
    const ad = await Advertisement.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
    res.json(ad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create Stripe Checkout session for ad payment
router.post('/:id/checkout', /* requireAuth, */ async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
    if (ad.paymentStatus === 'paid') return res.status(400).json({ error: 'Ad already paid' });

    // Example pricing: $10 per day
    const pricePerDay = 1000; // in cents (USD)
    const amount = ad.durationDays * pricePerDay;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Ad: ${ad.title}`,
              description: ad.content,
            },
            unit_amount: pricePerDay,
          },
          quantity: ad.durationDays,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/ads/success?id=${ad._id}`,
      cancel_url: `${process.env.CLIENT_URL}/ads/cancel?id=${ad._id}`,
      metadata: {
        adId: ad._id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stripe webhook to handle payment success
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const adId = session.metadata.adId;
    await Advertisement.findByIdAndUpdate(adId, { paymentStatus: 'paid', status: 'pending' });
  }

  res.json({ received: true });
});

module.exports = router; 