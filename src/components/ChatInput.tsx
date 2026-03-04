import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = () => {
    const text = value.trim();
    if (!text || isLoading) return;
    onSend(text);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="chat-input-area">
      <div className="chat-input-wrap">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder={isLoading ? 'Moreh Dani is thinking... ✨' : 'Type your answer or message...'}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="send-spinner" />
          ) : (
            <span className="send-icon">➤</span>
          )}
        </button>
      </div>
      <p className="chat-input-hint">Press Enter to send · Shift+Enter for new line</p>
    </div>
  );
};

export default ChatInput;
