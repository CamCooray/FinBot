import React from 'react';

function ChatMessage({ text, sender }) {
  return (
    <div className={`message ${sender}-message`}>
      {text}
    </div>
  );
}

export default ChatMessage;