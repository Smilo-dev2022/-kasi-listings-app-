const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'listingModel',
    required: false
  },
  listingModel: {
    type: String,
    required: false,
    enum: ['Rental', 'Job', 'Skill', 'Business', 'Advertisement']
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ listing: 1 });
conversationSchema.index({ updatedAt: -1 });

// Virtual for unread count
conversationSchema.virtual('unreadCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation',
  match: { read: false }
});

// Ensure participants array has at least 2 users
conversationSchema.pre('save', function(next) {
  if (this.participants.length < 2) {
    return next(new Error('Conversation must have at least 2 participants'));
  }
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema); 