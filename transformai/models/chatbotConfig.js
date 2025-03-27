const mongoose = require('mongoose');

const ChatbotConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  businessDescription: {
    type: String,
    required: true
  },
  services: [{
    type: String
  }],
  features: [{
    type: String
  }],
  aiPersonality: {
    type: String,
    default: 'friendly'
  },
  businessHours: {
    type: String,
    default: 'standard'
  },
  aiPrompt: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ChatbotConfig', ChatbotConfigSchema);