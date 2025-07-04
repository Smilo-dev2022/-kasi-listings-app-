const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'business', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  stripeSubscriptionId: {
    type: String,
    unique: true,
    sparse: true
  },
  stripeCustomerId: {
    type: String
  },
  features: [{
    name: {
      type: String,
      required: true
    },
    limit: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    used: {
      type: Number,
      default: 0
    }
  }],
  autoRenew: {
    type: Boolean,
    default: true
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && new Date() <= this.endDate;
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if user can use a feature
subscriptionSchema.methods.canUseFeature = function(featureName) {
  if (this.status !== 'active') return false;
  
  const feature = this.features.find(f => f.name === featureName);
  if (!feature) return false;
  
  return feature.limit === -1 || feature.used < feature.limit;
};

// Method to increment feature usage
subscriptionSchema.methods.useFeature = function(featureName) {
  const feature = this.features.find(f => f.name === featureName);
  if (feature && feature.limit !== -1 && feature.used < feature.limit) {
    feature.used += 1;
    return true;
  }
  return false;
};

// Pre-save middleware to set default features based on plan
subscriptionSchema.pre('save', function(next) {
  if (this.isNew) {
    const planFeatures = {
      basic: [
        { name: 'listings', limit: 3, used: 0 },
        { name: 'messages', limit: 50, used: 0 },
        { name: 'search', limit: -1, used: 0 }
      ],
      premium: [
        { name: 'listings', limit: 10, used: 0 },
        { name: 'messages', limit: 200, used: 0 },
        { name: 'search', limit: -1, used: 0 },
        { name: 'premium_placement', limit: -1, used: 0 },
        { name: 'analytics', limit: -1, used: 0 }
      ],
      business: [
        { name: 'listings', limit: 50, used: 0 },
        { name: 'messages', limit: 1000, used: 0 },
        { name: 'search', limit: -1, used: 0 },
        { name: 'premium_placement', limit: -1, used: 0 },
        { name: 'analytics', limit: -1, used: 0 },
        { name: 'bulk_upload', limit: -1, used: 0 },
        { name: 'priority_support', limit: -1, used: 0 }
      ],
      enterprise: [
        { name: 'listings', limit: -1, used: 0 },
        { name: 'messages', limit: -1, used: 0 },
        { name: 'search', limit: -1, used: 0 },
        { name: 'premium_placement', limit: -1, used: 0 },
        { name: 'analytics', limit: -1, used: 0 },
        { name: 'bulk_upload', limit: -1, used: 0 },
        { name: 'priority_support', limit: -1, used: 0 },
        { name: 'api_access', limit: -1, used: 0 },
        { name: 'white_label', limit: -1, used: 0 }
      ]
    };

    this.features = planFeatures[this.plan] || planFeatures.basic;
  }
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema); 