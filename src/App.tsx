import React, { useState, useCallback } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { sendToTeacher, WELCOME_MESSAGE } from './teacherEngine';
import './App.css';

const PROMPT_SUGGESTIONS = [
  'Teach me the Hebrew alphabet!',
  'What does Shalom mean?',
  'How do I say "thank you" in Hebrew?',
  'Tell me about Hebrew numbers',
  'What are some Hebrew colors?',
  'Let\'s play a game!',
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: WELCOME_MESSAGE }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage = { role: 'user' as const, content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));
      const reply = await sendToTeacher(conversationHistory);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Something went wrong. Try again!';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Oops! 😅 ${errorMsg}\n\nMake sure the server is running and OPENAI_API_KEY is set.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="hebrew-title">עברית לילדים</span>
          <span className="english-title">Hebrew for Kids</span>
        </h1>
        <p className="app-subtitle">Your friendly AI Hebrew teacher 🎓</p>
      </header>

      <main className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              content={msg.content}
              isUser={msg.role === 'user'}
            />
          ))}
          {isLoading && (
            <div className="chat-message teacher">
              <div className="message-avatar">📚</div>
              <div className="message-bubble loading">
                <span className="typing-dots">
                  <span></span><span></span><span></span>
                </span>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="prompt-suggestions">
            <p>Try asking:</p>
            <div className="suggestion-chips">
              {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSendMessage(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder="Ask me anything in Hebrew or English..."
        />
      </main>
    </div>
  );
};

export default App;
