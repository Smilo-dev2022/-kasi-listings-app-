const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  employer: {
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
  company: {
    name: { type: String, required: true },
    logo: String,
    website: String,
    description: String
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'temporary', 'internship', 'freelance'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'technology', 'healthcare', 'education', 'finance', 'marketing', 'sales',
      'customer-service', 'manufacturing', 'construction', 'transportation',
      'hospitality', 'retail', 'administration', 'design', 'writing',
      'engineering', 'science', 'legal', 'media', 'other'
    ],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['remote', 'on-site', 'hybrid'],
      default: 'on-site'
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'South Africa' }
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'ZAR' },
    period: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'], default: 'monthly' },
    isNegotiable: { type: Boolean, default: false }
  },
  requirements: {
    experience: {
      min: Number, // years
      max: Number
    },
    education: {
      level: { type: String, enum: ['none', 'high-school', 'diploma', 'bachelor', 'master', 'phd'] },
      field: String
    },
    skills: [String],
    languages: [String],
    certifications: [String]
  },
  benefits: [{
    type: String,
    enum: [
      'health-insurance', 'dental-insurance', 'vision-insurance', 'life-insurance',
      'retirement-plan', 'paid-time-off', 'sick-leave', 'maternity-leave',
      'flexible-hours', 'remote-work', 'professional-development', 'gym-membership',
      'meal-allowance', 'transportation', 'childcare', 'other'
    ]
  }],
  responsibilities: [String],
  applicationDeadline: Date,
  startDate: Date,
  status: {
    type: String,
    enum: ['active', 'closed', 'on-hold', 'draft'],
    default: 'active'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  },
  contactInfo: {
    name: String,
    email: String,
    phone: String,
    preferredContact: { type: String, enum: ['email', 'phone', 'both'], default: 'email' }
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
JobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for search functionality
JobSchema.index({ 
  title: 'text', 
  description: 'text',
  'company.name': 'text',
  'location.address.city': 'text',
  'location.address.state': 'text',
  'requirements.skills': 'text'
});

// Index for location-based queries
JobSchema.index({ 'location.coordinates': '2dsphere' });

// Index for job type and category queries
JobSchema.index({ jobType: 1, category: 1, status: 1 });

// Index for salary range queries
JobSchema.index({ 'salary.min': 1, 'salary.max': 1 });

module.exports = mongoose.model('Job', JobSchema); 