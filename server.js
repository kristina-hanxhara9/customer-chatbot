const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('MONGODB_URI from env:', process.env.MONGODB_URI ? 'defined' : 'undefined');
console.log('GEMINI_API_KEY from env:', process.env.GEMINI_API_KEY ? 'defined' : 'undefined');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'transformai/public')));

// Import routes
const chatbotRoutes = require('./transformai/routes/chatbotRoutes');
const conversationRoutes = require('./transformai/routes/conversationRoutes');

// Basic route for testing
app.get('/', (req, res) => {
  res.send('TransformAI API is running');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    
    // Only set up routes after DB connection is established
    // Routes
    app.use('/api/chatbots', chatbotRoutes);
    app.use('/api/conversations', conversationRoutes);
    
    // Serve widget.js
    app.get('/widget.js', (req, res) => {
      res.sendFile(path.join(__dirname, 'transformai', 'public', 'widget.js'));
    });
    
    // Start server after successful DB connection
    app.listen(PORT, () => {
      console.log(`TransformAI server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit with error code
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  });
});