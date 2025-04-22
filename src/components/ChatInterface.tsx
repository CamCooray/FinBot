import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { SendIcon } from 'lucide-react';
import { Message } from '@/lib/chatUtils';
import { Analytics } from "@vercel/analytics/react"

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  isTyping: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  input,
  onInputChange,
  onSend,
  isTyping,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 glass-panel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="p-2 sm:p-4"
        >
          <div className="flex items-center rounded-full border bg-gray-800 px-3 py-1 shadow-soft">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              placeholder="Ask a financial question..."
              className="flex-1 bg-transparent py-2 px-1 outline-none text-sm sm:text-base text-gray-100"
              aria-label="Type your message"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="ml-2 rounded-full p-1.5 text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
