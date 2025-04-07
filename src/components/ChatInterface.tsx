
import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import Header from './Header';
import { useChatbot } from '@/hooks/useChatbot';
import { initialMessages } from '@/data/chatData';

const ChatInterface: React.FC = () => {
  const {
    messages,
    inputValue,
    setInputValue,
    handleSendMessage,
    handleQuickAction,
    isTyping,
    configureApi,
  } = useChatbot(initialMessages);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Only show choices for the first bot message
  const shouldShowChoices = (messageId: string) => {
    return messageId === initialMessages[0].id;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length > 1) {
      setShowWelcome(false);
    }
  }, [messages]);

  // Example of how to set up API connection (not called yet - would be called when configuring the bot)
  const setupBackendConnection = () => {
    configureApi({
      baseUrl: 'https://your-backend-api.com',
      apiKey: 'your-api-key',
      headers: {
        'X-Client-Version': '1.0.0',
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleChoiceSelection = (choiceText: string) => {
    setInputValue(choiceText);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {showWelcome && (
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mt-12 mb-3">Welcome to FinBot</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Your personal AI financial assistant. Ask questions about investments, savings, 
            budgeting, and more.
          </p>
        </div>
      )}
      
      <div className="chat-container bg-[#131A2C] border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <Header />
        
        <div className="chat-messages p-4">
          {messages.length <= 1 && !isTyping ? (
            <div className="flex flex-col justify-center items-center h-[300px] text-gray-400">
              <p>Ask a financial question to get started</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message}
                onSelectChoice={message.sender === 'bot' ? handleChoiceSelection : undefined}
                showChoices={shouldShowChoices(message.id)}
              />
            ))
          )}
          
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center bg-[#101626] rounded-full border border-gray-800 pl-4 pr-1 py-1 overflow-hidden">
            <Input
              placeholder="Ask a financial question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent text-gray-200 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button 
              onClick={handleSendMessage} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8 p-0"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
