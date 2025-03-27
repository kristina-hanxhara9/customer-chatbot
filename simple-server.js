/**
 * Simplified server for testing the chatbot response directly
 * Run with: node simple-server.js
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Express and middleware
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Set up Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

// Configuration options
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024
};

// Simplified endpoint to test chatbot responses
app.post('/api/chat', async (req, res) => {
  try {
    const { message, businessName, businessType, services, hours } = req.body;
    
    console.log('Received message:', message);
    console.log('Business context:', { businessName, businessType, services, hours });
    
    // Create a model instance
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig
    });
    
    // Create a system prompt
    const systemPrompt = `
    You are an AI assistant for a ${businessType} called ${businessName}.
    You can assist with information about services (${services.join(', ')}), 
    and providing basic information about the business.
    Business hours are ${hours}.
    
    IMPORTANT: Do not respond with "Thank you for your message. How else can I assist you today?"
    or any other generic response. Provide specific information based on the context above.
    
    User message: ${message}
    
    Your specific response:
    `;
    
    console.log('System prompt:', systemPrompt);
    
    // Generate a response
    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();
    
    console.log('Generated response:', response);
    
    // Send response
    res.json({
      success: true,
      message: response
    });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Serve a simple test page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chatbot Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .chat-container { border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
        .message { margin-bottom: 10px; padding: 10px; border-radius: 8px; }
        .user { background-color: #e6f7ff; text-align: right; }
        .bot { background-color: #f2f2f2; }
        textarea { width: 100%; padding: 10px; margin-bottom: 10px; }
        button { padding: 10px 20px; background-color: #4a6cf7; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .settings { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px; }
        .settings input, .settings select { width: 100%; padding: 8px; margin-bottom: 10px; }
        h3 { margin-top: 15px; }
      </style>
    </head>
    <body>
      <h1>Chatbot Direct Test</h1>
      <p>This page tests the chatbot directly using the Gemini API, bypassing any complex middleware.</p>
      
      <div class="settings">
        <h3>Business Settings</h3>
        <input type="text" id="businessName" placeholder="Business Name" value="Smile Bright Dental">
        <select id="businessType">
          <option value="dental practice">Dental Practice</option>
          <option value="real estate agency">Real Estate Agency</option>
          <option value="restaurant">Restaurant</option>
          <option value="fitness studio">Fitness Studio</option>
        </select>
        <input type="text" id="services" placeholder="Services (comma separated)" value="Regular check-ups, Teeth cleaning, Cosmetic dentistry">
        <input type="text" id="hours" placeholder="Business Hours" value="Monday-Friday: 9:00 AM - 5:00 PM">
      </div>
      
      <div class="chat-container" id="chat">
        <div class="message bot">Hi there! How can I help you today?</div>
      </div>
      
      <div style="margin-top: 20px;">
        <textarea id="message" rows="4" placeholder="Type your message here..."></textarea>
        <button id="send">Send Message</button>
      </div>
      
      <script>
        document.getElementById('send').addEventListener('click', async () => {
          const messageInput = document.getElementById('message');
          const message = messageInput.value.trim();
          
          if (!message) return;
          
          // Add user message to chat
          const chat = document.getElementById('chat');
          const userDiv = document.createElement('div');
          userDiv.className = 'message user';
          userDiv.textContent = message;
          chat.appendChild(userDiv);
          
          // Clear input
          messageInput.value = '';
          
          // Get business context
          const businessName = document.getElementById('businessName').value;
          const businessType = document.getElementById('businessType').value;
          const services = document.getElementById('services').value.split(',').map(s => s.trim());
          const hours = document.getElementById('hours').value;
          
          try {
            // Show loading
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message bot';
            loadingDiv.textContent = 'Thinking...';
            chat.appendChild(loadingDiv);
            
            // Send message to API
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message,
                businessName,
                businessType,
                services,
                hours
              }),
            });
            
            const data = await response.json();
            
            // Remove loading message
            chat.removeChild(loadingDiv);
            
            // Add bot response
            const botDiv = document.createElement('div');
            botDiv.className = 'message bot';
            botDiv.textContent = data.message;
            chat.appendChild(botDiv);
            
            // Scroll to bottom
            chat.scrollTop = chat.scrollHeight;
          } catch (error) {
            console.error('Error:', error);
            
            // Remove loading message
            chat.removeChild(loadingDiv);
            
            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message bot';
            errorDiv.textContent = 'Sorry, there was an error processing your request.';
            chat.appendChild(errorDiv);
          }
        });
        
        // Allow sending with Enter key
        document.getElementById('message').addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('send').click();
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});