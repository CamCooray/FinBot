
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="message-bubble bot-message max-w-[80%]">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-150"></div>
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
