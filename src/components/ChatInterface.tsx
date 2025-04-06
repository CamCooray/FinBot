
import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from './ChatMessage';
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
  } = useChatbot(initialMessages);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 1) {
      setShowWelcome(false);
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
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
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="message-bubble bot-message">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}
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
