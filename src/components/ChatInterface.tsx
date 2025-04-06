
import React, { useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from './ChatMessage';
import QuickActionButtons from './QuickActionButtons';
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <Header />
      
      <div className="chat-messages px-1 py-2">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="message-bubble bot-message">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-finance-primary animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-finance-primary animate-pulse delay-150"></div>
                <div className="w-2 h-2 rounded-full bg-finance-primary animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="mt-4 bg-[#1A1F2C] p-3 rounded-lg border border-[#333333]">
        <QuickActionButtons onActionClick={handleQuickAction} />
        
        <div className="flex space-x-2 mt-3">
          <Input
            placeholder="Ask a question about investing..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-[#222222] border-[#444444] text-gray-100 placeholder:text-gray-500 focus:border-finance-primary focus:ring-1 focus:ring-finance-primary"
          />
          <Button 
            onClick={handleSendMessage} 
            className="bg-finance-primary hover:bg-finance-dark text-white"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-3 text-center">
          This is an educational tool. Do not make investment decisions based solely on this information.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
