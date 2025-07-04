const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');

// Global search across all listing types
router.get('/', [
  query('q').trim().notEmpty().withMessage('Search query is required'),
  query('type').optional().isIn(['all', 'rentals', 'jobs', 'skills', 'businesses']).withMessage('Invalid search type'),
  query('location').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q: searchQuery, type = 'all', location, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Import models
    const Rental = require('../models/Rental');
    const Job = require('../models/Job');
    const Skill = require('../models/Skill');
    const Business = require('../models/Business');

    let results = {
      rentals: [],
      jobs: [],
      skills: [],
      businesses: [],
      total: 0
    };

    // Build search filter
    const searchFilter = { $text: { $search: searchQuery } };
    const locationFilter = location ? { 'address.city': { $regex: location, $options: 'i' } } : {};

    // Search based on type
    if (type === 'all' || type === 'rentals') {
      const rentalFilter = { ...searchFilter, ...locationFilter, status: 'available' };
      results.rentals = await Rental.find(rentalFilter)
        .populate('landlord', 'name email phone')
        .sort({ isPremium: -1, createdAt: -1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? parseInt(limit) : parseInt(limit));
    }

    if (type === 'all' || type === 'jobs') {
      const jobFilter = { ...searchFilter, ...locationFilter, status: 'active' };
      results.jobs = await Job.find(jobFilter)
        .populate('employer', 'name email phone')
        .sort({ isPremium: -1, createdAt: -1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? parseInt(limit) : parseInt(limit));
    }

    if (type === 'all' || type === 'skills') {
      const skillFilter = { ...searchFilter, ...locationFilter, status: 'active' };
      results.skills = await Skill.find(skillFilter)
        .populate('provider', 'name email phone')
        .sort({ isPremium: -1, 'rating.average': -1, createdAt: -1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? parseInt(limit) : parseInt(limit));
    }

    if (type === 'all' || type === 'businesses') {
      const businessFilter = { ...searchFilter, ...locationFilter, status: 'active' };
      results.businesses = await Business.find(businessFilter)
        .populate('owner', 'name email phone')
        .sort({ isPremium: -1, 'rating.average': -1, createdAt: -1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? parseInt(limit) : parseInt(limit));
    }

    // Calculate totals
    if (type === 'all') {
      const [rentalCount, jobCount, skillCount, businessCount] = await Promise.all([
        Rental.countDocuments({ ...searchFilter, ...locationFilter, status: 'available' }),
        Job.countDocuments({ ...searchFilter, ...locationFilter, status: 'active' }),
        Skill.countDocuments({ ...searchFilter, ...locationFilter, status: 'active' }),
        Business.countDocuments({ ...searchFilter, ...locationFilter, status: 'active' })
      ]);
      results.total = rentalCount + jobCount + skillCount + businessCount;
    } else {
      const modelMap = {
        rentals: Rental,
        jobs: Job,
        skills: Skill,
        businesses: Business
      };
      const model = modelMap[type];
      const statusFilter = type === 'rentals' ? { status: 'available' } : { status: 'active' };
      results.total = await model.countDocuments({ ...searchFilter, ...locationFilter, ...statusFilter });
    }

    res.json({
      query: searchQuery,
      type,
      location,
      results,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(results.total / parseInt(limit)),
        hasNext: skip + results[type]?.length < results.total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Advanced search with multiple filters
router.get('/advanced', [
  query('q').optional().trim(),
  query('type').isIn(['all', 'rentals', 'jobs', 'skills', 'businesses']).withMessage('Invalid search type'),
  query('location').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('category').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      q: searchQuery,
      type,
      location,
      minPrice,
      maxPrice,
      category,
      page = 1,
      limit = 10
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Import models
    const Rental = require('../models/Rental');
    const Job = require('../models/Job');
    const Skill = require('../models/Skill');
    const Business = require('../models/Business');

    let results = [];
    let total = 0;

    // Build advanced filter
    const filter = {};

    if (searchQuery) {
      filter.$text = { $search: searchQuery };
    }

    if (location) {
      filter['address.city'] = { $regex: location, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    // Price filter (different for each type)
    if (minPrice || maxPrice) {
      if (type === 'rentals') {
        filter['price.amount'] = {};
        if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
        if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
      } else if (type === 'jobs') {
        filter['salary.min'] = {};
        if (minPrice) filter['salary.min'].$gte = parseFloat(minPrice);
        if (maxPrice) filter['salary.max'] = { $lte: parseFloat(maxPrice) };
      } else if (type === 'skills') {
        filter['pricing.amount'] = {};
        if (minPrice) filter['pricing.amount'].$gte = parseFloat(minPrice);
        if (maxPrice) filter['pricing.amount'].$lte = parseFloat(maxPrice);
      }
    }

    // Add status filter
    if (type === 'rentals') {
      filter.status = 'available';
    } else {
      filter.status = 'active';
    }

    // Execute search based on type
    switch (type) {
      case 'rentals':
        results = await Rental.find(filter)
          .populate('landlord', 'name email phone')
          .sort({ isPremium: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));
        total = await Rental.countDocuments(filter);
        break;

      case 'jobs':
        results = await Job.find(filter)
          .populate('employer', 'name email phone')
          .sort({ isPremium: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));
        total = await Job.countDocuments(filter);
        break;

      case 'skills':
        results = await Skill.find(filter)
          .populate('provider', 'name email phone')
          .sort({ isPremium: -1, 'rating.average': -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));
        total = await Skill.countDocuments(filter);
        break;

      case 'businesses':
        results = await Business.find(filter)
          .populate('owner', 'name email phone')
          .sort({ isPremium: -1, 'rating.average': -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));
        total = await Business.countDocuments(filter);
        break;
    }

    res.json({
      query: searchQuery,
      type,
      filters: { location, minPrice, maxPrice, category },
      results,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + results.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });

  } catch (error) {
    console.error('Error performing advanced search:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get search suggestions
router.get('/suggestions', [
  query('q').trim().notEmpty().withMessage('Search query is required'),
  query('type').optional().isIn(['all', 'rentals', 'jobs', 'skills', 'businesses'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q: searchQuery, type = 'all' } = req.query;

    // Import models
    const Rental = require('../models/Rental');
    const Job = require('../models/Job');
    const Skill = require('../models/Skill');
    const Business = require('../models/Business');

    const suggestions = {
      rentals: [],
      jobs: [],
      skills: [],
      businesses: []
    };

    if (type === 'all' || type === 'rentals') {
      suggestions.rentals = await Rental.find({
        $text: { $search: searchQuery },
        status: 'available'
      })
      .select('title address.city address.state')
      .limit(5);
    }

    if (type === 'all' || type === 'jobs') {
      suggestions.jobs = await Job.find({
        $text: { $search: searchQuery },
        status: 'active'
      })
      .select('title company.name location.address.city')
      .limit(5);
    }

    if (type === 'all' || type === 'skills') {
      suggestions.skills = await Skill.find({
        $text: { $search: searchQuery },
        status: 'active'
      })
      .select('title category location.serviceArea.cities')
      .limit(5);
    }

    if (type === 'all' || type === 'businesses') {
      suggestions.businesses = await Business.find({
        $text: { $search: searchQuery },
        status: 'active'
      })
      .select('name category address.city')
      .limit(5);
    }

    res.json({
      query: searchQuery,
      suggestions
    });

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 