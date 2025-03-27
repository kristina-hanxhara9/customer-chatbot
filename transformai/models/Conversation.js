const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
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
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    device: String,
    browser: String,
    location: String
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  tags: [String],
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  }
});

// Update lastActivityAt when a new message is added
ConversationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivityAt = Date.now();
    
    // If conversation has been inactive for more than 30 minutes, mark as completed
    if (this.status === 'active') {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (this.lastActivityAt < thirtyMinutesAgo) {
        this.status = 'completed';
      }
    }
  }
  next();
});

// Add a message to the conversation
ConversationSchema.methods.addMessage = function(role, content) {
  this.messages.push({
    role,
    content,
    timestamp: Date.now()
  });
  
  this.lastActivityAt = Date.now();
  
  // Update status to active if it was completed
  if (this.status === 'completed') {
    this.status = 'active';
  }
  
  return this;
};

// Format messages for Gemini API
ConversationSchema.methods.formatForGemini = function() {
  // Extract any system message for context
  const systemMessage = this.messages.find(msg => msg.role === 'system');
  const systemPrompt = systemMessage ? systemMessage.content : '';
  
  // Filter out system messages, only include user and assistant messages
  const chatMessages = this.messages.filter(msg => msg.role !== 'system');
  
  // For empty conversations, return empty array
  if (chatMessages.length === 0) {
    return [];
  }
  
  // Include system prompt in user context 
  // only if there's a system message and user message
  const result = [];
  
  // Add each message in the correct format
  for (let i = 0; i < chatMessages.length; i++) {
    const msg = chatMessages[i];
    
    if (i === 0 && msg.role === 'user' && systemPrompt) {
      // First user message gets system context included
      result.push({
        role: 'user',
        content: `[Context: ${systemPrompt}]\n\n${msg.content}`
      });
    } else {
      // All other messages get passed through as is
      result.push({
        role: msg.role,
        content: msg.content
      });
    }
  }
  
  return result;
};

module.exports = mongoose.model('Conversation', ConversationSchema);