const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');

// Get admin dashboard overview
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // Import models
    const User = require('../models/User');
    const Rental = require('../models/Rental');
    const Job = require('../models/Job');
    const Skill = require('../models/Skill');
    const Business = require('../models/Business');
    const Advertisement = require('../models/Advertisement');
    const Subscription = require('../models/Subscription');

    // Get counts
    const [
      totalUsers,
      activeUsers,
      totalRentals,
      activeRentals,
      totalJobs,
      activeJobs,
      totalSkills,
      activeSkills,
      totalBusinesses,
      activeBusinesses,
      totalAds,
      activeAds,
      totalSubscriptions,
      activeSubscriptions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Rental.countDocuments(),
      Rental.countDocuments({ status: 'available' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Skill.countDocuments(),
      Skill.countDocuments({ status: 'active' }),
      Business.countDocuments(),
      Business.countDocuments({ status: 'active' }),
      Advertisement.countDocuments(),
      Advertisement.countDocuments({ status: 'active' }),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' })
    ]);

    // Get recent activity
    const recentUsers = await User.find()
      .select('name email userType createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentListings = await Promise.all([
      Rental.find().select('title status createdAt').sort({ createdAt: -1 }).limit(3),
      Job.find().select('title status createdAt').sort({ createdAt: -1 }).limit(3),
      Skill.find().select('title status createdAt').sort({ createdAt: -1 }).limit(3),
      Business.find().select('name status createdAt').sort({ createdAt: -1 }).limit(3)
    ]);

    // Get user type distribution
    const userTypes = await User.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get revenue data (if subscription model exists)
    let revenueData = null;
    if (activeSubscriptions > 0) {
      revenueData = await Subscription.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        }
      ]);
    }

    res.json({
      overview: {
        users: { total: totalUsers, active: activeUsers },
        rentals: { total: totalRentals, active: activeRentals },
        jobs: { total: totalJobs, active: activeJobs },
        skills: { total: totalSkills, active: activeSkills },
        businesses: { total: totalBusinesses, active: activeBusinesses },
        advertisements: { total: totalAds, active: activeAds },
        subscriptions: { total: totalSubscriptions, active: activeSubscriptions }
      },
      recentActivity: {
        users: recentUsers,
        listings: {
          rentals: recentListings[0],
          jobs: recentListings[1],
          skills: recentListings[2],
          businesses: recentListings[3]
        }
      },
      analytics: {
        userTypes,
        revenueData
      }
    });

  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending approvals
router.get('/approvals', requireAdmin, async (req, res) => {
  try {
    const Advertisement = require('../models/Advertisement');
    const Business = require('../models/Business');

    const [pendingAds, pendingBusinesses] = await Promise.all([
      Advertisement.find({ status: 'pending' })
        .populate('company', 'name email')
        .sort({ createdAt: -1 }),
      Business.find({ status: 'pending' })
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
    ]);

    res.json({
      advertisements: pendingAds,
      businesses: pendingBusinesses
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve/reject advertisement
router.patch('/advertisements/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const advertisement = await Advertisement.findByIdAndUpdate(
      id,
      { 
        status,
        approvedAt: status === 'approved' ? new Date() : null,
        rejectionReason: status === 'rejected' ? reason : null
      },
      { new: true }
    ).populate('company', 'name email');

    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    res.json({
      message: `Advertisement ${status}`,
      advertisement
    });

  } catch (error) {
    console.error('Error approving advertisement:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve/reject business
router.patch('/businesses/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const business = await Business.findByIdAndUpdate(
      id,
      { 
        status,
        approvedAt: status === 'approved' ? new Date() : null,
        rejectionReason: status === 'rejected' ? reason : null
      },
      { new: true }
    ).populate('owner', 'name email');

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      message: `Business ${status}`,
      business
    });

  } catch (error) {
    console.error('Error approving business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get system statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const Rental = require('../models/Rental');
    const Job = require('../models/Job');
    const Skill = require('../models/Skill');
    const Business = require('../models/Business');
    const Advertisement = require('../models/Advertisement');

    // Get monthly growth data
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const monthlyStats = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Rental.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Job.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    // Get top categories
    const topCategories = await Promise.all([
      Rental.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Job.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Skill.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Business.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      monthlyGrowth: {
        users: monthlyStats[0],
        rentals: monthlyStats[1],
        jobs: monthlyStats[2]
      },
      topCategories: {
        rentals: topCategories[0],
        jobs: topCategories[1],
        skills: topCategories[2],
        businesses: topCategories[3]
      }
    });

  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user management data
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, userType, isActive, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (userType) filter.userType = userType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$text = { $search: search };

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get listing management data
router.get('/listings', requireAdmin, async (req, res) => {
  try {
    const { type, page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!['rentals', 'jobs', 'skills', 'businesses'].includes(type)) {
      return res.status(400).json({ error: 'Invalid listing type' });
    }

    const models = {
      rentals: require('../models/Rental'),
      jobs: require('../models/Job'),
      skills: require('../models/Skill'),
      businesses: require('../models/Business')
    };

    const model = models[type];
    const filter = {};

    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const listings = await model.find(filter)
      .populate(type === 'rentals' ? 'landlord' : type === 'jobs' ? 'employer' : type === 'skills' ? 'provider' : 'owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await model.countDocuments(filter);

    res.json({
      listings,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + listings.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 