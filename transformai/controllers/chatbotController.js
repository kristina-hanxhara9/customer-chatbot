// Import your Chatbot and Conversation models
const Chatbot = require('../models/Chatbot');
const Conversation = require('../models/Conversation');

/**
 * Create a new chatbot
 * @route POST /api/chatbots
 */
exports.createChatbot = async (req, res) => {
  try {
    const {
      userId,
      industry,
      businessName,
      businessDescription,
      businessHours,
      businessLocation,
      businessWebsite,
      services,
      features,
      aiPersonality,
      communicationStyle,
      knowledgeFocus,
      customPrompt
    } = req.body;
    
    // Validate required fields
    if (!userId || !industry || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, industry, and businessName are required'
      });
    }
    
    const chatbot = new Chatbot({
      userId,
      industry,
      businessName,
      businessDescription,
      businessHours,
      businessLocation,
      businessWebsite,
      services,
      features,
      aiPersonality,
      communicationStyle,
      knowledgeFocus,
      customPrompt
    });
    
    await chatbot.save();
    
    res.status(201).json({
      success: true,
      data: chatbot,
      message: 'Chatbot created successfully'
    });
  } catch (error) {
    console.error('Error creating chatbot:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all chatbots for a user
 * @route GET /api/chatbots?userId=:userId
 */
exports.getChatbots = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const chatbots = await Chatbot.find({ userId });
    
    res.status(200).json({
      success: true,
      count: chatbots.length,
      data: chatbots
    });
  } catch (error) {
    console.error('Error fetching chatbots:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get a single chatbot by ID
 * @route GET /api/chatbots/:id
 */
exports.getChatbot = async (req, res) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }
    
    // Get basic statistics if MongoDB is available
    if (chatbot.isNew === undefined) {
      try {
        const totalConversations = await Conversation.countDocuments({ chatbotId: chatbot._id });
        const latestConversation = await Conversation.findOne({ chatbotId: chatbot._id })
          .sort({ lastActivityAt: -1 })
          .limit(1);
        
        // Update statistics
        chatbot.stats.totalConversations = totalConversations;
        if (latestConversation) {
          chatbot.stats.lastActiveDate = latestConversation.lastActivityAt;
          
          // Count total messages
          let totalMessages = 0;
          const conversations = await Conversation.find({ chatbotId: chatbot._id });
          conversations.forEach(convo => {
            totalMessages += convo.messages.filter(msg => msg.role !== 'system').length;
          });
          
          chatbot.stats.totalMessages = totalMessages;
          await chatbot.save();
        }
      } catch (error) {
        console.error('Error updating chatbot statistics:', error);
        // Continue anyway, stats are nice but not critical
      }
    }
    
    res.status(200).json({
      success: true,
      data: chatbot
    });
  } catch (error) {
    console.error('Error fetching chatbot:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update a chatbot
 * @route PUT /api/chatbots/:id
 */
exports.updateChatbot = async (req, res) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }
    
    // Check if request is from the owner
    if (chatbot.userId !== req.body.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this chatbot'
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      // Don't update userId or stats directly
      if (key !== 'userId' && key !== 'stats' && key !== '_id') {
        chatbot[key] = req.body[key];
      }
    });
    
    // Update timestamp
    chatbot.updatedAt = Date.now();
    
    await chatbot.save();
    
    res.status(200).json({
      success: true,
      data: chatbot,
      message: 'Chatbot updated successfully'
    });
  } catch (error) {
    console.error('Error updating chatbot:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete a chatbot
 * @route DELETE /api/chatbots/:id
 */
exports.deleteChatbot = async (req, res) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }
    
    // Check if request is from the owner
    if (chatbot.userId !== req.body.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this chatbot'
      });
    }
    
    // Delete all associated conversations
    try {
      await Conversation.deleteMany({ chatbotId: chatbot._id });
    } catch (error) {
      console.error('Error deleting associated conversations:', error);
      // Continue anyway, we still want to delete the chatbot
    }
    
    // Delete the chatbot
    await Chatbot.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Chatbot and all associated conversations deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chatbot:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get embed code for a chatbot
 * @route GET /api/chatbots/:id/embed
 */
exports.getEmbedCode = async (req, res) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }
    
    // Generate embed code
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const embedCode = `<script src="${baseUrl}/widget.js" data-chatbot-id="${chatbot._id}"></script>`;
    
    res.status(200).json({
      success: true,
      data: {
        embedCode,
        chatbotId: chatbot._id,
        widgetUrl: `${baseUrl}/widget.js`
      },
      message: 'Embed code generated successfully'
    });
  } catch (error) {
    console.error('Error generating embed code:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get public chatbot info for the widget
 * @route GET /api/chatbots/:id/public
 */
exports.getPublicInfo = async (req, res) => {
  try {
    // Only return necessary public information
    const chatbot = await Chatbot.findById(req.params.id).select(
      'businessName businessDescription businessHours businessLocation services features industry'
    );
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: chatbot
    });
  } catch (error) {
    console.error('Error fetching public chatbot info:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};