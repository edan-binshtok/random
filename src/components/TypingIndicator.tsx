import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="message-row message-row--assistant">
      <div className="message-avatar" aria-hidden="true">
        🎓
      </div>
      <div className="message-bubble message-bubble--assistant typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
};

export default TypingIndicator;
