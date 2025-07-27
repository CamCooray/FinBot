import React, { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { Message } from '@/lib/chatUtils';
import { v4 as uuidv4 } from 'uuid';
import { Analytics } from "@vercel/analytics/react"
import { getAvailableApiConfig, ApiConfig } from '@/lib/apiConfig';

const Index: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'fallback' | 'offline'>('connecting');

  // Create a session ID once
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('finbot_session');
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem('finbot_session', newId);
    return newId;
  });

  // Initialize API configuration on component mount
  useEffect(() => {
    const initializeApi = async () => {
      try {
        const config = await getAvailableApiConfig();
        setApiConfig(config);
        setConnectionStatus('connected');
        
        // Show a welcome message with connection info
        const welcomeMessage: Message = {
          id: crypto.randomUUID(),
          text: `Welcome to FinBot, I'm connected and ready to help you with financial insights👋`,
          type: 'bot',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Failed to initialize API:', error);
        setConnectionStatus('offline');
        
        // Show offline message
        const offlineMessage: Message = {
          id: crypto.randomUUID(),
          text: `⚠️ I'm currently running in offline mode. Some features may be limited. Please check your connection or try again later.`,
          type: 'bot',
          timestamp: new Date(),
        };
        setMessages([offlineMessage]);
      }
    };

    initializeApi();
  }, []);

  //Handles input response to backend
  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || !apiConfig) return;

    const userMsgObj: Message = {
      id: crypto.randomUUID(),
      text: userMessage,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setInput('');
    setIsTyping(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

      const response = await fetch(`${apiConfig.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        signal: controller.signal,
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const botMsgObj: Message = {
        id: crypto.randomUUID(),
        text: data.response,
        type: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsgObj]);
    } catch (error) {
      console.error('Backend error:', error);
      
      let errorMessage = 'Sorry, something went wrong.';
      
      if (error.name === 'AbortError') {
        errorMessage = `⏱️ Request timed out. The ${apiConfig.baseUrl.includes('localhost') ? 'local server' : 'cloud server'} might be slow or unavailable.`;
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = `🔌 Connection failed. Please check if the ${apiConfig.baseUrl.includes('localhost') ? 'local server is running' : 'internet connection is stable'}.`;
      }
      
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: errorMessage,
          type: 'bot',
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper function to manually switch API endpoints
  const switchApiEndpoint = async (environment: 'development' | 'production') => {
    setConnectionStatus('connecting');
    localStorage.setItem('finbot_api_override', environment);
    
    try {
      const config = await getAvailableApiConfig();
      setApiConfig(config);
      setConnectionStatus('connected');
      
      const switchMessage: Message = {
        id: crypto.randomUUID(),
        text: `🔄 Switched to ${environment === 'development' ? 'Local' : 'Cloud'} server: ${config.baseUrl}`,
        type: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, switchMessage]);
    } catch (error) {
      setConnectionStatus('offline');
      console.error('Failed to switch API:', error);
    }
  };

  // Function to get connection status color and text
  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connecting':
        return { color: 'text-yellow-400', text: 'Connecting...', dot: 'bg-yellow-400' };
      case 'connected':
        return { 
          color: 'text-green-400', 
          text: apiConfig?.baseUrl.includes('localhost') ? 'Local Server' : 'Cloud Server', 
          dot: 'bg-green-400' 
        };
      case 'fallback':
        return { color: 'text-orange-400', text: 'Fallback Mode', dot: 'bg-orange-400' };
      case 'offline':
        return { color: 'text-red-400', text: 'Offline Mode', dot: 'bg-red-400' };
      default:
        return { color: 'text-gray-400', text: 'Unknown', dot: 'bg-gray-400' };
    }
  };

  const statusInfo = getConnectionStatus();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <header className="w-full py-6 glass-panel border-b border-gray-700 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">FinBot</h1>
          </div>
          
          {/* Connection Status & API Controls */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse`}></div>
              <span className={`text-sm ${statusInfo.color} hidden sm:inline`}>{statusInfo.text}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Welcome section */}
        <div className="text-center mb-8 animate-fade-down">
          <h2 className="text-3xl font-bold mb-3">Welcome to FinBot</h2>
          <p className="text-gray-300 max-w-xl mx-auto">
            Your personal AI financial assistant. Ask questions about investments, savings, budgeting, and more.
          </p>
        </div>

        {/* Chat interface */}
        <div className="flex-1 bg-[#121926] rounded-2xl shadow-medium border border-gray-700/50 overflow-hidden flex flex-col animate-fade-in">

          <ChatInterface
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            isTyping={isTyping}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-gray-700 mt-auto px-4 text-center">
        <p className="text-sm text-gray-400">
          FinBot — Your AI Financial Assistant
        </p>
      </footer>
    </div>
  );
};
console.log("Frontend Origin:", window.location.origin);
export default Index;
