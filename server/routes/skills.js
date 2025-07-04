const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Skill = require('../models/Skill');
const { requireAuth } = require('../middleware/auth');

// Get all skills listings with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('category').optional().isIn([
    'home-services', 'professional-services', 'creative-services', 'health-wellness',
    'education-tutoring', 'transportation', 'event-services', 'technology',
    'beauty-personal-care', 'fitness-sports', 'food-catering', 'cleaning-maintenance',
    'repair-construction', 'consulting', 'writing-translation', 'design-media',
    'legal-financial', 'other'
  ]),
  query('location').optional().trim(),
  query('status').optional().isIn(['active', 'inactive', 'busy', 'away'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      category,
      location,
      status = 'active',
      search
    } = req.query;

    // Build filter object
    const filter = { status };

    if (minPrice || maxPrice) {
      filter['pricing.amount'] = {};
      if (minPrice) filter['pricing.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['pricing.amount'].$lte = parseFloat(maxPrice);
    }

    if (category) filter.category = category;

    if (location) {
      filter['location.serviceArea.cities'] = { $regex: location, $options: 'i' };
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const skills = await Skill.find(filter)
      .populate('provider', 'name email phone')
      .sort({ isPremium: -1, 'rating.average': -1, createdAt: -1 }) // Premium and highly rated first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Skill.countDocuments(filter);

    res.json({
      skills,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + skills.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });

  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single skill listing by ID
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('provider', 'name email phone');

    if (!skill) {
      return res.status(404).json({ error: 'Skill listing not found' });
    }

    // Increment view count
    skill.views += 1;
    await skill.save();

    res.json(skill);
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new skill listing
router.post('/', requireAuth, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('category').isIn([
    'home-services', 'professional-services', 'creative-services', 'health-wellness',
    'education-tutoring', 'transportation', 'event-services', 'technology',
    'beauty-personal-care', 'fitness-sports', 'food-catering', 'cleaning-maintenance',
    'repair-construction', 'consulting', 'writing-translation', 'design-media',
    'legal-financial', 'other'
  ]).withMessage('Invalid category'),
  body('subcategory').trim().notEmpty().withMessage('Subcategory is required'),
  body('pricing.type').isIn(['hourly', 'daily', 'fixed', 'negotiable']).withMessage('Invalid pricing type'),
  body('pricing.amount').optional().isFloat({ min: 0 }).withMessage('Price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const skillData = {
      ...req.body,
      provider: req.user._id
    };

    const skill = new Skill(skillData);
    await skill.save();

    const populatedSkill = await Skill.findById(skill._id)
      .populate('provider', 'name email phone');

    res.status(201).json(populatedSkill);
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a skill listing (owner only)
router.put('/:id', requireAuth, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('pricing.amount').optional().isFloat({ min: 0 }).withMessage('Price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill listing not found' });
    }

    // Check if user owns this skill
    if (skill.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('provider', 'name email phone');

    res.json(updatedSkill);
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a skill listing (owner only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill listing not found' });
    }

    // Check if user owns this skill
    if (skill.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Skill listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get skills by provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const skills = await Skill.find({ provider: req.params.providerId })
      .populate('provider', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(skills);
  } catch (error) {
    console.error('Error fetching provider skills:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Increment inquiry count
router.post('/:id/inquiry', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill listing not found' });
    }

    skill.inquiries += 1;
    await skill.save();

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

    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill listing not found' });
    }

    const { rating, review } = req.body;

    // Update rating (simple average calculation)
    const newCount = skill.rating.count + 1;
    const newAverage = ((skill.rating.average * skill.rating.count) + rating) / newCount;

    skill.rating = {
      average: newAverage,
      count: newCount
    };

    await skill.save();

    res.json({ 
      message: 'Rating added successfully',
      newRating: skill.rating
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

    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill listing not found' });
    }

    skill.isPremium = !skill.isPremium;
    await skill.save();

    res.json({ 
      message: `Skill ${skill.isPremium ? 'marked as premium' : 'removed from premium'}`,
      isPremium: skill.isPremium
    });
  } catch (error) {
    console.error('Error toggling premium status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 