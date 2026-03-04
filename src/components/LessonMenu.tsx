import React from 'react';
import { LessonTopic } from '../types';
import { LESSON_TOPICS } from '../utils/lessonData';

interface LessonMenuProps {
  onSelect: (topic: LessonTopic) => void;
  onClose: () => void;
}

const LessonMenu: React.FC<LessonMenuProps> = ({ onSelect, onClose }) => {
  return (
    <div className="lesson-overlay" onClick={onClose}>
      <div
        className="lesson-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Choose a lesson topic"
      >
        <div className="lesson-modal-header">
          <h2 className="lesson-modal-title">📚 Choose a Topic</h2>
          <button className="lesson-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="lesson-modal-subtitle">What do you want to learn today?</p>
        <div className="lesson-grid">
          {LESSON_TOPICS.map((topic) => (
            <button
              key={topic.id}
              className="lesson-card"
              onClick={() => {
                onSelect(topic);
                onClose();
              }}
            >
              <span className="lesson-card-emoji">{topic.emoji}</span>
              <span className="lesson-card-hebrew">{topic.hebrewTitle}</span>
              <span className="lesson-card-transliteration">{topic.transliteration}</span>
              <span className="lesson-card-english">{topic.englishTitle}</span>
              <span className="lesson-card-desc">{topic.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LessonMenu;
