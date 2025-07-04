const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Job = require('../models/Job');
const { requireAuth, requireBusiness } = require('../middleware/auth');

// Get all job listings with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('minSalary').optional().isFloat({ min: 0 }).withMessage('Min salary must be positive'),
  query('maxSalary').optional().isFloat({ min: 0 }).withMessage('Max salary must be positive'),
  query('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'temporary', 'internship', 'freelance']),
  query('category').optional().isIn([
    'technology', 'healthcare', 'education', 'finance', 'marketing', 'sales',
    'customer-service', 'manufacturing', 'construction', 'transportation',
    'hospitality', 'retail', 'administration', 'design', 'writing',
    'engineering', 'science', 'legal', 'media', 'other'
  ]),
  query('location').optional().trim(),
  query('status').optional().isIn(['active', 'closed', 'on-hold', 'draft'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      minSalary,
      maxSalary,
      jobType,
      category,
      location,
      status = 'active',
      search
    } = req.query;

    // Build filter object
    const filter = { status };

    if (minSalary || maxSalary) {
      filter['salary.min'] = {};
      if (minSalary) filter['salary.min'].$gte = parseFloat(minSalary);
      if (maxSalary) filter['salary.max'] = { $lte: parseFloat(maxSalary) };
    }

    if (jobType) filter.jobType = jobType;
    if (category) filter.category = category;

    if (location) {
      filter['location.address.city'] = { $regex: location, $options: 'i' };
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const jobs = await Job.find(filter)
      .populate('employer', 'name email phone')
      .sort({ isPremium: -1, createdAt: -1 }) // Premium jobs first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + jobs.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single job listing by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name email phone');

    if (!job) {
      return res.status(404).json({ error: 'Job listing not found' });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new job listing (businesses only)
router.post('/', requireBusiness, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('company.name').trim().notEmpty().withMessage('Company name is required'),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'temporary', 'internship', 'freelance']).withMessage('Invalid job type'),
  body('category').isIn([
    'technology', 'healthcare', 'education', 'finance', 'marketing', 'sales',
    'customer-service', 'manufacturing', 'construction', 'transportation',
    'hospitality', 'retail', 'administration', 'design', 'writing',
    'engineering', 'science', 'legal', 'media', 'other'
  ]).withMessage('Invalid category'),
  body('salary.min').optional().isFloat({ min: 0 }).withMessage('Min salary must be positive'),
  body('salary.max').optional().isFloat({ min: 0 }).withMessage('Max salary must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const jobData = {
      ...req.body,
      employer: req.user._id
    };

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('employer', 'name email phone');

    res.status(201).json(populatedJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a job listing (owner only)
router.put('/:id', requireBusiness, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('salary.min').optional().isFloat({ min: 0 }).withMessage('Min salary must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found' });
    }

    // Check if user owns this job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employer', 'name email phone');

    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a job listing (owner only)
router.delete('/:id', requireBusiness, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found' });
    }

    // Check if user owns this job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get jobs by employer
router.get('/employer/:employerId', async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.params.employerId })
      .populate('employer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Increment application count
router.post('/:id/apply', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found' });
    }

    job.applications += 1;
    await job.save();

    res.json({ message: 'Application recorded' });
  } catch (error) {
    console.error('Error recording application:', error);
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

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found' });
    }

    job.isPremium = !job.isPremium;
    await job.save();

    res.json({ 
      message: `Job ${job.isPremium ? 'marked as premium' : 'removed from premium'}`,
      isPremium: job.isPremium
    });
  } catch (error) {
    console.error('Error toggling premium status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 