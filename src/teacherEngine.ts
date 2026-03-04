/**
 * Hebrew Kids AI Teacher - LLM Engine
 * Handles communication with the AI teacher backend
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TeacherResponse {
  reply: string;
}

const API_BASE = process.env.NODE_ENV === 'development' 
  ? ''  // Uses proxy to server
  : '/api';  // For production, adjust if API is elsewhere

export async function sendToTeacher(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Request failed: ${response.status}`);
  }

  const data: TeacherResponse = await response.json();
  return data.reply;
}

export const WELCOME_MESSAGE = `Shalom! 👋 I'm your Hebrew teacher! I'm so excited to learn with you today.

What would you like to learn? You can ask me about:
• Hebrew letters (א ב ג)
• Numbers and colors
• Animals and family words
• Greetings like "Shalom" and "Toda"
• Or just chat with me in Hebrew!

What's your name? Tell me and we'll start our adventure! 🎉`;
