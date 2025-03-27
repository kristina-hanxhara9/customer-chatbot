// models/chatSession.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Message schema (embedded in ChatSession)
const MessageSchema = new Schema({
  type: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Visitor info schema (embedded in ChatSession)
const VisitorInfoSchema = new Schema({
  ip: String,
  userAgent: String,
  referrer: String,
  location: String,
  pageUrl: String
});

const ChatSessionSchema = new Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  businessId: {
    type: String,
    required: true,
    ref: 'User'
  },
  visitorInfo: VisitorInfoSchema,
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  isConverted: {
    type: Boolean,
    default: false
  },
  conversionType: {
    type: String,
    enum: ['appointment', 'contact', 'purchase', 'signup', 'other'],
    default: null
  },
  messages: [MessageSchema],
  tags: [String], // For categorizing conversations
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comment: String
  }
});

// Add TTL index to automatically delete old sessions after 90 days
// This helps manage database size
ChatSessionSchema.index({ startedAt: 1 }, { 
  expireAfterSeconds: 7776000 // 90 days
});

// Create indexes for faster queries
ChatSessionSchema.index({ sessionId: 1 }, { unique: true });
ChatSessionSchema.index({ businessId: 1 });
ChatSessionSchema.index({ businessId: 1, startedAt: -1 }); // For listing recent sessions

module.exports = mongoose.model('ChatSession', ChatSessionSchema);