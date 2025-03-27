const ChatbotConfig = require('../models/ChatbotConfig');

exports.createChatbotConfig = async (req, res) => {
  try {
    const { 
      industry, 
      businessName, 
      businessDescription, 
      services, 
      features, 
      aiPersonality,
      businessHours,
      aiPrompt
    } = req.body;

    const newConfig = new ChatbotConfig({
      userId: req.user._id, // Assuming you have authentication middleware
      industry,
      businessName,
      businessDescription,
      services,
      features,
      aiPersonality,
      businessHours,
      aiPrompt
    });

    const savedConfig = await newConfig.save();
    res.status(201).json(savedConfig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getChatbotConfig = async (req, res) => {
  try {
    const config = await ChatbotConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateChatbotConfig = async (req, res) => {
  try {
    const updatedConfig = await ChatbotConfig.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    res.json(updatedConfig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteChatbotConfig = async (req, res) => {
  try {
    await ChatbotConfig.findByIdAndDelete(req.params.id);
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};