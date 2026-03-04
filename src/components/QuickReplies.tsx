import React from 'react';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled: boolean;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ replies, onSelect, disabled }) => {
  if (replies.length === 0) return null;

  return (
    <div className="quick-replies">
      {replies.map((reply) => (
        <button
          key={reply}
          className="quick-reply-btn"
          onClick={() => onSelect(reply)}
          disabled={disabled}
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

export default QuickReplies;
