/**
 * TransformAI Integrated Widget
 * This script connects your existing HTML chat interface to the TransformAI backend
 */
(function() {
  // Configuration - replace with your actual chatbot ID
  const CHATBOT_ID = 'YOUR_CHATBOT_ID_HERE';
  
  // Base URL detection (change to your actual domain in production)
  const BASE_URL = window.location.origin; // Or set explicitly like 'https://your-server.com'
  
  // DOM Elements - these should match your existing HTML structure
  const elements = {
      chatMessages: document.getElementById('chat-messages'),
      userInput: document.getElementById('user-input'),
      sendButton: document.getElementById('send-button'),
      typingIndicator: document.getElementById('typing-indicator'),
      welcomeMessage: document.getElementById('welcome-message'),
      chatTitle: document.getElementById('chat-title'),
      businessPanelName: document.getElementById('business-panel-name'),
      aboutText: document.getElementById('about-text'),
      servicesList: document.getElementById('services-list'),
      featuresList: document.getElementById('features-list'),
      hoursText: document.getElementById('hours-text'),
      locationText: document.getElementById('location-text')
  };
  
  // Generate a unique session ID for this visitor or get existing one
  function getSessionId() {
      const storageKey = `transformai_session_${CHATBOT_ID}`;
      let sessionId = localStorage.getItem(storageKey);
      
      if (!sessionId) {
          sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
          localStorage.setItem(storageKey, sessionId);
      }
      
      return sessionId;
  }
  
  // Session ID for this conversation
  const sessionId = getSessionId();
  
  // Add a message to the chat - works with your existing HTML structure
  function addMessage(content, isUser = false) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message message-${isUser ? 'user' : 'bot'}`;
      
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.textContent = content;
      
      messageDiv.appendChild(messageContent);
      
      // Add before the typing indicator if it exists
      if (elements.typingIndicator) {
          elements.chatMessages.insertBefore(messageDiv, elements.typingIndicator);
      } else {
          // Otherwise just append to the end
          elements.chatMessages.appendChild(messageDiv);
      }
      
      // Scroll to bottom
      elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
      
      return messageDiv;
  }
  
  // Show typing indicator
  function showTypingIndicator() {
      if (elements.typingIndicator) {
          elements.typingIndicator.style.display = 'block';
          elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
      }
  }
  
  // Hide typing indicator
  function hideTypingIndicator() {
      if (elements.typingIndicator) {
          elements.typingIndicator.style.display = 'none';
      }
  }
  
  // Load messages from history
  function loadMessages(messages) {
      // Clear any existing messages except the welcome message and typing indicator
      const existingMessages = elements.chatMessages.querySelectorAll('.message:not(:first-child)');
      existingMessages.forEach(msg => {
          if (msg !== elements.typingIndicator) {
              msg.remove();
          }
      });
      
      // Add each message
      if (messages && messages.length > 0) {
          messages.forEach(msg => {
              // Skip the first assistant message if we already have a welcome message
              if (msg.role === 'assistant' && messages.indexOf(msg) === 0 && elements.welcomeMessage) {
                  elements.welcomeMessage.textContent = msg.content;
                  return;
              }
              
              addMessage(msg.content, msg.role === 'user');
          });
      }
  }
  
  // Fetch chatbot public info
  async function fetchChatbotInfo() {
      try {
          const response = await fetch(`${BASE_URL}/api/chatbots/${CHATBOT_ID}/public`);
          if (!response.ok) {
              console.error('Error fetching chatbot info:', response.statusText);
              return null;
          }
          const data = await response.json();
          return data.success ? data.data : null;
      } catch (error) {
          console.error('Error fetching chatbot info:', error);
          return null;
      }
  }
  
  // Get or create a conversation
  async function getOrCreateConversation() {
      try {
          const response = await fetch(`${BASE_URL}/api/${CHATBOT_ID}/conversation?sessionId=${sessionId}`);
          if (!response.ok) {
              console.error('Error getting conversation:', response.statusText);
              return null;
          }
          
          const data = await response.json();
          return data.success ? data.data : null;
      } catch (error) {
          console.error('Error getting conversation:', error);
          return null;
      }
  }
  
  // Send message to API
  async function sendMessage(message) {
      try {
          const metadata = {
              userAgent: navigator.userAgent,
              referrer: document.referrer,
              url: window.location.href,
              language: navigator.language
          };
          
          const response = await fetch(`${BASE_URL}/api/${CHATBOT_ID}/messages`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  message,
                  sessionId,
                  metadata
              })
          });
          
          if (!response.ok) {
              throw new Error(`Failed to send message: ${response.statusText}`);
          }
          
          const data = await response.json();
          return data.success ? data.data : null;
      } catch (error) {
          console.error('Error sending message:', error);
          return { 
              message: "I'm sorry, I couldn't process your request. Please try again later."
          };
      }
  }
  
  // Initialize the chat
  async function initChat() {
      // Get chatbot info
      const chatbotInfo = await fetchChatbotInfo();
      
      if (chatbotInfo) {
          console.log('Chatbot info loaded:', chatbotInfo.businessName);
          
          // Update business info elements with chatbot data
          if (elements.chatTitle) {
              elements.chatTitle.textContent = `${chatbotInfo.businessName} AI Assistant`;
          }
          
          if (elements.businessPanelName) {
              elements.businessPanelName.textContent = chatbotInfo.businessName;
          }
          
          if (elements.aboutText && chatbotInfo.businessDescription) {
              elements.aboutText.textContent = chatbotInfo.businessDescription;
          }
          
          if (elements.hoursText && chatbotInfo.businessHours) {
              elements.hoursText.textContent = chatbotInfo.businessHours;
          }
          
          // Update services list
          if (elements.servicesList && chatbotInfo.services && chatbotInfo.services.length > 0) {
              elements.servicesList.innerHTML = '';
              chatbotInfo.services.forEach(service => {
                  const li = document.createElement('li');
                  li.textContent = service;
                  elements.servicesList.appendChild(li);
              });
          }
          
          // Update features list (if available)
          if (elements.featuresList && chatbotInfo.features && chatbotInfo.features.length > 0) {
              elements.featuresList.innerHTML = '';
              chatbotInfo.features.forEach(feature => {
                  const li = document.createElement('li');
                  li.textContent = feature;
                  elements.featuresList.appendChild(li);
              });
          }
      } else {
          console.warn('Could not load chatbot info, using default values');
      }
      
      // Get or create conversation
      const conversation = await getOrCreateConversation();
      
      if (conversation) {
          console.log('Conversation loaded, session ID:', conversation.sessionId);
          
          if (conversation.messages && conversation.messages.length > 0) {
              // Load existing messages
              loadMessages(conversation.messages);
          }
      } else {
          console.warn('Could not load conversation, using default welcome message');
          // The default welcome message will remain from your HTML
      }
  }
  
  // Handle sending messages
  async function handleSendMessage() {
      const message = elements.userInput.value.trim();
      
      if (message) {
          // Clear input
          elements.userInput.value = '';
          
          // Add user message to chat
          addMessage(message, true);
          
          // Disable send button while processing
          elements.sendButton.disabled = true;
          
          // Show typing indicator
          showTypingIndicator();
          
          // Send to API and get response
          const response = await sendMessage(message);
          
          // Hide typing indicator
          hideTypingIndicator();
          
          // Add AI response
          if (response && response.message) {
              addMessage(response.message);
          } else {
              addMessage("I'm sorry, I couldn't process your request. Please try again later.");
          }
          
          // Re-enable send button
          elements.sendButton.disabled = false;
          
          // Focus on input
          elements.userInput.focus();
      }
  }
  
  // Wait for page to be fully loaded
  function initialize() {
      // Check if all needed elements exist
      if (!elements.chatMessages || !elements.userInput || !elements.sendButton) {
          console.error('TransformAI Widget: Required chat elements not found in the DOM');
          return;
      }
      
      // Set up event listeners
      elements.sendButton.addEventListener('click', handleSendMessage);
      
      elements.userInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
              handleSendMessage();
          }
      });
      
      // Initialize chat
      initChat();
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
  } else {
      initialize();
  }
})();