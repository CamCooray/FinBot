// Initial messages for the chatbot
const initialMessage = "Hi! I'm FinBot, your financial assistant. I can help you with:";
const capabilities = [
    "• Stock market information and trends",
    "• Financial advice and planning",
    "• Market analysis and insights",
    "• Investment strategies"
];

// Initialize chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    addBotMessage(initialMessage);
    capabilities.forEach(capability => {setTimeout(() => addBotMessage(capability), 750);});
});

// Handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Send message function
function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (message === '') return;
    
    // Add user message
    addUserMessage(message);
    userInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process the message and get bot response
    setTimeout(() => processUserMessage(message), 750);
}

// Add user message to chat
function addUserMessage(message) {
    const chatbox = document.getElementById('chatbox');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    messageDiv.textContent = message;
    chatbox.appendChild(messageDiv);
    scrollToBottom();
}

// Add bot message to chat
function addBotMessage(message) {
    const chatbox = document.getElementById('chatbox');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    messageDiv.textContent = message;
    chatbox.appendChild(messageDiv);
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    const chatbox = document.getElementById('chatbox');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.textContent = 'FinBot is typing...';
    typingDiv.id = 'typingIndicator';
    chatbox.appendChild(typingDiv);
    scrollToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Process user message and generate response
async function processUserMessage(message) {
    try {
        removeTypingIndicator();
        
        // Call Flask backend
        const response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        addBotMessage(data.response);

    } catch (error) {
        console.error('Error:', error);
        addBotMessage("Sorry, I encountered an error. Please try again.");
    }
}

// Scroll to bottom of chat
function scrollToBottom() {
    const chatbox = document.getElementById('chatbox');
    chatbox.scrollTop = chatbox.scrollHeight;
}