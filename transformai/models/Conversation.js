const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  chatbotConfigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatbotConfig',
    required: true
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Conversation', ConversationSchema);