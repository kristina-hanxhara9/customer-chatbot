const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

// Process a new message
router.post('/:chatbotId/messages', conversationController.processMessage);

// Get all conversations for a chatbot
router.get('/:chatbotId', conversationController.getConversations);

// Get or create a conversation
router.get('/:chatbotId/session', conversationController.getOrCreateConversation);

// Get a specific conversation
router.get('/:chatbotId/:conversationId', conversationController.getConversation);

// Submit feedback for a conversation
router.post('/:chatbotId/:conversationId/feedback', conversationController.submitFeedback);

module.exports = router;