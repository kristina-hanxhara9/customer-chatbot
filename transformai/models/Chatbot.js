const mongoose = require('mongoose');

const ChatbotSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  industry: {
    type: String,
    required: true,
    enum: ['dental', 'realEstate', 'restaurant', 'fitness', 'salon', 'law', 
           'ecommerce', 'hotel', 'healthcare', 'education', 'other']
  },
  businessName: {
    type: String,
    required: true
  },
  businessDescription: {
    type: String,
    default: ''
  },
  businessHours: {
    type: String,
    default: 'Monday-Friday: 9:00 AM - 5:00 PM'
  },
  businessLocation: {
    type: String,
    default: ''
  },
  businessWebsite: {
    type: String,
    default: ''
  },
  services: [{
    type: String
  }],
  features: [{
    type: String
  }],
  aiPersonality: {
    type: String,
    default: 'friendly',
    enum: ['friendly', 'professional', 'casual', 'enthusiastic']
  },
  communicationStyle: {
    concise: {
      type: Boolean,
      default: true
    },
    questions: {
      type: Boolean,
      default: true
    },
    informative: {
      type: Boolean,
      default: false
    },
    empathetic: {
      type: Boolean,
      default: true
    }
  },
  knowledgeFocus: {
    type: String,
    default: 'balanced',
    enum: ['balanced', 'business', 'industry', 'sales']
  },
  customPrompt: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  },
  stats: {
    totalConversations: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    }
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

// Pre-save middleware to update the updatedAt field
ChatbotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to generate system prompt based on chatbot settings
ChatbotSchema.methods.generateSystemPrompt = function() {
  if (this.customPrompt && this.customPrompt.trim().length > 0) {
    return this.customPrompt;
  }
  
  // Personality styles
  const personalityStyles = {
    friendly: "friendly and helpful manner",
    professional: "professional and formal tone",
    casual: "casual and conversational style",
    enthusiastic: "enthusiastic and energetic voice"
  };
  
  // Industry names mapping
  const industryNames = {
    dental: 'dental practice',
    realEstate: 'real estate agency',
    restaurant: 'restaurant',
    fitness: 'fitness studio',
    salon: 'hair salon',
    law: 'law firm',
    ecommerce: 'e-commerce store',
    hotel: 'hotel',
    healthcare: 'healthcare provider',
    education: 'educational institution',
    other: 'business'
  };
  
  // Communication styles
  let communicationStyles = [];
  if (this.communicationStyle.concise) {
    communicationStyles.push("be concise in your responses");
  }
  if (this.communicationStyle.questions) {
    communicationStyles.push("ask follow-up questions when appropriate");
  }
  if (this.communicationStyle.informative) {
    communicationStyles.push("provide detailed information when needed");
  }
  if (this.communicationStyle.empathetic) {
    communicationStyles.push("show empathy when customers express concerns");
  }
  
  // Knowledge focus
  let focusText = "";
  if (this.knowledgeFocus === "business") {
    focusText = "Focus primarily on information about the business, its services, and operations.";
  } else if (this.knowledgeFocus === "industry") {
    focusText = "Share educational information about the industry and best practices when relevant.";
  } else if (this.knowledgeFocus === "sales") {
    focusText = "Emphasize the benefits of services and gently encourage potential customers to make appointments or purchases.";
  }
  
  // Compile the prompt
  let prompt = `You are an AI assistant for a ${industryNames[this.industry] || 'business'} called ${this.businessName}. `;
  prompt += `Respond in a ${personalityStyles[this.aiPersonality]}. `;
  prompt += `You can assist with information about ${this.businessDescription || 'the business'} `;
  
  if (this.services && this.services.length > 0) {
    prompt += `Our services include: ${this.services.join(', ')}. `;
  }
  
  if (this.features && this.features.length > 0) {
    prompt += `Special features: ${this.features.join(', ')}. `;
  }
  
  prompt += `Business hours are ${this.businessHours}. `;
  
  if (communicationStyles.length > 0) {
    prompt += communicationStyles.join(', ') + '. ';
  }
  
  if (focusText) {
    prompt += focusText;
  }
  
  return prompt;
};

module.exports = mongoose.model('Chatbot', ChatbotSchema);