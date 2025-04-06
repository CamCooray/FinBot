
import React from 'react';
import ChatInterface from '@/components/ChatInterface';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0F1424] flex flex-col items-center justify-start p-4">
      <ChatInterface />
      <div className="text-gray-400 text-sm mt-4">
        FinBot — Your AI Financial Assistant
      </div>
    </div>
  );
};

export default Index;
