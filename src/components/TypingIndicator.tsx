
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="message-bubble bot-message max-w-[80%]">
        <div className="flex items-center space-x-2 py-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150"></div>
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
