
import { useState } from 'react';
import { ChatMessage, botResponses, quickActions } from '../data/chatData';

interface ApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  apiKey?: string;
}

export const useChatbot = (initialMessages: ChatMessage[]) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({});

  const addMessage = (text: string, sender: 'user' | 'bot', choices?: { id: string; text: string }[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: new Date(),
      choices,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // Function to send message to backend API
  const sendToBackend = async (userMessage: string) => {
    if (!apiConfig.baseUrl) {
      // Fallback to local response if no API configured
      return null;
    }

    try {
      const response = await fetch(`${apiConfig.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiConfig.apiKey && { 'Authorization': `Bearer ${apiConfig.apiKey}` }),
          ...(apiConfig.headers || {}),
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        console.error('Backend response error:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message to backend:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    
    // Add user message
    addMessage(inputValue, 'user');
    const userMessage = inputValue;
    setInputValue('');
    
    // Simulate bot typing
    setIsTyping(true);
    
    // Try to get response from backend or fallback to local responses
    try {
      // Only wait a short time to simulate network request
      const backendResponse = await Promise.race([
        sendToBackend(userMessage),
        new Promise(resolve => setTimeout(() => resolve(null), 1000)) // Timeout if API takes too long
      ]);
      
      if (backendResponse) {
        // We successfully got a response from the backend
        setTimeout(() => {
          setIsTyping(false);
          addMessage(backendResponse.message, 'bot');
        }, 1000);
      } else {
        // Fallback to local response
        setTimeout(() => {
          respondToMessage(userMessage);
          setIsTyping(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setTimeout(() => {
        respondToMessage(userMessage);
        setIsTyping(false);
      }, 1000);
    }
  };

  const configureApi = (config: ApiConfig) => {
    setApiConfig(prevConfig => ({...prevConfig, ...config}));
  };

  const handleQuickAction = (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action) {
      addMessage(action.question, 'user');
      
      // Simulate bot typing
      setIsTyping(true);
      setTimeout(() => {
        respondToMessage(action.question, action.id);
        setIsTyping(false);
      }, 1000);
    }
  };

  const respondToMessage = (message: string, quickActionId?: string) => {
    // First try to find a direct match for the quick action
    if (quickActionId && botResponses[quickActionId]) {
      addMessage(botResponses[quickActionId], 'bot');
      return;
    }

    // Simple keyword matching for demo purposes
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('hello') || messageLower.includes('hi')) {
      addMessage(botResponses['hello'], 'bot');
    } else if (messageLower.includes('stock')) {
      addMessage(botResponses['stocks'], 'bot');
    } else if (messageLower.includes('etf')) {
      addMessage(botResponses['etfs'], 'bot');
    } else if (messageLower.includes('risk')) {
      addMessage(botResponses['risk'], 'bot');
    } else if (messageLower.includes('retire')) {
      addMessage(botResponses['retirement'], 'bot');
    } else if (messageLower.includes('diversif')) {
      addMessage(botResponses['diversification'], 'bot');
    } else {
      // Default response
      addMessage(botResponses['default'], 'bot');
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    handleSendMessage,
    handleQuickAction,
    isTyping,
    configureApi,
  };
};
