# Hebrew Teacher AI (Kids Edition)

A standalone app that teaches kids Hebrew with a dynamic AI teacher.

- Uses a **live LLM** when `OPENAI_API_KEY` is set.
- Falls back to a **built-in teaching engine** when no API key is available.
- Includes child-friendly behavior, short lessons, mini quizzes, and progress tracking.

## Features

- Student profile setup (name, age, level, goal)
- Teacher-style conversational Hebrew practice
- Dynamic adaptation from chat history and progress
- Safe, encouraging prompt design for kids
- Browser UI (no frontend build step)
- Pure Python standard library backend

## Quick Start

```bash
cd hebrew_teacher_ai
python3 app.py --host 127.0.0.1 --port 8080
```

Open:

```text
http://127.0.0.1:8080
```

## Enable Live LLM Mode

1. Copy `.env.example` values into your shell environment:

```bash
export OPENAI_API_KEY="your_key"
export OPENAI_MODEL="gpt-4o-mini"
```

2. Run the server again:

```bash
python3 app.py
```

The app will report LLM status in the UI.

## API Endpoints

- `GET /api/health` -> app health + LLM mode
- `POST /api/session` -> create student session
- `POST /api/chat` -> send student message and get teacher reply

## Safety & Teaching Behavior

The system prompt enforces:

- Child-safe responses
- Short, encouraging messages
- Simple Hebrew with English meaning for new words
- One clear follow-up question at a time

## Notes

- Session data is in-memory only.
- This project is intentionally isolated from the rest of the repository.
