export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface LessonTopic {
  id: string;
  emoji: string;
  hebrewTitle: string;
  transliteration: string;
  englishTitle: string;
  description: string;
  promptHint: string;
}

export type AppScreen = 'setup' | 'chat';
