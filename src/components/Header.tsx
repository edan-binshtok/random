import React from 'react';

interface HeaderProps {
  onLessonsClick: () => void;
  onResetClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLessonsClick, onResetClick }) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="header-mascot">🎓</span>
        <div className="header-titles">
          <h1 className="header-title">מורה דני</h1>
          <p className="header-subtitle">Hebrew Teacher for Kids</p>
        </div>
      </div>
      <div className="header-actions">
        <button
          className="header-btn"
          onClick={onLessonsClick}
          title="Browse lesson topics"
        >
          📚 Lessons
        </button>
        <button
          className="header-btn header-btn-ghost"
          onClick={onResetClick}
          title="Start a new chat"
        >
          🔄
        </button>
      </div>
    </header>
  );
};

export default Header;
