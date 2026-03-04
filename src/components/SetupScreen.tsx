import React, { useState } from 'react';
import { isValidApiKey } from '../services/openai';

interface SetupScreenProps {
  onKeySubmit: (key: string) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onKeySubmit }) => {
  const [keyValue, setKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyValue.trim();
    if (!isValidApiKey(trimmed)) {
      setError('Please enter a valid OpenAI API key (starts with sk-...)');
      return;
    }
    setError('');
    onKeySubmit(trimmed);
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-mascot">🎓</div>
        <h1 className="setup-title">Hebrew with Moreh Dani</h1>
        <p className="setup-subtitle">
          שָׁלוֹם! <span className="transliteration">(Shalom!)</span> — Hello!
        </p>
        <p className="setup-description">
          I'm <strong>Moreh Dani</strong>, your AI Hebrew teacher! I'll teach you
          letters, words, and phrases through fun conversations and games. 🌟
        </p>

        <div className="setup-features">
          <div className="feature-chip">🔤 Hebrew Alphabet</div>
          <div className="feature-chip">🔢 Numbers</div>
          <div className="feature-chip">🎨 Colors</div>
          <div className="feature-chip">👋 Greetings</div>
          <div className="feature-chip">🐘 Animals</div>
          <div className="feature-chip">🍎 Foods</div>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <label className="form-label">
            OpenAI API Key
            <span className="form-hint">
              Get yours free at{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                platform.openai.com
              </a>
            </span>
          </label>
          <div className="key-input-wrap">
            <input
              type={showKey ? 'text' : 'password'}
              className="key-input"
              placeholder="sk-..."
              value={keyValue}
              onChange={(e) => {
                setKeyValue(e.target.value);
                setError('');
              }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="key-toggle"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
          <p className="form-privacy">
            🔒 Your key is stored only in your browser and never sent anywhere except
            OpenAI's API.
          </p>
          <button type="submit" className="btn-start" disabled={!keyValue.trim()}>
            Let's Learn! 🚀
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupScreen;
