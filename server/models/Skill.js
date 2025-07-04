const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'home-services', 'professional-services', 'creative-services', 'health-wellness',
      'education-tutoring', 'transportation', 'event-services', 'technology',
      'beauty-personal-care', 'fitness-sports', 'food-catering', 'cleaning-maintenance',
      'repair-construction', 'consulting', 'writing-translation', 'design-media',
      'legal-financial', 'other'
    ],
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    enum: ['one-time', 'recurring', 'project-based', 'consultation'],
    default: 'one-time'
  },
  pricing: {
    type: {
      type: String,
      enum: ['hourly', 'daily', 'fixed', 'negotiable'],
      required: true
    },
    amount: Number,
    currency: { type: String, default: 'ZAR' },
    description: String
  },
  location: {
    type: {
      type: String,
      enum: ['on-site', 'remote', 'both'],
      default: 'on-site'
    },
    serviceArea: {
      radius: Number, // in kilometers
      cities: [String],
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  availability: {
    schedule: {
      monday: { available: Boolean, hours: String },
      tuesday: { available: Boolean, hours: String },
      wednesday: { available: Boolean, hours: String },
      thursday: { available: Boolean, hours: String },
      friday: { available: Boolean, hours: String },
      saturday: { available: Boolean, hours: String },
      sunday: { available: Boolean, hours: String }
    },
    responseTime: {
      type: String,
      enum: ['immediate', 'within-1-hour', 'within-24-hours', 'within-48-hours', 'flexible'],
      default: 'within-24-hours'
    }
  },
  experience: {
    years: Number,
    certifications: [String],
    portfolio: [{
      title: String,
      description: String,
      imageUrl: String,
      link: String
    }]
  },
  skills: [String],
  languages: [String],
  images: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  contactInfo: {
    phone: String,
    email: String,
    website: String,
    preferredContact: { type: String, enum: ['phone', 'email', 'both'], default: 'both' }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'busy', 'away'],
    default: 'active'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  views: {
    type: Number,
    default: 0
  },
  inquiries: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
SkillSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for search functionality
SkillSchema.index({ 
  title: 'text', 
  description: 'text',
  skills: 'text',
  'location.serviceArea.cities': 'text'
});

// Index for location-based queries
SkillSchema.index({ 'location.serviceArea.coordinates': '2dsphere' });

// Index for category and status queries
SkillSchema.index({ category: 1, subcategory: 1, status: 1 });

// Index for pricing queries
SkillSchema.index({ 'pricing.amount': 1, 'pricing.type': 1 });

// Index for rating queries
SkillSchema.index({ 'rating.average': -1, 'rating.count': -1 });

module.exports = mongoose.model('Skill', SkillSchema); 