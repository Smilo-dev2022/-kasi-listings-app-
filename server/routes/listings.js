const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Rental = require('../models/Rental');
const { requireAuth, requireLandlord } = require('../middleware/auth');

// Get all rental listings with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('propertyType').optional().isIn(['apartment', 'house', 'studio', 'townhouse', 'condo', 'room', 'other']),
  query('minBedrooms').optional().isInt({ min: 0 }).withMessage('Min bedrooms must be non-negative'),
  query('maxBedrooms').optional().isInt({ min: 0 }).withMessage('Max bedrooms must be non-negative'),
  query('city').optional().trim(),
  query('status').optional().isIn(['available', 'rented', 'pending', 'inactive'])
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
      propertyType,
      minBedrooms,
      maxBedrooms,
      city,
      status = 'available',
      search
    } = req.query;

    // Build filter object
    const filter = { status };

    if (minPrice || maxPrice) {
      filter['price.amount'] = {};
      if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
    }

    if (propertyType) filter.propertyType = propertyType;

    if (minBedrooms || maxBedrooms) {
      filter.bedrooms = {};
      if (minBedrooms) filter.bedrooms.$gte = parseInt(minBedrooms);
      if (maxBedrooms) filter.bedrooms.$lte = parseInt(maxBedrooms);
    }

    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const rentals = await Rental.find(filter)
      .populate('landlord', 'name email phone')
      .sort({ isPremium: -1, createdAt: -1 }) // Premium listings first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Rental.countDocuments(filter);

    res.json({
      rentals,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + rentals.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });

  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single rental listing by ID
router.get('/:id', async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('landlord', 'name email phone');

    if (!rental) {
      return res.status(404).json({ error: 'Rental listing not found' });
    }

    // Increment view count
    rental.views += 1;
    await rental.save();

    res.json(rental);
  } catch (error) {
    console.error('Error fetching rental:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new rental listing (landlords only)
router.post('/', requireLandlord, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('propertyType').isIn(['apartment', 'house', 'studio', 'townhouse', 'condo', 'room', 'other']).withMessage('Invalid property type'),
  body('price.amount').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be non-negative'),
  body('bathrooms').isInt({ min: 0 }).withMessage('Bathrooms must be non-negative'),
  body('availableFrom').isISO8601().withMessage('Valid date required for available from'),
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

    const rentalData = {
      ...req.body,
      landlord: req.user._id
    };

    const rental = new Rental(rentalData);
    await rental.save();

    const populatedRental = await Rental.findById(rental._id)
      .populate('landlord', 'name email phone');

    res.status(201).json(populatedRental);
  } catch (error) {
    console.error('Error creating rental:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a rental listing (owner only)
router.put('/:id', requireLandlord, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('price.amount').optional().isFloat({ min: 0 }).withMessage('Price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental listing not found' });
    }

    // Check if user owns this rental
    if (rental.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const updatedRental = await Rental.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('landlord', 'name email phone');

    res.json(updatedRental);
  } catch (error) {
    console.error('Error updating rental:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a rental listing (owner only)
router.delete('/:id', requireLandlord, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental listing not found' });
    }

    // Check if user owns this rental
    if (rental.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await Rental.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rental listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting rental:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get rentals by landlord
router.get('/landlord/:landlordId', async (req, res) => {
  try {
    const rentals = await Rental.find({ landlord: req.params.landlordId })
      .populate('landlord', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(rentals);
  } catch (error) {
    console.error('Error fetching landlord rentals:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Increment inquiry count
router.post('/:id/inquiry', async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental listing not found' });
    }

    rental.inquiries += 1;
    await rental.save();

    res.json({ message: 'Inquiry recorded' });
  } catch (error) {
    console.error('Error recording inquiry:', error);
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

    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental listing not found' });
    }

    rental.isPremium = !rental.isPremium;
    await rental.save();

    res.json({ 
      message: `Rental ${rental.isPremium ? 'marked as premium' : 'removed from premium'}`,
      isPremium: rental.isPremium
    });
  } catch (error) {
    console.error('Error toggling premium status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 