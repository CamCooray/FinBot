
import { useState } from 'react';
import { ChatMessage, botResponses, quickActions } from '../data/chatData';

export const useChatbot = (initialMessages: ChatMessage[]) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    // Add user message
    addMessage(inputValue, 'user');
    setInputValue('');
    
    // Simulate bot typing
    setIsTyping(true);
    setTimeout(() => {
      respondToMessage(inputValue);
      setIsTyping(false);
    }, 1000);
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
  };
};
