
import React from 'react';
import { Message } from '@/lib/chatUtils';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.type === 'bot';
  
  return (
    <div 
      className={cn(
        "flex w-full mb-4 animate-bounce-in message-appear",
        isBot ? "justify-start" : "justify-end"
      )}
    >
      <div 
        className={cn(
          "rounded-xl px-4 py-3 max-w-[85%] sm:max-w-[70%] shadow-soft",
          isBot 
            ? "bg-gray-800/70 border border-gray-700/50 rounded-tl-none" 
            : "bg-blue-600 text-white rounded-tr-none"
        )}
      >
        <div className="text-sm sm:text-base">{message.text}</div>
        <div 
          className={cn(
            "text-[10px] sm:text-xs mt-1 text-right",
            isBot ? "text-gray-400" : "text-blue-200"
          )}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
