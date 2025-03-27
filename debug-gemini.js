/**
 * Direct testing script that bypasses the application and tests Gemini API directly
 * Run with: node test-chatbot.js
 */
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration
const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
const businessName = "Sample Dental Practice";
const services = ["Regular check-ups", "Teeth cleaning", "Cosmetic dentistry"];
const businessHours = "Monday-Friday: 9:00 AM - 5:00 PM";
const testUserMessage = "Do you offer teeth whitening services?";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(apiKey);

// Generation configuration
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024
};

// Test different approaches and find what works
async function runTests() {
  console.log("=== GEMINI CHATBOT TESTING SCRIPT ===");
  console.log("Using model:", modelName);
  console.log("Testing with user message:", testUserMessage);
  console.log("\n");

  // Approach 1: Direct chat with system message in history
  try {
    console.log("=== TEST 1: Chat with system message in history ===");
    const model1 = genAI.getGenerativeModel({ model: modelName, generationConfig });
    
    const systemPrompt = `You are an AI assistant for a dental practice called ${businessName}. 
    You can assist with scheduling appointments, answering questions about services (${services.join(', ')}), 
    and providing basic information about the practice. Business hours are ${businessHours}.`;
    
    console.log("System prompt:", systemPrompt);
    
    const chat1 = model1.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `[System: ${systemPrompt}]` }],
        },
        {
          role: "model",
          parts: [{ text: "I understand and will follow these instructions." }],
        }
      ]
    });
    
    console.log("Sending user message:", testUserMessage);
    const result1 = await chat1.sendMessage(testUserMessage);
    const response1 = result1.response.text();
    console.log("RESPONSE:", response1);
    console.log("SUCCESS:", response1 !== "Thank you for your message. How else can I assist you today?");
    console.log("\n");
  } catch (error) {
    console.error("TEST 1 ERROR:", error.message);
  }

  // Approach 2: Direct content generation
  try {
    console.log("=== TEST 2: Direct generation with combined prompt ===");
    const model2 = genAI.getGenerativeModel({ model: modelName, generationConfig });
    
    const combinedPrompt = `You are an AI assistant for a dental practice called ${businessName}.
    You can assist with scheduling appointments, answering questions about services (${services.join(', ')}), 
    and providing basic information about the practice. Business hours are ${businessHours}.
    
    User: ${testUserMessage}
    
    Your response:`;
    
    console.log("Combined prompt:", combinedPrompt);
    
    const result2 = await model2.generateContent(combinedPrompt);
    const response2 = result2.response.text();
    console.log("RESPONSE:", response2);
    console.log("SUCCESS:", response2 !== "Thank you for your message. How else can I assist you today?");
    console.log("\n");
  } catch (error) {
    console.error("TEST 2 ERROR:", error.message);
  }

  // Approach 3: Chat with parts structure
  try {
    console.log("=== TEST 3: Chat with specific parts structure ===");
    const model3 = genAI.getGenerativeModel({ model: modelName, generationConfig });
    
    // Start chat with specific structure
    const chat3 = model3.startChat();
    
    // Add explicit instructions before the message
    const instructedMessage = `
    IMPORTANT: You are an AI assistant for ${businessName}, a dental practice.
    Services offered: ${services.join(', ')}
    Business hours: ${businessHours}
    
    RESPOND DIRECTLY TO THIS QUESTION: ${testUserMessage}
    
    DO NOT RESPOND WITH: "Thank you for your message. How else can I assist you today?"
    `;
    
    console.log("Structured message:", instructedMessage);
    
    const result3 = await chat3.sendMessage(instructedMessage);
    const response3 = result3.response.text();
    console.log("RESPONSE:", response3);
    console.log("SUCCESS:", response3 !== "Thank you for your message. How else can I assist you today?");
    console.log("\n");
  } catch (error) {
    console.error("TEST 3 ERROR:", error.message);
  }

  // Approach 4: Force a direct, simple response
  try {
    console.log("=== TEST 4: Ultra direct approach ===");
    const model4 = genAI.getGenerativeModel({ 
      model: modelName, 
      generationConfig: {
        ...generationConfig,
        temperature: 0.2,  // Lower temperature for more predictable response
      } 
    });
    
    const directPrompt = `
    INSTRUCTION: You are answering a question for a dental practice patient.
    
    PATIENT QUESTION: "${testUserMessage}"
    
    YOUR ANSWER MUST:
    1. Be specific to a dental practice
    2. Mention teeth whitening services
    3. Offer details about the service
    4. NOT be a generic message
    
    DIRECTLY ANSWER THE QUESTION:
    `;
    
    console.log("Direct prompt:", directPrompt);
    
    const result4 = await model4.generateContent(directPrompt);
    const response4 = result4.response.text();
    console.log("RESPONSE:", response4);
    console.log("SUCCESS:", response4 !== "Thank you for your message. How else can I assist you today?");
  } catch (error) {
    console.error("TEST 4 ERROR:", error.message);
  }

  console.log("\n=== TESTING COMPLETE ===");
}

// Run the tests
runTests();