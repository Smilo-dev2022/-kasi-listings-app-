const mongoose = require('mongoose');

const RentalSchema = new mongoose.Schema({
  landlord: {
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
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'studio', 'townhouse', 'condo', 'room', 'other'],
    required: true
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
  price: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'ZAR' },
    period: { type: String, enum: ['monthly', 'weekly', 'daily'], default: 'monthly' }
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0
  },
  size: {
    value: Number,
    unit: { type: String, enum: ['sqm', 'sqft'], default: 'sqm' }
  },
  availableFrom: {
    type: Date,
    required: true
  },
  leaseTerm: {
    type: String,
    enum: ['short-term', 'long-term', 'flexible'],
    default: 'long-term'
  },
  features: [{
    type: String,
    enum: [
      'parking', 'garden', 'balcony', 'air-conditioning', 'heating',
      'internet', 'furnished', 'pet-friendly', 'security', 'pool',
      'gym', 'elevator', 'disabled-access', 'storage', 'fireplace'
    ]
  }],
  images: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  contactInfo: {
    phone: String,
    email: String,
    preferredContact: { type: String, enum: ['phone', 'email', 'both'], default: 'both' }
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'pending', 'inactive'],
    default: 'available'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  inquiries: {
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
RentalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for search functionality
RentalSchema.index({ 
  title: 'text', 
  description: 'text',
  'address.city': 'text',
  'address.state': 'text'
});

// Index for location-based queries
RentalSchema.index({ 'coordinates': '2dsphere' });

// Index for price and availability queries
RentalSchema.index({ 'price.amount': 1, status: 1, availableFrom: 1 });

module.exports = mongoose.model('Rental', RentalSchema); 