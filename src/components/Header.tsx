
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full flex items-center justify-between p-4 border-b border-gray-800">
      <div className="flex items-center space-x-2 font-medium">
        <div className="bg-blue-600 text-white h-8 w-8 flex items-center justify-center rounded-full font-bold">
          F
        </div>
        <h1 className="text-xl font-bold text-white">FinBot</h1>
      </div>
      <div className="text-gray-400 text-sm">Your Personal Finance Assistant</div>
    </header>
  );
};

export default Header;
