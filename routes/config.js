const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.post('/create', configController.createChatbotConfig);
router.get('/:id', configController.getChatbotConfig);
router.put('/:id', configController.updateChatbotConfig);
router.delete('/:id', configController.deleteChatbotConfig);

module.exports = router;