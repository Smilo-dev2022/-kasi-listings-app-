const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Business = require('../models/Business');
const { requireAuth } = require('../middleware/auth');

// Get all business listings with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isIn([
    'retail', 'restaurant', 'healthcare', 'professional-services', 'manufacturing',
    'construction', 'transportation', 'entertainment', 'education', 'technology',
    'finance', 'real-estate', 'automotive', 'beauty-wellness', 'fitness-sports',
    'home-garden', 'pet-services', 'childcare', 'cleaning', 'repair-maintenance',
    'consulting', 'media-advertising', 'legal', 'other'
  ]),
  query('location').optional().trim(),
  query('status').optional().isIn(['active', 'inactive', 'temporarily-closed', 'permanently-closed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      category,
      location,
      status = 'active',
      search
    } = req.query;

    // Build filter object
    const filter = { status };

    if (category) filter.category = category;

    if (location) {
      filter['address.city'] = { $regex: location, $options: 'i' };
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const businesses = await Business.find(filter)
      .populate('owner', 'name email phone')
      .sort({ isPremium: -1, 'rating.average': -1, createdAt: -1 }) // Premium and highly rated first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Business.countDocuments(filter);

    res.json({
      businesses,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + businesses.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });

  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single business listing by ID
router.get('/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('owner', 'name email phone');

    if (!business) {
      return res.status(404).json({ error: 'Business listing not found' });
    }

    // Increment view count
    business.views += 1;
    await business.save();

    res.json(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new business listing
router.post('/', requireAuth, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('category').isIn([
    'retail', 'restaurant', 'healthcare', 'professional-services', 'manufacturing',
    'construction', 'transportation', 'entertainment', 'education', 'technology',
    'finance', 'real-estate', 'automotive', 'beauty-wellness', 'fitness-sports',
    'home-garden', 'pet-services', 'childcare', 'cleaning', 'repair-maintenance',
    'consulting', 'media-advertising', 'legal', 'other'
  ]).withMessage('Invalid category'),
  body('subcategory').trim().notEmpty().withMessage('Subcategory is required'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.zipCode').trim().notEmpty().withMessage('Zip code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const businessData = {
      ...req.body,
      owner: req.user._id
    };

    const business = new Business(businessData);
    await business.save();

    const populatedBusiness = await Business.findById(business._id)
      .populate('owner', 'name email phone');

    res.status(201).json(populatedBusiness);
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a business listing (owner only)
router.put('/:id', requireAuth, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business listing not found' });
    }

    // Check if user owns this business
    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone');

    res.json(updatedBusiness);
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a business listing (owner only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business listing not found' });
    }

    // Check if user owns this business
    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await Business.findByIdAndDelete(req.params.id);
    res.json({ message: 'Business listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get businesses by owner
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.params.ownerId })
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(businesses);
  } catch (error) {
    console.error('Error fetching owner businesses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Increment inquiry count
router.post('/:id/inquiry', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business listing not found' });
    }

    business.inquiries += 1;
    await business.save();

    res.json({ message: 'Inquiry recorded' });
  } catch (error) {
    console.error('Error recording inquiry:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add rating and review
router.post('/:id/rate', requireAuth, [
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim().isLength({ min: 10 }).withMessage('Review must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business listing not found' });
    }

    const { rating, review } = req.body;

    // Update rating (simple average calculation)
    const newCount = business.rating.count + 1;
    const newAverage = ((business.rating.average * business.rating.count) + rating) / newCount;

    business.rating = {
      average: newAverage,
      count: newCount
    };

    await business.save();

    res.json({ 
      message: 'Rating added successfully',
      newRating: business.rating
    });
  } catch (error) {
    console.error('Error adding rating:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle premium status (admin only)
router.patch('/:id/premium', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business listing not found' });
    }

    business.isPremium = !business.isPremium;
    await business.save();

    res.json({ 
      message: `Business ${business.isPremium ? 'marked as premium' : 'removed from premium'}`,
      isPremium: business.isPremium
    });
  } catch (error) {
    console.error('Error toggling premium status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 