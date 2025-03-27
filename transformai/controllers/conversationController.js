const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chatbot = require('../models/Chatbot');
const Conversation = require('../models/Conversation');
require('dotenv').config();

// Get API key and model name directly from environment
const apiKey = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

// Initialize Gemini client directly
const genAI = new GoogleGenerativeAI(apiKey);

// Enable debugging
const DEBUG = true;

// Helper function to print diagnostic info
function log(message, object = null) {
  if (!DEBUG) return;
  
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (object) {
    if (typeof object === 'string') {
      console.log(`[${timestamp}] ${object}`);
    } else {
      console.log(`[${timestamp}]`, JSON.stringify(object, null, 2));
    }
  }
}

/**
 * Generate response using direct Gemini API call
 * @param {string} message - User message
 * @param {object} chatbot - Chatbot object with business details
 * @returns {Promise<string>} Response from Gemini
 */
async function generateDirectResponse(message, chatbot) {
  try {
    log('Generating direct response for message:', message);
    
    // Create generation config
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024
    };
    
    // Get model instance
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig
    });
    
    // Create a direct prompt with all business context
    const businessContext = `
Business name: ${chatbot.businessName}
Business type: ${chatbot.industry} 
Services: ${chatbot.services.join(', ')}
Business hours: ${chatbot.businessHours}
Business description: ${chatbot.businessDescription || 'Not provided'}
`;

    // Create a detailed prompt
    const prompt = `
You are an AI assistant for a ${chatbot.industry} business called ${chatbot.businessName}.
${businessContext}

USER QUERY: "${message}"

IMPORTANT INSTRUCTIONS:
1. Respond directly to the user's query.
2. Include specific information about ${chatbot.businessName} in your response.
3. Reference the services or business hours if relevant.
4. DO NOT respond with the generic phrase "Thank you for your message. How else can I assist you today?"
5. Be helpful, conversational, and natural.

YOUR SPECIFIC RESPONSE:`;
    
    log('Direct prompt:', prompt);
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    log('Received response from Gemini API:', response);
    
    // Check if we still got a generic response
    if (response === "Thank you for your message. How else can I assist you today?" ||
        response.trim() === '') {
      log('WARNING: Still got a generic response, using manual fallback');
      return manualFallbackResponse(message, chatbot);
    }
    
    return response;
  } catch (error) {
    log('ERROR generating direct response:', error.message);
    return manualFallbackResponse(message, chatbot);
  }
}

/**
 * Create a manual fallback response if all API attempts fail
 * @param {string} message - User message
 * @param {object} chatbot - Chatbot object
 * @returns {string} Manually crafted response
 */
function manualFallbackResponse(message, chatbot) {
  log('Creating manual fallback response');
  
  // Extract common keywords from the message
  const lowerMessage = message.toLowerCase();
  
  // Check for common intents
  if (lowerMessage.includes('appointment') || 
      lowerMessage.includes('schedule') || 
      lowerMessage.includes('book')) {
    return `I'd be happy to help you schedule an appointment at ${chatbot.businessName}. Our business hours are ${chatbot.businessHours}. Would you prefer morning or afternoon? Also, is this for a specific service or a routine visit?`;
  } else if (lowerMessage.includes('service') || 
             lowerMessage.includes('offer') || 
             lowerMessage.includes('provide')) {
    return `At ${chatbot.businessName}, we offer a range of services including ${chatbot.services.join(', ')}. Is there a specific service you'd like to know more about?`;
  } else if (lowerMessage.includes('hour') || 
             lowerMessage.includes('open') || 
             lowerMessage.includes('close')) {
    return `${chatbot.businessName} is open ${chatbot.businessHours}. Is there a specific day you're planning to visit?`;
  } else if (lowerMessage.includes('location') || 
             lowerMessage.includes('address') || 
             lowerMessage.includes('where')) {
    return `${chatbot.businessName} is located at ${chatbot.businessLocation || 'our location (please contact us for details)'}. Would you like any other information?`;
  } else if (lowerMessage.includes('price') || 
             lowerMessage.includes('cost') || 
             lowerMessage.includes('fee')) {
    return `The pricing for our services at ${chatbot.businessName} varies depending on specific needs and requirements. We'd be happy to provide you with more details when you visit or call us. Is there a specific service you're interested in?`;
  } else if (lowerMessage.includes('hello') || 
             lowerMessage.includes('hi') || 
             lowerMessage === 'hey') {
    return `Hello! Welcome to ${chatbot.businessName}. We're a ${chatbot.industry} offering ${chatbot.services.slice(0, 3).join(', ')}, and more. How can I assist you today?`;
  } else if (lowerMessage.includes('thank')) {
    return `You're welcome! Is there anything else I can help you with regarding ${chatbot.businessName} or our services?`;
  }
  
  // Default response that references the user's message and business
  return `Thank you for asking about "${message}". At ${chatbot.businessName}, we specialize in ${chatbot.services.slice(0, 3).join(', ')}. Our business hours are ${chatbot.businessHours}. How can I help you further with any specific information?`;
}

/**
 * Process a new message and get AI response
 * @route POST /api/conversations/:chatbotId/messages
 */
exports.processMessage = async (req, res) => {
  try {
    log('Processing new message request');
    const { chatbotId } = req.params;
    const { message, sessionId, metadata, customerInfo } = req.body;
    
    log(`Request info: chatbotId=${chatbotId}, sessionId=${sessionId}`);
    log(`User message: "${message}"`);
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Find the chatbot
    log(`Finding chatbot with ID: ${chatbotId}`);
    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      log('Chatbot not found');
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }
    
    log(`Found chatbot: ${chatbot.businessName}`);
    
    // Check if chatbot is active
    if (!chatbot.active) {
      log('Chatbot is inactive');
      return res.status(403).json({
        success: false,
        message: 'This chatbot is currently inactive'
      });
    }
    
    // Generate a session ID if not provided
    const conversationId = sessionId || uuidv4();
    log(`Using conversation ID: ${conversationId}`);
    
    // Find or create conversation
    log('Looking for existing conversation');
    let conversation = await Conversation.findOne({
      chatbotId,
      sessionId: conversationId
    });
    
    if (!conversation) {
      log('Creating new conversation');
      // Create a new conversation
      conversation = new Conversation({
        chatbotId,
        sessionId: conversationId,
        messages: [],
        metadata: metadata || {},
        customerInfo: customerInfo || {}
      });
      
      // Add system message with prompt
      const systemPrompt = chatbot.generateSystemPrompt();
      conversation.addMessage('system', systemPrompt);
      log('Added system message to conversation');
    } else {
      log(`Found existing conversation with ${conversation.messages.length} messages`);
    }
    
    // Add user message
    log('Adding user message to conversation');
    conversation.addMessage('user', message);
    await conversation.save();
    log('Saved conversation with new user message');
    
    // Generate AI response DIRECTLY using Gemini API - bypassing complex message formatting
    log('Generating AI response directly...');
    const aiResponse = await generateDirectResponse(message, chatbot);
    log('AI Response:', aiResponse);
    
    // Add AI response to conversation
    log('Adding AI response to conversation');
    conversation.addMessage('assistant', aiResponse);
    await conversation.save();
    log('Saved conversation with AI response');
    
    // Update chatbot stats
    chatbot.stats.lastActiveDate = Date.now();
    chatbot.stats.totalConversations = await Conversation.countDocuments({ chatbotId });
    await chatbot.save();
    log('Updated chatbot stats');
    
    // Return response
    res.status(200).json({
      success: true,
      data: {
        message: aiResponse,
        conversationId: conversation.sessionId
      }
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing message',
      error: error.message
    });
  }
};

// Get conversation history
exports.getConversations = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { userId, page = 1, limit = 20, status } = req.query;
    
    // Check if chatbot exists and belongs to user
    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }
    
    if (chatbot.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access these conversations'
      });
    }
    
    // Build query
    const query = { chatbotId };
    if (status) {
      query.status = status;
    }
    
    // Get conversations with pagination
    const conversations = await Conversation.find(query)
      .sort({ lastActivityAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-messages'); // Exclude message content for listing
    
    // Get total count for pagination
    const total = await Conversation.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        conversations,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single conversation with messages
exports.getConversation = async (req, res) => {
  try {
    const { chatbotId, conversationId } = req.params;
    const { userId } = req.query;
    
    // Check if chatbot exists and belongs to user
    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }
    
    if (chatbot.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this conversation'
      });
    }
    
    // Get conversation
    const conversation = await Conversation.findOne({
      chatbotId,
      sessionId: conversationId
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Submit feedback for a conversation
exports.submitFeedback = async (req, res) => {
  try {
    const { chatbotId, conversationId } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required and must be between 1 and 5'
      });
    }
    
    // Get conversation
    const conversation = await Conversation.findOne({
      chatbotId,
      sessionId: conversationId
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Update feedback
    conversation.feedback = {
      rating,
      comment,
      submittedAt: Date.now()
    };
    
    await conversation.save();
    
    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: conversation.feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Continue an existing conversation
exports.getOrCreateConversation = async (req, res) => {
  try {
    log('Get or create conversation');
    const { chatbotId } = req.params;
    const { sessionId } = req.query;
    
    log(`Request info: chatbotId=${chatbotId}, sessionId=${sessionId}`);
    
    // Find the chatbot
    log(`Finding chatbot with ID: ${chatbotId}`);
    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      log('Chatbot not found');
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }
    
    log(`Found chatbot: ${chatbot.businessName}`);
    
    // Check if chatbot is active
    if (!chatbot.active) {
      log('Chatbot is inactive');
      return res.status(403).json({
        success: false,
        message: 'This chatbot is currently inactive'
      });
    }
    
    // Find or create conversation
    let conversation;
    let isNew = false;
    
    if (sessionId) {
      log(`Looking for existing conversation with sessionId: ${sessionId}`);
      conversation = await Conversation.findOne({
        chatbotId,
        sessionId
      });
    }
    
    if (!conversation) {
      log('Creating new conversation');
      // Create a new conversation with a new session ID
      const newSessionId = sessionId || uuidv4();
      conversation = new Conversation({
        chatbotId,
        sessionId: newSessionId,
        messages: []
      });
      
      // Generate system prompt
      log('Generating system prompt');
      const systemPrompt = chatbot.generateSystemPrompt();
      log('System prompt:', systemPrompt);
      
      // Add system message with prompt
      conversation.addMessage('system', systemPrompt);
      
      // Create welcome message with specific business info
      const welcomeMessage = `Hi there! I'm the AI assistant for ${chatbot.businessName}. ${
        chatbot.services.length > 0 ? 
        `We offer ${chatbot.services.join(', ')}. ` : ''
      }${
        chatbot.businessHours ? 
        `Our business hours are ${chatbot.businessHours}. ` : ''
      }How can I help you today?`;
      
      log('Welcome message:', welcomeMessage);
      conversation.addMessage('assistant', welcomeMessage);
      
      await conversation.save();
      log('Saved new conversation');
      isNew = true;
    } else {
      log(`Found existing conversation with ${conversation.messages.length} messages`);
    }
    
    // Return only user-visible messages (exclude system messages)
    const visibleMessages = conversation.messages.filter(msg => msg.role !== 'system');
    log(`Returning ${visibleMessages.length} visible messages`);
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: conversation.sessionId,
        isNew,
        messages: visibleMessages,
        chatbotInfo: {
          name: chatbot.businessName,
          description: chatbot.businessDescription,
          hours: chatbot.businessHours,
          services: chatbot.services
        }
      }
    });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};