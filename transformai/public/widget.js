/**
 * TransformAI Chatbot Widget
 * Embed this script in your website to add your custom AI chatbot
 * Usage: <script src="https://your-server.com/widget.js" data-chatbot-id="your-chatbot-id"></script>
 */
(function() {
  // Configuration
  const WIDGET_VERSION = '1.0.0';
  
  // Get current script tag to extract the chatbot ID
  const scriptTag = document.currentScript;
  const CHATBOT_ID = scriptTag.getAttribute('data-chatbot-id');
  
  // Base URL detection (change to your actual domain in production)
  const BASE_URL = (() => {
    // Try to get base URL from the script src
    const scriptSrc = scriptTag.src;
    const srcUrl = new URL(scriptSrc);
    return `${srcUrl.protocol}//${srcUrl.host}`;
  })();
  
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
  
  // CSS Styles for the widget
  const styles = `
    #transformai-widget-container {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 350px;
      height: 500px;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
      display: none;
      flex-direction: column;
      z-index: 999999;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    
    #transformai-widget-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #4a6cf7;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      z-index: 999999;
      transition: all 0.3s ease;
    }
    
    #transformai-widget-button:hover {
      transform: scale(1.05);
    }
    
    #transformai-widget-button i {
      font-size: 24px;
    }
    
    .transformai-widget-header {
      padding: 15px;
      background-color: #4a6cf7;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }
    
    .transformai-widget-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .transformai-widget-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 24px;
      height: 24px;
      padding: 0;
    }
    
    .transformai-widget-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .transformai-chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .transformai-message {
      max-width: 80%;
      padding: 10px 12px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .transformai-message-user {
      align-self: flex-end;
      background-color: #4a6cf7;
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .transformai-message-bot {
      align-self: flex-start;
      background-color: #f5f5f5;
      color: #333;
      border-bottom-left-radius: 4px;
    }
    
    .transformai-message-typing {
      align-self: flex-start;
      background-color: #f5f5f5;
      padding: 12px 16px;
      border-radius: 18px;
      border-bottom-left-radius: 4px;
      display: none;
    }
    
    .transformai-typing-bubble {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 5px;
      border-radius: 50%;
      background-color: #b6b6b6;
      animation: typing-animation 1.4s infinite ease-in-out both;
    }
    
    .transformai-typing-bubble:nth-child(1) {
      animation-delay: 0s;
    }
    
    .transformai-typing-bubble:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .transformai-typing-bubble:nth-child(3) {
      animation-delay: 0.4s;
      margin-right: 0;
    }
    
    @keyframes typing-animation {
      0%, 80%, 100% { transform: scale(0.6); }
      40% { transform: scale(1); }
    }
    
    .transformai-chat-input {
      display: flex;
      border-top: 1px solid #e6e6e6;
      padding: 10px;
    }
    
    .transformai-chat-input input {
      flex: 1;
      padding: 10px 15px;
      border: 1px solid #e6e6e6;
      border-radius: 20px;
      font-size: 14px;
      outline: none;
    }
    
    .transformai-chat-input button {
      background-color: #4a6cf7;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      margin-left: 8px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .transformai-chat-input button:disabled {
      background-color: #b6b6b6;
      cursor: not-allowed;
    }
    
    .transformai-business-info {
      padding: 15px;
      border-top: 1px solid #e6e6e6;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    
    .transformai-powered-by {
      font-size: 11px;
      color: #999;
    }
    
    .transformai-powered-by a {
      color: #4a6cf7;
      text-decoration: none;
    }
    
    /* Mobile responsive styles */
    @media (max-width: 480px) {
      #transformai-widget-container {
        width: calc(100% - 32px);
        height: calc(100% - 140px);
        bottom: 80px;
      }
    }
  `;
  
  // Add Font Awesome for icons
  function loadFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }
  
  // Load CSS
  function loadStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
  
  // Create widget DOM elements
  function createWidgetElements() {
    // Chat button
    const widgetButton = document.createElement('div');
    widgetButton.id = 'transformai-widget-button';
    widgetButton.innerHTML = '<i class="fas fa-comments"></i>';
    document.body.appendChild(widgetButton);
    
    // Chat container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'transformai-widget-container';
    
    // Chat header
    const widgetHeader = document.createElement('div');
    widgetHeader.className = 'transformai-widget-header';
    widgetHeader.innerHTML = `
      <h3>Chat with us</h3>
      <button class="transformai-widget-close">&times;</button>
    `;
    
    // Chat body
    const widgetBody = document.createElement('div');
    widgetBody.className = 'transformai-widget-body';
    
    // Chat messages container
    const chatMessages = document.createElement('div');
    chatMessages.className = 'transformai-chat-messages';
    
    // Typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'transformai-message-typing';
    typingIndicator.innerHTML = `
      <div class="transformai-typing-bubble"></div>
      <div class="transformai-typing-bubble"></div>
      <div class="transformai-typing-bubble"></div>
    `;
    chatMessages.appendChild(typingIndicator);
    
    // Chat input
    const chatInput = document.createElement('div');
    chatInput.className = 'transformai-chat-input';
    chatInput.innerHTML = `
      <input type="text" placeholder="Type your message here..." />
      <button type="button"><i class="fas fa-paper-plane"></i></button>
    `;
    
    // Business info footer
    const businessInfo = document.createElement('div');
    businessInfo.className = 'transformai-business-info';
    businessInfo.innerHTML = `
      <div class="transformai-powered-by">
        Powered by <a href="https://transform-ai-solutions.onrender.com" target="_blank">TransformAI</a>
      </div>
    `;
    
    // Assemble the widget
    widgetBody.appendChild(chatMessages);
    widgetBody.appendChild(chatInput);
    
    widgetContainer.appendChild(widgetHeader);
    widgetContainer.appendChild(widgetBody);
    widgetContainer.appendChild(businessInfo);
    
    document.body.appendChild(widgetContainer);
    
    return {
      widgetButton,
      widgetContainer,
      chatMessages,
      chatInput: chatInput.querySelector('input'),
      sendButton: chatInput.querySelector('button'),
      closeButton: widgetHeader.querySelector('.transformai-widget-close'),
      typingIndicator,
      headerTitle: widgetHeader.querySelector('h3')
    };
  }
  
  // Fetch chatbot public info
  async function fetchChatbotInfo() {
    try {
      const response = await fetch(`${BASE_URL}/api/chatbots/${CHATBOT_ID}/public`);
      if (!response.ok) {
        throw new Error('Failed to fetch chatbot info');
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('TransformAI Widget Error:', error);
      return null;
    }
  }
  
  // Get or create a conversation
  async function getOrCreateConversation(sessionId) {
    try {
      const response = await fetch(`${BASE_URL}/api/conversations/${CHATBOT_ID}/session?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to get conversation');
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('TransformAI Widget Error:', error);
      return null;
    }
  }
  
  // Send message to API
  async function sendMessage(message, sessionId) {
    try {
      // Get browser metadata
      const metadata = {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        url: window.location.href,
        language: navigator.language
      };
      
      const response = await fetch(`${BASE_URL}/api/conversations/${CHATBOT_ID}/messages`, {
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
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('TransformAI Widget Error:', error);
      return { 
        message: "I'm sorry, I couldn't process your request. Please try again later."
      };
    }
  }
  
  // Add a message to the chat
  function addMessage(elements, content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `transformai-message transformai-message-${isUser ? 'user' : 'bot'}`;
    messageDiv.textContent = content;
    
    // Add before the typing indicator
    elements.chatMessages.insertBefore(messageDiv, elements.typingIndicator);
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }
  
  // Add multiple messages from history
  function loadMessages(elements, messages) {
    // Clear existing messages
    const existingMessages = elements.chatMessages.querySelectorAll('.transformai-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Add each message
    messages.forEach(msg => {
      addMessage(elements, msg.content, msg.role === 'user');
    });
  }
  
  // Show typing indicator
  function showTypingIndicator(elements) {
    elements.typingIndicator.style.display = 'block';
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }
  
  // Hide typing indicator
  function hideTypingIndicator(elements) {
    elements.typingIndicator.style.display = 'none';
  }
  
  // Save conversation state to localStorage
  function saveState(sessionId) {
    localStorage.setItem(`transformai_session_${CHATBOT_ID}`, sessionId);
  }
  
  // Initialize widget
  async function initWidget() {
    // Check if CHATBOT_ID is provided
    if (!CHATBOT_ID) {
      console.error('TransformAI Widget Error: No chatbot ID provided. Add the data-chatbot-id attribute to the script tag.');
      return;
    }
    
    // Load dependencies
    loadFontAwesome();
    loadStyles();
    
    // Create widget elements
    const elements = createWidgetElements();
    
    // Get session ID
    const sessionId = getSessionId();
    
    // Fetch chatbot info and existing conversation
    const chatbotInfo = await fetchChatbotInfo();
    const conversation = await getOrCreateConversation(sessionId);
    
    // Update widget with chatbot info
    if (chatbotInfo) {
      elements.headerTitle.textContent = `Chat with ${chatbotInfo.businessName}`;
    }
    
    // Load existing messages if available
    if (conversation && conversation.messages) {
      loadMessages(elements, conversation.messages);
      saveState(conversation.sessionId);
    } else {
      // Add default welcome message if no conversation found
      addMessage(elements, "Hi there! How can I help you today?");
    }
    
    // Toggle widget visibility
    elements.widgetButton.addEventListener('click', () => {
      elements.widgetContainer.style.display = 'flex';
      elements.chatInput.focus();
    });
    
    elements.closeButton.addEventListener('click', () => {
      elements.widgetContainer.style.display = 'none';
    });
    
    // Handle sending messages
    const handleSendMessage = async () => {
      const message = elements.chatInput.value.trim();
      
      if (message) {
        // Clear input
        elements.chatInput.value = '';
        
        // Add user message to chat
        addMessage(elements, message, true);
        
        // Disable send button during processing
        elements.sendButton.disabled = true;
        
        // Show typing indicator
        showTypingIndicator(elements);
        
        // Get AI response
        const response = await sendMessage(message, sessionId);
        
        // Hide typing indicator
        hideTypingIndicator(elements);
        
        // Add AI response to chat
        if (response && response.message) {
          addMessage(elements, response.message);
        } else {
          addMessage(elements, "I'm sorry, I couldn't process your request. Please try again later.");
        }
        
        // Re-enable send button
        elements.sendButton.disabled = false;
        
        // Focus on input
        elements.chatInput.focus();
      }
    };
    
    // Send message on button click
    elements.sendButton.addEventListener('click', handleSendMessage);
    
    // Send message on Enter key
    elements.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    });
  }
  
  // Wait for the page to fully load
  if (document.readyState === 'complete') {
    initWidget();
  } else {
    window.addEventListener('load', initWidget);
  }
})();