const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Create a new chatbot
router.post('/', chatbotController.createChatbot);

// Get all chatbots for a user
router.get('/', chatbotController.getChatbots);

// Get a single chatbot
router.get('/:id', chatbotController.getChatbot);

// Update a chatbot
router.put('/:id', chatbotController.updateChatbot);

// Delete a chatbot
router.delete('/:id', chatbotController.deleteChatbot);

// Get embed code for a chatbot
router.get('/:id/embed', chatbotController.getEmbedCode);

// Get public chatbot info (used by the widget)
router.get('/:id/public', chatbotController.getPublicInfo);

module.exports = router;