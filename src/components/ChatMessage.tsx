
import React from 'react';
import { ChatMessage as ChatMessageType } from '../data/chatData';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  
  return (
    <div className={cn('flex my-3', isBot ? 'justify-start' : 'justify-end', 'animate-fade-in')}>
      <div className={cn(
        'message-bubble',
        isBot ? 'bot-message' : 'user-message',
        'max-w-[80%]'
      )}>
        <p className="whitespace-pre-line">{message.text}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
