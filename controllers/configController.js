// controllers/configController.js
const ChatbotConfig = require('../models/ChatbotConfig');

// Create a new chatbot configuration
exports.createChatbotConfig = async (req, res) => {
  try {
    const {
      userId,
      industry,
      businessName,
      businessDescription,
      services,
      features,
      aiPersonality,
      businessHours,
      aiPrompt
    } = req.body;

    // Validate required fields
    if (!userId || !industry || !businessName || !businessDescription) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId, industry, businessName, and businessDescription are required'
      });
    }

    const newConfig = new ChatbotConfig({
      userId,
      industry,
      businessName,
      businessDescription,
      services: services || [],
      features: features || [],
      aiPersonality: aiPersonality || 'friendly',
      businessHours: businessHours || 'standard',
      aiPrompt
    });

    const savedConfig = await newConfig.save();
    res.status(201).json(savedConfig);
  } catch (err) {
    console.error('Error creating chatbot config:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
};

// Get a chatbot configuration by ID
exports.getChatbotConfig = async (req, res) => {
  try {
    const configId = req.params.id;
    const config = await ChatbotConfig.findById(configId);
    
    if (!config) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Chatbot configuration not found'
      });
    }
    
    res.status(200).json(config);
  } catch (err) {
    console.error('Error retrieving chatbot config:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
};

// Update a chatbot configuration
exports.updateChatbotConfig = async (req, res) => {
  try {
    const configId = req.params.id;
    const updates = req.body;
    
    const config = await ChatbotConfig.findById(configId);
    if (!config) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Chatbot configuration not found'
      });
    }
    
    const updatedConfig = await ChatbotConfig.findByIdAndUpdate(
      configId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedConfig);
  } catch (err) {
    console.error('Error updating chatbot config:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
};

// Delete a chatbot configuration
exports.deleteChatbotConfig = async (req, res) => {
  try {
    const configId = req.params.id;
    
    const config = await ChatbotConfig.findById(configId);
    if (!config) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Chatbot configuration not found'
      });
    }
    
    await ChatbotConfig.findByIdAndDelete(configId);
    
    res.status(200).json({
      message: 'Chatbot configuration deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting chatbot config:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
};