
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex space-x-1 p-2 items-center">
      <div className="text-xs text-gray-400 mr-2">FinBot is typing</div>
      <div className="w-2 h-2 rounded-full bg-blue-500 animate-typing delay-100"></div>
      <div className="w-2 h-2 rounded-full bg-blue-500 animate-typing delay-200"></div>
      <div className="w-2 h-2 rounded-full bg-blue-500 animate-typing delay-300"></div>
    </div>
  );
};

export default TypingIndicator;
