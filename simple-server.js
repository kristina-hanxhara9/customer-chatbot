// HTML test page similar to simple-server.js
app.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TransformAI Chatbot Test</title>
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
      <h1>TransformAI Chatbot Test</h1>
      <p>This page tests the chatbot using the complete server implementation.</p>
      
      <div class="settings">
        <h3>Business Settings</h3>
        <input type="text" id="businessId" placeholder="Business ID" value="test-business-1">
        <input type="text" id="userId" placeholder="User ID" value="test-user-1">
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
        document.addEventListener('DOMContentLoaded', function() {
            const chatContainer = document.getElementById('chat');
            const messageInput = document.getElementById('message');
            const sendButton = document.getElementById('send');
            
            // Function to add a message to the chat
            function addMessage(content, isUser = false) {
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${isUser ? 'user' : 'bot'}\`;
                messageDiv.textContent = content;
                chatContainer.appendChild(messageDiv);
                
                // Scroll to bottom
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
            // Function to get AI response
            async function getAIResponse(message) {
                try {
                    // Add a loading message
                    const loadingDiv = document.createElement('div');
                    loadingDiv.className = 'message bot';
                    loadingDiv.textContent = 'Thinking...';
                    chatContainer.appendChild(loadingDiv);
                    
                    // Get form values
                    const businessId = document.getElementById('businessId').value;
                    const userId = document.getElementById('userId').value;
                    const businessName = document.getElementById('businessName').value;
                    const businessType = document.getElementById('businessType').value;
                    const services = document.getElementById('services').value.split(',').map(s => s.trim());
                    const hours = document.getElementById('hours').value;
                    
                    // Call the API
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message,
                            businessId,
                            userId,
                            businessName,
                            businessType,
                            services,
                            hours
                        }),
                    });
                    
                    // Remove loading message
                    chatContainer.removeChild(loadingDiv);
                    
                    // Process response
                    const data = await response.json();
                    
                    if (data.success) {
                        return data.message;
                    } else {
                        console.error('API Error:', data.message);
                        return "I'm sorry, I'm having trouble connecting to my server. Please try again later.";
                    }
                } catch (error) {
                    console.error('Error getting AI response:', error);
                    
                    // Remove loading message if it exists
                    const loadingDiv = document.querySelector('.message.bot:last-child');
                    if (loadingDiv && loadingDiv.textContent === 'Thinking...') {
                        chatContainer.removeChild(loadingDiv);
                    }
                    
                    return "I'm sorry, I'm experiencing technical difficulties. Please try again later.";
                }
            }
            
            // Send button click handler
            sendButton.addEventListener('click', async function() {
                const message = messageInput.value.trim();
                
                if (message) {
                    // Add user message to chat
                    addMessage(message, true);
                    
                    // Clear input
                    messageInput.value = '';
                    
                    // Get AI response
                    const response = await getAIResponse(message);
                    
                    // Add AI response to chat
                    addMessage(response);
                }
            });
            
            // Enter key handler
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendButton.click();
                }
            });
        });
      </script>
    </body>
    </html>
  `);
});