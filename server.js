/**
 * TransformAI Server - Simplified Version
 * No dependency on external route files
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Log environment variables availability
console.log('Environment variables check:');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'defined' : 'undefined');
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'defined' : 'undefined');
console.log('- GEMINI_MODEL:', process.env.GEMINI_MODEL ? 'defined' : 'using default');

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'transformai/public')));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

// Generation config for Gemini
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024
};

// Define mongoose schemas (can be moved to models/ later)
const conversationSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  userId: { type: String, required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  services: [{ type: String }],
  hours: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const Conversation = mongoose.model('Conversation', conversationSchema);
const Business = mongoose.model('Business', businessSchema);

// Connect to MongoDB (if MONGODB_URI is defined)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err.message);
      console.log('Continuing with limited functionality - conversation persistence disabled');
    });
} else {
  console.warn('MONGODB_URI not defined, database functionality will be limited');
}

// Helper function to generate AI response
async function generateAIResponse(message, businessInfo) {
  if (!process.env.GEMINI_API_KEY) {
    return createFallbackResponse(message, businessInfo);
  }
  
  try {
    // Get model
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig
    });
    
    // Create system prompt
    const systemPrompt = `
    You are an AI assistant for a ${businessInfo.type} called ${businessInfo.name}.
    You can assist with information about services (${businessInfo.services.join(', ')}), 
    and providing basic information about the business.
    Business hours are ${businessInfo.hours}.
    
    Current user message: ${message}
    
    IMPORTANT: Do not respond with "Thank you for your message. How else can I assist you today?"
    or any other generic response. Provide specific information based on the context above.
    `;
    
    console.log('Generating response with prompt...');
    
    // Generate a response
    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();
    
    // If we got a generic response, use fallback
    if (response === "Thank you for your message. How else can I assist you today?" ||
        response.trim() === '') {
      return createFallbackResponse(message, businessInfo);
    }
    
    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    return createFallbackResponse(message, businessInfo);
  }
}

// Fallback response when AI fails
function createFallbackResponse(message, businessInfo) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hour') || lowerMessage.includes('open')) {
    return `${businessInfo.name} is open during these hours: ${businessInfo.hours}. Is there anything specific you'd like to know?`;
  } else if (lowerMessage.includes('service') || lowerMessage.includes('offer')) {
    return `At ${businessInfo.name}, we offer these services: ${businessInfo.services.join(', ')}. Would you like more information about any of them?`;
  } else if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
    return `${businessInfo.name} is located at our business address. You can contact us for specific directions or visit our website for more details.`;
  } else if (lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
    return `I'd be happy to help you book an appointment at ${businessInfo.name}. Our business hours are ${businessInfo.hours}. What day and time works best for you?`;
  }
  
  return `Thank you for your interest in ${businessInfo.name}. We're a ${businessInfo.type} offering ${businessInfo.services.join(', ')}. How can I assist you today?`;
}

// Routes

// Basic route for testing
app.get('/', (req, res) => {
  res.send('TransformAI API is running');
});

// Serve widget.js
app.get('/widget.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'transformai', 'public', 'widget.js'));
});

// API route for chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, businessId, userId, businessName, businessType, services, hours } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    if (!businessId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'businessId and userId are required'
      });
    }
    
    // Log received data
    console.log('Received message:', message);
    console.log('Business context:', { businessId, businessName, businessType, services, hours });
    
    // Retrieve business info from database or use provided info
    let businessInfo;
    try {
      businessInfo = await Business.findById(businessId);
      if (!businessInfo && businessName && businessType) {
        // Create a new business if it doesn't exist
        businessInfo = await Business.create({
          _id: businessId,
          name: businessName,
          type: businessType,
          services: services || [],
          hours: hours || 'Not specified'
        });
      }
    } catch (err) {
      console.log('Using provided business info due to DB error:', err.message);
      businessInfo = {
        name: businessName || 'Business',
        type: businessType || 'Service',
        services: services || [],
        hours: hours || 'Not specified'
      };
    }
    
    // Retrieve conversation history or create new conversation
    let conversation;
    try {
      conversation = await Conversation.findOne({ businessId, userId });
      if (!conversation) {
        conversation = new Conversation({
          businessId,
          userId,
          messages: []
        });
      }
    } catch (err) {
      console.log('Creating new conversation due to DB error:', err.message);
      conversation = {
        businessId,
        userId,
        messages: []
      };
    }
    
    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Generate AI response
    const response = await generateAIResponse(message, businessInfo);
    console.log('Generated response:', response);
    
    // Add assistant response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });
    
    // Save conversation to database if possible
    try {
      if (conversation._id) {
        await conversation.save();
      } else if (mongoose.connection.readyState === 1) {
        // Only attempt to save to DB if we have a valid connection
        const newConversation = new Conversation(conversation);
        await newConversation.save();
      }
    } catch (err) {
      console.log('Failed to save conversation:', err.message);
      // Continue anyway - we'll return the response even if saving fails
    }
    
    // Send response
    res.json({
      success: true,
      message: response,
      conversationId: conversation._id || uuidv4()
    });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate response'
    });
  }
});

// API route for business management
app.post('/api/businesses', async (req, res) => {
  try {
    const { name, type, services, hours } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Business name and type are required'
      });
    }
    
    const business = new Business({
      name,
      type,
      services: services || [],
      hours: hours || 'Not specified'
    });
    
    await business.save();
    
    res.json({
      success: true,
      business
    });
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// API route to get conversations
app.get('/api/conversations/:businessId/:userId', async (req, res) => {
  try {
    const { businessId, userId } = req.params;
    
    const conversation = await Conversation.findOne({ businessId, userId });
    
    if (!conversation) {
      return res.json({
        success: true,
        conversation: {
          businessId,
          userId,
          messages: []
        }
      });
    }
    
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error retrieving conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`TransformAI server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});

module.exports = app; // For testing purposes