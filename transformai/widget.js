/**
 * TransformAI Widget
 * Embeddable chatbot widget that businesses can add to their websites
 */

(function() {
    // Globals
    var businessId = null;
    var apiUrl = 'https://api.transform-ai.com';
    var sessionId = generateSessionId();
    var chatHistory = [];
  
    // Widget DOM elements
    var widgetButton;
    var widgetContainer;
    var chatMessages;
    var userInput;
    var sendButton;
    var typingIndicator;
    
    // Initialize the widget
    window.transformAI = function(action, id, options) {
      if (action === 'init') {
        businessId = id;
        initialize(options || {});
      } else if (action === 'open') {
        openWidget();
      } else if (action === 'close') {
        closeWidget();
      } else if (action === 'destroy') {
        destroyWidget();
      }
    };
    
    // Main initialization
    function initialize(options) {
      // Merge default options with provided options
      var settings = Object.assign({
        primaryColor: '#ff4a17',
        position: 'right', // 'right' or 'left'
        greeting: 'Hi there! How can I help you today?',
        placeholder: 'Type your message here...',
        title: 'Chat with us'
      }, options);
      
      // Create and append widget HTML
      createWidgetHTML(settings);
      
      // Attach event listeners
      attachEventListeners();
      
      // Load chatbot configuration from server
      loadChatbotConfig(businessId);
    }
    
    // Create widget HTML structure
    function createWidgetHTML(settings) {
      // Create widget button
      widgetButton = document.createElement('div');
      widgetButton.id = 'transform-ai-widget-button';
      widgetButton.innerHTML = '<i class="fas fa-comments"></i>';
      widgetButton.style.backgroundColor = settings.primaryColor;
      widgetButton.style[settings.position] = '20px';
      document.body.appendChild(widgetButton);
      
      // Create widget container
      widgetContainer = document.createElement('div');
      widgetContainer.id = 'transform-ai-widget-container';
      widgetContainer.style[settings.position] = '20px';
      widgetContainer.style.display = 'none';
      widgetContainer.innerHTML = `
        <div class="widget-header" style="background-color: ${settings.primaryColor}">
          <h3>${settings.title}</h3>
          <button class="widget-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="widget-body">
          <div class="chat-messages" id="transform-ai-chat-messages">
            <div class="message message-bot">
              <div class="message-content">${settings.greeting}</div>
            </div>
            <div class="message-typing" id="transform-ai-typing" style="display: none">
              <div class="message-content">
                <div class="typing-bubble"></div>
                <div class="typing-bubble"></div>
                <div class="typing-bubble"></div>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <input type="text" id="transform-ai-input" placeholder="${settings.placeholder}" />
            <button id="transform-ai-send" style="background-color: ${settings.primaryColor}">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      `;
      
      // Append styles
      var styleEl = document.createElement('style');
      styleEl.textContent = getWidgetStyles(settings.primaryColor);
      document.head.appendChild(styleEl);
      
      // Add Font Awesome if not already present
      if (!document.querySelector('link[href*="font-awesome"]')) {
        var faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(faLink);
      }
      
      // Append widget container to body
      document.body.appendChild(widgetContainer);
      
      // Set references to DOM elements
      chatMessages = document.getElementById('transform-ai-chat-messages');
      userInput = document.getElementById('transform-ai-input');
      sendButton = document.getElementById('transform-ai-send');
      typingIndicator = document.getElementById('transform-ai-typing');
    }
    
    // Attach event listeners to widget elements
    function attachEventListeners() {
      // Toggle widget on button click
      widgetButton.addEventListener('click', function() {
        toggleWidget();
      });
      
      // Close widget
      document.querySelector('.widget-close').addEventListener('click', function() {
        closeWidget();
      });
      
      // Send message on button click
      sendButton.addEventListener('click', function() {
        sendMessage();
      });
      
      // Send message on Enter key
      userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }
    
    // Load chatbot configuration from server
    function loadChatbotConfig(businessId) {
      fetch(`${apiUrl}/api/config/${businessId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Chatbot configuration loaded');
            // You could customize the widget based on config here
          }
        })
        .catch(error => {
          console.error('Failed to load chatbot configuration:', error);
        });
    }
    
    // Send message to server and handle response
    function sendMessage() {
      var message = userInput.value.trim();
      if (!message) return;
      
      // Add user message to chat
      addMessage(message, true);
      
      // Clear input
      userInput.value = '';
      
      // Show typing indicator
      typingIndicator.style.display = 'block';
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Send to server
      fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: businessId,
          message: message,
          sessionId: sessionId
        }),
      })
      .then(response => response.json())
      .then(data => {
        // Hide typing indicator
        typingIndicator.style.display = 'none';
        
        if (data.success) {
          // Add bot response to chat
          addMessage(data.response, false);
        } else {
          // Add error message
          addMessage("I'm sorry, I'm having trouble connecting right now. Please try again later.", false);
        }
      })
      .catch(error => {
        // Hide typing indicator
        typingIndicator.style.display = 'none';
        
        // Add error message
        addMessage("I'm sorry, I'm having trouble connecting right now. Please try again later.", false);
        console.error('Error:', error);
      });
    }
    
    // Add a message to the chat
    function addMessage(content, isUser) {
      var messageDiv = document.createElement('div');
      messageDiv.className = `message message-${isUser ? 'user' : 'bot'}`;
      
      var messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.textContent = content;
      
      messageDiv.appendChild(messageContent);
      chatMessages.insertBefore(messageDiv, typingIndicator);
      
      // Store in chat history
      chatHistory.push({
        role: isUser ? 'user' : 'bot',
        content: content,
        timestamp: new Date().toISOString()
      });
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Toggle widget visibility
    function toggleWidget() {
      if (widgetContainer.style.display === 'block') {
        closeWidget();
      } else {
        openWidget();
      }
    }
    
    // Open widget
    function openWidget() {
      widgetContainer.style.display = 'block';
      userInput.focus();
      
      // Record session start in analytics
      recordAnalytics('session_start');
    }
    
    // Close widget
    function closeWidget() {
      widgetContainer.style.display = 'none';
      
      // Record session end in analytics
      recordAnalytics('session_end');
    }
    
    // Destroy widget (remove from DOM)
    function destroyWidget() {
      if (widgetButton && widgetButton.parentNode) {
        widgetButton.parentNode.removeChild(widgetButton);
      }
      
      if (widgetContainer && widgetContainer.parentNode) {
        widgetContainer.parentNode.removeChild(widgetContainer);
      }
    }
    
    // Record analytics events
    function recordAnalytics(eventType) {
      fetch(`${apiUrl}/api/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: businessId,
          sessionId: sessionId,
          eventType: eventType,
          url: window.location.href,
          referrer: document.referrer
        }),
      }).catch(error => {
        console.error('Analytics error:', error);
      });
    }
    
    // Generate a unique session ID
    function generateSessionId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    // Get widget CSS styles
    function getWidgetStyles(primaryColor) {
      return `
        #transform-ai-widget-button {
          position: fixed;
          bottom: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: ${primaryColor};
          color: white;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 999999;
          border: none;
        }
        
        #transform-ai-widget-button:hover {
          transform: scale(1.1);
        }
        
        #transform-ai-widget-button i {
          font-size: 24px;
        }
        
        #transform-ai-widget-container {
          position: fixed;
          bottom: 90px;
          width: 360px;
          height: 500px;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          overflow: hidden;
          z-index: 999998;
          display: none;
        }
        
        .widget-header {
          padding: 15px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .widget-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .widget-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
        }
        
        .widget-body {
          display: flex;
          flex-direction: column;
          height: calc(100% - 50px);
        }
        
        .chat-messages {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          background-color: #f5f7f9;
        }
        
        .message {
          margin-bottom: 15px;
          max-width: 80%;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .message-user {
          margin-left: auto;
        }
        
        .message-content {
          padding: 12px 16px;
          border-radius: 18px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .message-user .message-content {
          background-color: ${primaryColor};
          color: white;
          border-bottom-right-radius: 3px;
        }
        
        .message-bot .message-content {
          background-color: white;
          color: #333;
          border-bottom-left-radius: 3px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .message-typing {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .typing-bubble {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 5px;
          background-color: #ccc;
          border-radius: 50%;
          animation: typing 1s infinite;
        }
        
        .typing-bubble:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-bubble:nth-child(3) {
          animation-delay: 0.4s;
          margin-right: 0;
        }
        
        @keyframes typing {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        .chat-input {
          padding: 15px;
          background-color: white;
          border-top: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
        }
        
        .chat-input input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          font-size: 14px;
          outline: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .chat-input input:focus {
          border-color: ${primaryColor};
        }
        
        .chat-input button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-left: 10px;
          cursor: pointer;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chat-input button i {
          font-size: 16px;
        }
        
        @media (max-width: 480px) {
          #transform-ai-widget-container {
            width: 90%;
            right: 5%;
            left: 5%;
          }
        }
      `;
    }
  })();