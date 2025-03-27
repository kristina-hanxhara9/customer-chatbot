const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize the Google Generative AI SDK with proper error handling
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is not defined in environment variables');
  process.exit(1); // Exit early if no API key is found
}

const genAI = new GoogleGenerativeAI(apiKey);

// Set the correct model name for Gemini 1.5 Pro
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
const getModel = () => {
  try {
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
};

/**
 * Generate a response from formatted conversation history
 * @param {Array} messages - Formatted conversation history
 * @returns {Promise<string>} The model's response
 */
const generateFromHistory = async (messages) => {
  try {
    if (!messages || messages.length === 0) {
      throw new Error('No messages provided for generating response');
    }
    
    console.log('Generating response with message history:', JSON.stringify(messages, null, 2));
    
    const model = getModel();
    
    // In the new format, we need the last message to be a user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }
    
    // Prepare chat history (all messages except the last one)
    const history = [];
    
    // Format messages properly for Gemini chat
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      history.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }
    
    console.log('Chat history for Gemini:', JSON.stringify(history, null, 2));
    console.log('Last message:', lastMessage.content);
    
    // Start a chat with history
    const chat = model.startChat({
      history: history.length > 0 ? history : undefined,
    });
    
    // Send the last message
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    const responseText = response.text();
    
    console.log('Gemini response:', responseText);
    
    // If we somehow still got the generic response, try once more with a direct approach
    if (responseText === "Thank you for your message. How else can I assist you today?") {
      console.log('WARNING: Got generic response, trying direct approach...');
      return await generateSingleResponse(`Please provide a helpful and specific response to this user query: "${lastMessage.content}". Do not reply with the generic phrase "Thank you for your message. How else can I assist you today?"`);
    }
    
    return responseText;
  } catch (error) {
    console.error('Error generating response from Gemini:', error);
    // Try the fallback approach
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      return await generateSingleResponse(`Please provide a helpful and specific response to this user query: "${lastMessage.content}"`);
    }
    throw error;
  }
};

/**
 * Generate a single response without chat history
 * @param {string} prompt - The prompt to send to the model
 * @returns {Promise<string>} The model's response
 */
const generateSingleResponse = async (prompt) => {
  try {
    console.log('Generating single response from Gemini:', prompt);
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();
    console.log('Gemini single response:', responseText);
    
    // In case we still get the generic response
    if (responseText === "Thank you for your message. How else can I assist you today?") {
      return "I'd be happy to help with your question. Could you provide a bit more detail about what you're looking for?";
    }
    
    return responseText;
  } catch (error) {
    console.error('Error generating single response from Gemini:', error);
    return "I'm sorry, I'm having trouble generating a response at the moment. Can you try asking your question again or phrasing it differently?";
  }
};

module.exports = {
  getModel,
  generateFromHistory,
  generateSingleResponse,
};