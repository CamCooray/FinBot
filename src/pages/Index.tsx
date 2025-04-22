import React, { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { Message } from '@/lib/chatUtils';
import { v4 as uuidv4 } from 'uuid';

const Index: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Create a session ID once and persist it
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('finbot_session');
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem('finbot_session', newId);
    return newId;
  });

  // Handles sending message to backend
  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage) return;

    const userMsgObj: Message = {
      id: crypto.randomUUID(),
      text: userMessage,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        })
      });

      const data = await response.json();

      const botMsgObj: Message = {
        id: crypto.randomUUID(),
        text: data.response,
        type: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsgObj]);
    } catch (error) {
      console.error('Backend error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: 'Sorry, something went wrong.',
          type: 'bot',
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <header className="w-full py-6 glass-panel border-b border-gray-700 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              <span className="finbot-gradient-text">Fin</span>Bot
            </h1>
          </div>
          <p className="text-sm text-gray-400 hidden sm:block">Your Personal Finance Assistant</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Welcome section */}
        <div className="text-center mb-8 animate-fade-down">
          <h2 className="text-3xl font-bold mb-3">Welcome to FinBot</h2>
          <p className="text-gray-300 max-w-xl mx-auto">
            Your personal AI financial assistant. Ask questions about investments, savings, budgeting, and more.
          </p>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 glass-panel rounded-2xl shadow-medium border border-gray-700/50 overflow-hidden flex flex-col animate-fade-in">
          <ChatInterface
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            isTyping={isTyping}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-gray-700 mt-auto px-4 text-center">
        <p className="text-sm text-gray-400">FinBot — Your AI Financial Assistant</p>
      </footer>
    </div>
  );
};

export default Index;
