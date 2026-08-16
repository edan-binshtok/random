# Hebrew for Kids - AI Teacher 📚

A fun, interactive web app that teaches Hebrew to children using an AI teacher powered by LLMs. The AI adapts to each child dynamically—patient, encouraging, and ready to teach letters, numbers, colors, greetings, and more!

## Features

- **Dynamic AI Teacher**: Uses GPT-4o-mini to respond naturally to kids' questions and interests
- **Kid-Friendly Interface**: Colorful, playful design with large buttons and clear text
- **Hebrew + English**: Teaches Hebrew words and phrases with English explanations
- **Conversation-Based Learning**: Kids learn through natural dialogue, games, and questions
- **Safe & Supportive**: Patient prompts designed for young learners (ages 4–10)

## Setup

### 1. Install dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure the API key

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-key-here
```

Get an API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

### 3. Run the app

```bash
npm start
```

This starts both the React frontend (port 3000) and the backend server (port 3001). Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── server/           # Backend - proxies LLM requests, keeps API key secure
│   └── index.js
├── src/
│   ├── teacherEngine.ts   # API client for chat
│   ├── components/        # Chat UI components
│   ├── App.tsx            # Main app with chat interface
│   └── ...
└── public/
```

## How It Works

1. **Frontend**: Kids interact via a chat interface with suggestion chips for common topics
2. **Backend**: Express server receives messages and forwards them to OpenAI's API
3. **AI Teacher**: A custom system prompt instructs the model to act as a warm, patient Hebrew teacher for kids
4. **Response**: The AI's reply streams back and appears in the chat

The teacher prompt guides the AI to:
- Use simple, age-appropriate language
- Mix Hebrew and English
- Be encouraging and never harsh
- Teach through games, songs, and conversation
- Adapt to the child's level

## Tech Stack

- **Frontend**: React, TypeScript
- **Backend**: Node.js, Express
- **LLM**: OpenAI GPT-4o-mini (via API)

## License

MIT
