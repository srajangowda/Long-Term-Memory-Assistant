# Long-Term Memory Assistant

> **Phase 1 — Basic AI Chat Foundation (Google Gemini & Swappable LLM Architecture)**

A modern full-stack web application establishing the clean, scalable foundation for an intelligent personal AI assistant powered by **Google Gemini** (with support for offline Mock and extensible provider architecture).

Phase 1 focuses on delivering a robust, secure, and responsive chat architecture. In subsequent phases, this foundation will be augmented with persistent memory (SQLite).

---

## Why Bedrock Was Replaced

Initially, Phase 1 was prototyped using Amazon Bedrock. However, Bedrock introduces significant hurdles for rapid local development:
- **Account-Level Gatekeeping:** AWS recently retired the legacy "Model Access" console page, and newer AWS accounts encounter `ValidationException: Operation not allowed` due to internal anti-fraud holds until approved by AWS Support.
- **Complex Authentication:** Required AWS CLI credentials, IAM users/roles, and multiple permission policies.
- **Provider Migration Decision:** Replaced Bedrock with **Google Gemini API** using the official `@google/genai` SDK. Gemini provides a free-of-charge usage tier via Google AI Studio, quick key generation, and fast inference (`gemini-2.5-flash`).
- **Provider-Independent Design:** The backend is decoupled from any single vendor via a generic `LLMProvider` interface, allowing instant switching between Gemini, Mock (offline), or future providers (Groq, Ollama) with zero UI or route rewrites.

---

## Architecture Overview

### Current (Phase 1) Flow

```
┌────────────────────────┐
│  React Frontend (Vite) │
└───────────┬────────────┘
            │  POST /api/chat (JSON payload: { message } or { messages })
            ▼
┌────────────────────────┐
│ Node.js / Express API  │  <-- Input validation, CORS, error sanitization
└───────────┬────────────┘
            │  Delegates to LLMService (reads LLM_PROVIDER from .env)
            ▼
┌────────────────────────┐
│  LLMProvider Interface │  <-- Swappable interface (types.ts)
└─────┬────────────┬─────┘
      │            │
      ▼            ▼
┌──────────────┐ ┌────────────────┐
│GeminiProvider│ │MockLLMProvider │  <-- Future: GroqProvider, OllamaProvider
│@google/genai │ │Offline testing │
└─────┬────────┘ └────────────────┘
      │  Generated Text Response
      ▼
┌────────────────────────┐
│  React Frontend (Vite) │  <-- Displays formatted message in conversation
└────────────────────────┘
```

> **Security Guardrail:** The frontend **never** holds API keys or communicates directly with Google Gen AI. All Gemini invocations are managed securely by the backend. API keys are never logged or exposed in client responses or Git repositories.

---

## Monorepo Directory Structure

```
long-term-memory-assistant/
│
├── frontend/                               # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx                 # App header with phase badge & health status
│   │   │   ├── ChatWindow.tsx             # Message history, empty state & thinking state
│   │   │   ├── MessageBubble.tsx          # Distinct styling for User vs Assistant
│   │   │   └── ChatInput.tsx              # Autogrowing input, keyboard shortcuts
│   │   ├── types/
│   │   │   └── chat.ts                    # Frontend chat TypeScript definitions
│   │   ├── App.tsx                        # Main state orchestrator
│   │   ├── main.tsx                       # React DOM entry point
│   │   └── index.css                      # Tailwind styling & dark scrollbars
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts                     # Vite config with API reverse proxy
│
├── backend/                                # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── routes/
│   │   │   └── chat.ts                    # POST /api/chat and GET /api/health
│   │   ├── services/
│   │   │   └── llm/
│   │   │       ├── types.ts               # LLMProvider generic interface
│   │   │       ├── errors.ts              # Typed LLM errors (RateLimit, Auth, etc.)
│   │   │       ├── geminiProvider.ts      # Official @google/genai integration
│   │   │       ├── mockProvider.ts        # Mock provider for offline development
│   │   │       └── llmService.ts          # Central dispatcher & provider selector
│   │   ├── types/
│   │   │   ├── chat.ts                    # Backend chat request/response types
│   │   │   └── memory.ts                  # Phase 2 memory extraction schema
│   │   ├── app.ts                         # Express setup & CORS configuration
│   │   └── server.ts                      # Server listener entry point
│   ├── tests/
│   │   ├── chat.test.ts                   # Supertest integration tests for chat route
│   │   ├── geminiProvider.test.ts         # Unit tests for Gemini provider & error handling
│   │   └── mockProvider.test.ts           # Unit tests for Mock provider & switching
│   ├── .env.example                       # Environment template
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── design.md                              # Product UI & visual design specification
├── README.md                              # Setup, Gemini configuration & architecture documentation
└── .gitignore                             # Secret & artifact exclusion rules
```

---

## Prerequisites

1. **Node.js**: `v18.x` or higher (verified with `v20+` / `v22+`).
2. **npm**: `v9.x` or higher.
3. **Google Gemini API Key** (Free tier available at [Google AI Studio](https://aistudio.google.com/)).

---

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** (or **Create API key**).
4. Select or create a project, then copy your generated API key.
5. In your local `backend/.env` file, set:
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

> [!CAUTION]
> Never commit your `.env` file or paste your API key into source code or Git. `backend/.gitignore` excludes `.env` by default.

---

## Environment Variables Configuration

In `backend/.env` (created from `backend/.env.example`):

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Local port where Express server listens | `5000` |
| `FRONTEND_URL` | Allowed origin for frontend requests | `http://localhost:5173` |
| `LLM_PROVIDER` | Active AI provider (`gemini` or `mock`) | `gemini` (or `mock` offline) |
| `GEMINI_API_KEY` | Google AI Studio API key | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini model ID | `gemini-2.5-flash` |
| `MOCK_MODEL` | Label for mock responses in development | `mock-assistant-v1` |

### Supported Gemini Models
- `gemini-2.5-flash` *(Recommended)*: Fast, low latency, latest multimodal standard model with free tier.
- `gemini-1.5-flash`: Highly stable and responsive.
- `gemini-1.5-pro`: Best for complex reasoning and deep context analysis.

---

## Running the Application Locally

### 1. Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend server starts at `http://localhost:5000`:
- **Health check:** `GET http://localhost:5000/api/health`
- **Chat endpoint:** `POST http://localhost:5000/api/chat`

### 2. Start the Frontend Client

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The Vite development server automatically proxies `/api` requests to `http://localhost:5000`.

---

## Offline Development with Mock Provider

If you do not have an API key or wish to develop offline without consuming API quota:

1. In `backend/.env`, set:
   ```env
   LLM_PROVIDER=mock
   ```
2. Restart the backend (`npm run dev`).
3. The server will respond instantly with simulated responses clearly labeled `[Mock AI - mock-assistant-v1]: ...`.

---

## Running Automated Tests

All automated tests use mocks and do **not** require an external API key or network connection:

```bash
cd backend
npm test
```

### Covered Test Suites (32 Tests):
- **API Integration (`chat.test.ts`):**
  - Health check (`GET /api/health`)
  - Single message & conversation history support (`POST /api/chat`)
  - API contract preservation (`message` and `reply` fields)
  - Input validation (empty, whitespace, excessive length > 10,000 chars)
  - Safe error handling (401, 429, 500, 503) without leaking internal secrets or stack traces
- **Gemini Provider (`geminiProvider.test.ts`):**
  - Missing API key & placeholder detection (`ConfigurationError`)
  - Multi-turn mapping (`assistant` -> `model`)
  - Rate limiting & quota handling (`429` / `RESOURCE_EXHAUSTED`)
  - Authentication errors (`401` / `403`)
  - Model not found (`404` -> `ModelUnavailableError`)
  - Network connectivity errors (503)
  - Memory extraction schema validation & JSON error resilience
- **Mock Provider & Switching (`mockProvider.test.ts`):**
  - Mock identification and labeled outputs
  - Provider selection via `LLM_PROVIDER`
  - Prevention of silent fallback to mock on provider error

---

## Troubleshooting

| Issue | Likely Cause | Solution |
|---|---|---|
| **401 / 403 Authentication failed** | Missing, invalid, or placeholder `GEMINI_API_KEY` | Check `backend/.env` and verify key from [Google AI Studio](https://aistudio.google.com/). |
| **429 Rate limit / Quota exceeded** | Gemini free tier requests per minute (RPM) exceeded | Wait 60 seconds before making additional requests, or switch to `LLM_PROVIDER=mock` during UI layout testing. |
| **404 Model not found** | Unsupported or typo in `GEMINI_MODEL` | Set `GEMINI_MODEL=gemini-2.5-flash` in `backend/.env`. |
| **Frontend displays "Disconnected"** | Backend server is not running on port 5000 | Run `npm run dev` in `backend` directory. |
| **CORS errors** | Frontend URL mismatch | Set `FRONTEND_URL=http://localhost:5173` in `backend/.env`. |

---

## Future Phases (Phase 2 & Beyond)

1. **Phase 2 — SQLite Long-Term Memory:**
   - Add SQLite database (`better-sqlite3` or `sqlite3`) to store conversation logs and extracted user facts.
   - Use `llmService.extractMemories(text)` to automatically extract structured facts (preferences, skills, goals, projects) and persist them across sessions.
2. **Additional LLM Providers:**
   - To add **Groq** or **Ollama**, implement the `LLMProvider` interface in `services/llm/` and add the case to `llmService.ts`. No route or frontend changes required.
