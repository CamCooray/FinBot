// File: src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ChatMessage from './components/ChatMessage';
import TypingIndicator from './components/TypingIndicator';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState('session_' + Math.random().toString(36).substring(2, 15));
  const chatboxRef = useRef(null);
  const initializedRef = useRef(false);

  // Initial messages for the chatbot
  const initialMessage = "Hi! I'm FinBot, your financial assistant. I can help you with:";
  const capabilities = [
    "• Stock market information and trends",
    "• Financial planning",
    "• Market analysis and insights",
    "• Investment strategies"
  ];

  // Initialize chat when the page loads - only once
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      setMessages(prev => [...prev, { text: initialMessage, sender: 'bot' }]);
      
      // Add capabilities with delay for a typing effect
      capabilities.forEach((capability, index) => {
        setTimeout(() => {
          setMessages(prev => [...prev, { text: capability, sender: 'bot' }]);
        }, 750 * (index + 1));
      });
    }
  }, []);

  // Auto-scroll to the bottom when messages update
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    const userMessage = input.trim();
    if (userMessage === '') return;

    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    try {
      // Call Flask backend
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Small delay to simulate typing
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { text: data.response, sender: 'bot' }]);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { text: "Sorry, I encountered an error. Please try again.", sender: 'bot' }]);
      }, 1000);
    }
  };

  return (
    <div className="App">
      <h1>FinBot</h1>
      <div className="chat-container">
        <div className="chatbox" ref={chatboxRef}>
          {messages.map((message, index) => (
            <ChatMessage key={index} text={message.text} sender={message.sender} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about stocks, market trends, or financial advice..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;