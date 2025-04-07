
import React from 'react';
import { ChatMessage as ChatMessageType } from '../data/chatData';
import { cn } from '@/lib/utils';
import RecommendedChoices from './RecommendedChoices';

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectChoice?: (choice: string) => void;
  showChoices: boolean;
}

const defaultChoices = [
  { id: 'stocks', text: 'Tell me about stocks' },
  { id: 'etfs', text: 'How do ETFs work?' },
  { id: 'retirement', text: 'Retirement planning tips' },
];

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSelectChoice, showChoices }) => {
  const isBot = message.sender === 'bot';
  
  return (
    <div className={cn('flex my-3 flex-col', isBot ? 'justify-start' : 'justify-end', 'animate-fade-in')}>
      <div className={cn(
        'message-bubble',
        isBot ? 'bot-message' : 'user-message',
        'max-w-[80%]'
      )}>
        <p className="whitespace-pre-line">{message.text}</p>
      </div>
      
      {isBot && onSelectChoice && (
        <RecommendedChoices 
          choices={message.choices || defaultChoices}
          onSelectChoice={onSelectChoice}
          showChoices={showChoices}
        />
      )}
    </div>
  );
};

export default ChatMessage;
