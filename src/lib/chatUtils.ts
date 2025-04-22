
export type MessageType = 'bot' | 'user';

export interface Message {
  id: string;
  type: MessageType;
  text: string;
  timestamp: Date;
}

// Generate a random ID for messages
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Initial welcome messages from the bot
export const initialMessages: Message[] = [
  {
    id: generateId(),
    type: 'bot',
    text: "Hello, I'm FinBot. How can I assist you with your financial questions today?",
    timestamp: new Date(),
  },
];

// API function to get responses from the Flask backend
export const getResponse = async (userMessage: string): Promise<string> => {
  try {
    // Flask backend URL
    const apiUrl = "https://finbot-k5bl.onrender.com";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response || "Sorry, I couldn't process your request right now.";
  } catch (error) {
    console.error("Error communicating with Flask backend:", error);
    
    // Fallback to mock responses if backend is not available
    const lowerCaseMessage = userMessage.toLowerCase();
    
  }
};
