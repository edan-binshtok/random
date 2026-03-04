import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const HEBREW_REGEX = /[\u0590-\u05FF]/;

function renderText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
      }
      return <span key={partIdx}>{part}</span>;
    });
    return (
      <React.Fragment key={lineIdx}>
        {lineIdx > 0 && <br />}
        {rendered}
      </React.Fragment>
    );
  });
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const hasHebrew = HEBREW_REGEX.test(message.content);

  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--assistant'}`}>
      {!isUser && (
        <div className="message-avatar" aria-hidden="true">
          🎓
        </div>
      )}
      <div
        className={`message-bubble ${isUser ? 'message-bubble--user' : 'message-bubble--assistant'}`}
        dir={hasHebrew && !isUser ? 'auto' : undefined}
      >
        <p className="message-text">{renderText(message.content)}</p>
        <span className="message-time">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
