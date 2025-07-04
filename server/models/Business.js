const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
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
      'retail', 'restaurant', 'healthcare', 'professional-services', 'manufacturing',
      'construction', 'transportation', 'entertainment', 'education', 'technology',
      'finance', 'real-estate', 'automotive', 'beauty-wellness', 'fitness-sports',
      'home-garden', 'pet-services', 'childcare', 'cleaning', 'repair-maintenance',
      'consulting', 'media-advertising', 'legal', 'other'
    ],
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String
    }
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'South Africa' }
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  hours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  services: [{
    name: String,
    description: String,
    price: {
      amount: Number,
      currency: { type: String, default: 'ZAR' },
      type: { type: String, enum: ['fixed', 'starting-from', 'negotiable'] }
    }
  }],
  products: [{
    name: String,
    description: String,
    price: {
      amount: Number,
      currency: { type: String, default: 'ZAR' }
    },
    inStock: { type: Boolean, default: true }
  }],
  images: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  logo: String,
  founded: Number, // year
  employees: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+']
  },
  certifications: [String],
  awards: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'temporarily-closed', 'permanently-closed'],
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
  specialOffers: [{
    title: String,
    description: String,
    discount: String,
    validUntil: Date,
    terms: String
  }],
  paymentMethods: [{
    type: String,
    enum: ['cash', 'card', 'bank-transfer', 'mobile-money', 'crypto']
  }],
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
BusinessSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for search functionality
BusinessSchema.index({ 
  name: 'text', 
  description: 'text',
  'address.city': 'text',
  'address.state': 'text',
  'services.name': 'text',
  'products.name': 'text'
});

// Index for location-based queries
BusinessSchema.index({ 'coordinates': '2dsphere' });

// Index for category and status queries
BusinessSchema.index({ category: 1, subcategory: 1, status: 1 });

// Index for rating queries
BusinessSchema.index({ 'rating.average': -1, 'rating.count': -1 });

module.exports = mongoose.model('Business', BusinessSchema); 