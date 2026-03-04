#!/usr/bin/env python3
"""Hebrew Teacher AI: a kid-friendly, LLM-powered Hebrew tutor."""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import threading
import time
import uuid
from dataclasses import dataclass, field
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib import error, request

HEBREW_WORD_RE = re.compile(r"[\u0590-\u05FF]+")


def clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, value))


def clean_text(value: Any, max_length: int, fallback: str) -> str:
    if not isinstance(value, str):
        return fallback
    cleaned = " ".join(value.strip().split())
    if not cleaned:
        return fallback
    return cleaned[:max_length]


def extract_hebrew_words(text: str) -> set[str]:
    return {word for word in HEBREW_WORD_RE.findall(text) if len(word) >= 2}


@dataclass
class SessionState:
    session_id: str
    student_name: str
    age: int
    level: str
    goal: str
    created_at: float = field(default_factory=time.time)
    turn_count: int = 0
    learned_words: set[str] = field(default_factory=set)
    history: list[dict[str, str]] = field(default_factory=list)


class SessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, SessionState] = {}
        self._lock = threading.Lock()

    def create(self, student_name: str, age: int, level: str, goal: str) -> SessionState:
        session_id = uuid.uuid4().hex
        state = SessionState(
            session_id=session_id,
            student_name=student_name,
            age=age,
            level=level,
            goal=goal,
        )
        with self._lock:
            self._sessions[session_id] = state
        return state

    def get(self, session_id: str) -> SessionState | None:
        with self._lock:
            return self._sessions.get(session_id)


class OpenAIChatClient:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
        self.timeout_seconds = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "30"))

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    def chat(self, messages: list[dict[str, str]]) -> str:
        if not self.enabled:
            raise RuntimeError("OPENAI_API_KEY is not set.")

        endpoint = f"{self.base_url}/chat/completions"
        payload = json.dumps(
            {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 380,
            }
        ).encode("utf-8")

        req = request.Request(
            endpoint,
            data=payload,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
        )

        try:
            with request.urlopen(req, timeout=self.timeout_seconds) as response:
                body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"LLM API error ({exc.code}): {detail}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"Could not reach LLM API: {exc.reason}") from exc

        parsed = json.loads(body)
        choices = parsed.get("choices", [])
        if not choices:
            raise RuntimeError("LLM API returned no choices.")
        message = choices[0].get("message", {})
        content = (message.get("content") or "").strip()
        if not content:
            raise RuntimeError("LLM API returned an empty response.")
        return content


class HebrewTeacherEngine:
    SYSTEM_PROMPT = """You are Neta, a playful and patient Hebrew teacher for kids.
Your student is a child. Teach Hebrew in short, friendly steps.

Rules:
1) Keep responses concise and upbeat (max 120 words).
2) Use simple Hebrew words and ALWAYS include English meaning for new words.
3) Ask exactly one short follow-up question at the end.
4) Adapt to the child's age and level.
5) Correct mistakes gently and praise effort.
6) Keep everything child-safe and age-appropriate.
7) If a question is unsafe/off-topic, redirect to a safe Hebrew activity.
8) Use occasional emojis (0-2) to keep it fun.
"""

    FALLBACK_LESSONS = [
        ("Greeting", "שלום (shalom) = hello"),
        ("Thank you", "תודה (todah) = thank you"),
        ("Please", "בבקשה (bevakasha) = please / you're welcome"),
        ("Water", "מים (mayim) = water"),
        ("Book", "ספר (sefer) = book"),
        ("Dog", "כלב (kelev) = dog"),
        ("Sun", "שמש (shemesh) = sun"),
    ]

    LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י"]

    def __init__(self, llm_client: OpenAIChatClient) -> None:
        self.llm_client = llm_client

    def welcome_message(self, state: SessionState) -> str:
        return (
            f"שלום {state.student_name}! I am Neta, your Hebrew teacher AI. "
            "We will learn with short games and friendly practice. "
            "Today's first word is שלום (shalom) = hello. "
            "Can you type 'shalom' or 'שלום'?"
        )

    def _profile_context(self, state: SessionState) -> str:
        learned_preview = ", ".join(sorted(state.learned_words)[:8]) or "None yet"
        return (
            f"Student name: {state.student_name}\n"
            f"Age: {state.age}\n"
            f"Level: {state.level}\n"
            f"Goal: {state.goal}\n"
            f"Turns so far: {state.turn_count}\n"
            f"Learned Hebrew words: {learned_preview}"
        )

    def _build_messages(self, state: SessionState, user_message: str) -> list[dict[str, str]]:
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "system", "content": self._profile_context(state)},
        ]
        messages.extend(state.history[-8:])
        messages.append({"role": "user", "content": user_message})
        return messages

    def _fallback_response(self, state: SessionState, user_message: str) -> str:
        text = user_message.lower()
        if "quiz" in text or "חידון" in user_message:
            word, detail = random.choice(self.FALLBACK_LESSONS)
            hebrew_word = extract_hebrew_words(detail)
            choice_a = "מים (water)"
            choice_b = "ספר (book)"
            choice_c = "שמש (sun)"
            target = next(iter(hebrew_word), "שלום")
            return (
                "Great! Mini Hebrew quiz time 🎯\n"
                f"What does {target} mean?\n"
                f"A) {choice_a}\nB) {choice_b}\nC) {choice_c}\n"
                "Reply with A, B, or C!"
            )

        if "letter" in text or "אות" in user_message:
            letter = random.choice(self.LETTERS)
            return (
                f"Awesome! Let's practice a letter: {letter}\n"
                "Try saying its sound out loud and write it 3 times.\n"
                f"Can you type another Hebrew word that starts with {letter}?"
            )

        topic, detail = random.choice(self.FALLBACK_LESSONS)
        return (
            f"Nice work, {state.student_name}! 🌟\n"
            f"Today's Hebrew word ({topic}): {detail}.\n"
            "Let's use it in a tiny sentence: אני לומד עברית (ani lomed ivrit) = I am learning Hebrew.\n"
            f"Can you write a short sentence with this word: {detail.split('=')[0].strip()}?"
        )

    def respond(self, state: SessionState, user_message: str) -> dict[str, Any]:
        cleaned_message = clean_text(user_message, max_length=600, fallback="")
        if not cleaned_message:
            reply = "Type a short message, and we'll continue our Hebrew lesson together. What word do you want to learn?"
            return {"reply": reply, "used_llm": False, "llm_error": None}

        state.turn_count += 1
        llm_error = None
        used_llm = False

        if self.llm_client.enabled:
            try:
                response = self.llm_client.chat(self._build_messages(state, cleaned_message))
                used_llm = True
            except Exception as exc:  # noqa: BLE001 - return fallback behavior
                llm_error = str(exc)
                response = self._fallback_response(state, cleaned_message)
        else:
            response = self._fallback_response(state, cleaned_message)

        state.history.append({"role": "user", "content": cleaned_message})
        state.history.append({"role": "assistant", "content": response})
        state.learned_words.update(extract_hebrew_words(response))

        return {"reply": response, "used_llm": used_llm, "llm_error": llm_error}


class TeacherRequestHandler(BaseHTTPRequestHandler):
    store = SessionStore()
    engine = HebrewTeacherEngine(OpenAIChatClient())
    static_dir = Path(__file__).resolve().parent / "static"

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        super().log_message(format, *args)

    def _send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _send_text(self, body: str, status: HTTPStatus, content_type: str) -> None:
        payload = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _read_json_body(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            return {}
        raw = self.rfile.read(content_length).decode("utf-8")
        return json.loads(raw) if raw.strip() else {}

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path in ("/", "/index.html"):
            index_path = self.static_dir / "index.html"
            if not index_path.exists():
                self._send_text("index.html not found", HTTPStatus.NOT_FOUND, "text/plain")
                return
            self._send_text(index_path.read_text(encoding="utf-8"), HTTPStatus.OK, "text/html")
            return

        if self.path == "/api/health":
            self._send_json(
                {
                    "ok": True,
                    "llm_enabled": self.engine.llm_client.enabled,
                    "model": self.engine.llm_client.model,
                }
            )
            return

        self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:  # noqa: N802
        if self.path == "/api/session":
            try:
                payload = self._read_json_body()
            except json.JSONDecodeError:
                self._send_json({"error": "Invalid JSON body"}, status=HTTPStatus.BAD_REQUEST)
                return

            student_name = clean_text(payload.get("student_name"), 32, "friend")
            level = clean_text(payload.get("level"), 16, "beginner").lower()
            if level not in {"beginner", "intermediate", "advanced"}:
                level = "beginner"
            goal = clean_text(payload.get("goal"), 100, "learn basic Hebrew words")

            age_raw = payload.get("age", 8)
            try:
                age = clamp(int(age_raw), 4, 15)
            except (TypeError, ValueError):
                age = 8

            state = self.store.create(student_name=student_name, age=age, level=level, goal=goal)
            welcome = self.engine.welcome_message(state)
            state.history.append({"role": "assistant", "content": welcome})
            state.learned_words.update(extract_hebrew_words(welcome))

            self._send_json(
                {
                    "session_id": state.session_id,
                    "welcome_message": welcome,
                    "student": {
                        "name": state.student_name,
                        "age": state.age,
                        "level": state.level,
                        "goal": state.goal,
                    },
                },
                status=HTTPStatus.CREATED,
            )
            return

        if self.path == "/api/chat":
            try:
                payload = self._read_json_body()
            except json.JSONDecodeError:
                self._send_json({"error": "Invalid JSON body"}, status=HTTPStatus.BAD_REQUEST)
                return

            session_id = clean_text(payload.get("session_id"), 80, "")
            user_message = clean_text(payload.get("message"), 600, "")

            if not session_id:
                self._send_json({"error": "session_id is required"}, status=HTTPStatus.BAD_REQUEST)
                return

            state = self.store.get(session_id)
            if state is None:
                self._send_json({"error": "Session not found"}, status=HTTPStatus.NOT_FOUND)
                return

            result = self.engine.respond(state, user_message)
            self._send_json(
                {
                    "reply": result["reply"],
                    "used_llm": result["used_llm"],
                    "llm_error": result["llm_error"],
                    "progress": {
                        "turn_count": state.turn_count,
                        "learned_words_count": len(state.learned_words),
                        "sample_words": sorted(state.learned_words)[:12],
                    },
                }
            )
            return

        self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Hebrew Teacher AI server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind (default: 8080)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    server_address = (args.host, args.port)
    httpd = ThreadingHTTPServer(server_address, TeacherRequestHandler)
    print(f"Hebrew Teacher AI running on http://{args.host}:{args.port}")
    print("Set OPENAI_API_KEY to enable live LLM responses.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Hebrew Teacher AI...")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
