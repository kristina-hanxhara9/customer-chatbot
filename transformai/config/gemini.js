/**
 * Gemini AI API Helper
 * Simplified version that can be used directly in controllers
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize the Google Generative AI SDK with proper error handling
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is not defined in environment variables');
}

// Initialize the client
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key-for-fallback-mode');

// Set the correct model name for Gemini Pro
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
console.log('Using Gemini model:', MODEL_NAME);

// Configure safety settings - less restrictive to allow business-specific responses
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
];

// Configure generation parameters for more varied responses
const generationConfig = {
  temperature: 0.8,          // Slightly higher temperature for more varied responses
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,     // Allow longer responses
  stopSequences: ["Thank you for your message. How else can I assist you today?"] // Prevent the default response
};

/**
 * Get a model instance with the specified configuration
 * @returns {GenerativeModel} A configured model instance
 */
function getModel() {
  try {
    if (!apiKey) {
      throw new Error('No API key provided');
    }
    
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      safetySettings,
      generationConfig,
    });
    
    return model;
  } catch (error) {
    console.error('Error getting Gemini model:', error);
    throw error;
  }
}

/**
 * Generate a direct response from a prompt
 * @param {string} prompt - The prompt to generate a response from
 * @returns {Promise<string>} The generated response
 */
async function generateResponse(prompt) {
  try {
    if (!apiKey) {
      return "I'm unable to connect to my AI service. Please try again later or contact support.";
    }
    
    console.log('Generating response for prompt:', prompt.substring(0, 100) + '...');
    
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Check for empty or generic responses
    if (!response || response.trim() === '' || 
        response === "Thank you for your message. How else can I assist you today?") {
      return "I'd be happy to help you with that. Could you provide a bit more detail about what you're looking for?";
    }
    
    return response;
  } catch (error) {
    console.error('Error generating response from Gemini:', error);
    return "I'm experiencing a technical issue right now. Please try again in a moment.";
  }
}

/**
 * Generate a response using chat history
 * @param {Array} messages - Array of message objects with role and content
 * @returns {Promise<string>} The generated response
 */
async function generateFromHistory(messages) {
  try {
    if (!apiKey) {
      return "I'm unable to connect to my AI service. Please try again later or contact support.";
    }
    
    if (!messages || messages.length === 0) {
      throw new Error('No messages provided for generating response');
    }
    
    console.log(`Generating response with ${messages.length} messages in history`);
    
    const model = getModel();
    
    // Format messages for Gemini
    const history = [];
    const formattedMessages = messages.slice(0, -1); // All except the last message
    
    for (const msg of formattedMessages) {
      if (msg.role === 'system') continue; // Skip system messages for history
      
      history.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }
    
    // Start a chat with history
    const chat = model.startChat({
      history: history.length > 0 ? history : undefined,
    });
    
    // Send the last message
    const result = await chat.sendMessage(lastMessage.content);
    const responseText = result.response.text();
    
    // Check for empty or generic responses
    if (!responseText || responseText.trim() === '' || 
        responseText === "Thank you for your message. How else can I assist you today?") {
      return "I'd be happy to help you with that. Could you provide a bit more detail about what you're looking for?";
    }
    
    return responseText;
  } catch (error) {
    console.error('Error generating response from history:', error);
    
    // Try with direct prompt as fallback
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      return generateResponse(`Please provide a helpful response to this user query: "${lastMessage.content}"`);
    }
    
    return "I'm experiencing a technical issue right now. Please try again in a moment.";
  }
}

module.exports = {
  getModel,
  generateResponse,
  generateFromHistory
};