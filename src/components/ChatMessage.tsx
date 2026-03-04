import React from 'react';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ content, isUser }) => {
  return (
    <div className={`chat-message ${isUser ? 'user' : 'teacher'}`}>
      <div className="message-avatar">
        {isUser ? '👧' : '📚'}
      </div>
      <div className="message-bubble">
        <div className="message-content">{content}</div>
      </div>
    </div>
  );
};

export default ChatMessage;
