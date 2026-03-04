import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, LessonTopic } from './types';
import { sendMessage } from './services/openai';
import SetupScreen from './components/SetupScreen';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import TypingIndicator from './components/TypingIndicator';
import ChatInput from './components/ChatInput';
import QuickReplies from './components/QuickReplies';
import LessonMenu from './components/LessonMenu';
import './App.css';

const STORAGE_KEY = 'hebai_api_key';

const INITIAL_QUICK_REPLIES = [
  "שָׁלוֹם! I'm ready to learn! 🌟",
  'What can you teach me? 📚',
  'My name is... tell me yours! 😊',
];

const MID_LESSON_QUICK_REPLIES = [
  '💡 Give me a hint!',
  '🔄 Try a different topic',
  '⭐ Quiz me!',
  '🎉 Fun fact please!',
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLessonMenu, setShowLessonMenu] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>(INITIAL_QUICK_REPLIES);
  const [hasStarted, setHasStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleApiKeySubmit = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  };

  const sendToAI = useCallback(
    async (userText: string, currentMessages: Message[]) => {
      if (!apiKey) return;
      setIsLoading(true);
      setError(null);

      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: userText,
        timestamp: new Date(),
      };

      const updatedMessages = [...currentMessages, userMsg];
      setMessages(updatedMessages);

      try {
        const reply = await sendMessage(updatedMessages, apiKey);
        const assistantMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setQuickReplies(MID_LESSON_QUICK_REPLIES);
        setHasStarted(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        if (message.toLowerCase().includes('api key') || message.includes('401')) {
          setError('Invalid API key. Please check your key and try again.');
        } else if (message.toLowerCase().includes('quota')) {
          setError('API quota exceeded. Please check your OpenAI account.');
        } else {
          setError(`Oops! ${message}`);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey]
  );

  const handleSend = useCallback(
    (text: string) => {
      if (isLoading) return;
      sendToAI(text, messages);
    },
    [isLoading, messages, sendToAI]
  );

  const handleQuickReply = useCallback(
    (reply: string) => {
      if (isLoading) return;
      sendToAI(reply, messages);
    },
    [isLoading, messages, sendToAI]
  );

  const handleLessonSelect = useCallback(
    (topic: LessonTopic) => {
      if (isLoading) return;
      sendToAI(topic.promptHint, messages);
    },
    [isLoading, messages, sendToAI]
  );

  const handleReset = () => {
    if (window.confirm('Start a fresh conversation with Moreh Dani?')) {
      setMessages([]);
      setQuickReplies(INITIAL_QUICK_REPLIES);
      setHasStarted(false);
      setError(null);
    }
  };

  const handleChangeKey = () => {
    if (window.confirm('Change your API key? This will start a new session.')) {
      localStorage.removeItem(STORAGE_KEY);
      setApiKey(null);
      setMessages([]);
      setHasStarted(false);
      setError(null);
    }
  };

  if (!apiKey) {
    return <SetupScreen onKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="app">
      <Header onLessonsClick={() => setShowLessonMenu(true)} onResetClick={handleReset} />

      <main className="chat-area" ref={chatAreaRef}>
        {messages.length === 0 && !isLoading && (
          <div className="welcome-banner">
            <div className="welcome-mascot">🎓</div>
            <h2 className="welcome-title">שָׁלוֹם! Hello!</h2>
            <p className="welcome-text">
              I'm <strong>Moreh Dani</strong>, your Hebrew teacher! Click one of the
              buttons below or type a message to get started. 🌟
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            {error.includes('API key') && (
              <button className="error-action-btn" onClick={handleChangeKey}>
                Change Key
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <footer className="chat-footer">
        <QuickReplies
          replies={!hasStarted ? quickReplies : MID_LESSON_QUICK_REPLIES}
          onSelect={handleQuickReply}
          disabled={isLoading}
        />
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </footer>

      {showLessonMenu && (
        <LessonMenu
          onSelect={handleLessonSelect}
          onClose={() => setShowLessonMenu(false)}
        />
      )}
    </div>
  );
};

export default App;
