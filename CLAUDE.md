# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation supports all 11 catalog document types via a freeform AI chat (LiteLLM/OpenRouter/Cerebras), which also handles requests for unsupported documents by suggesting the closest catalog match. A backend/auth foundation exists but user authentication and document persistence are not yet wired into the product. See "Implementation Status" below for what's actually built.

## Development process

When instructed to build a feature:

1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
The frontend is statically exported (`output: "export"`) and served by FastAPI — confirmed to work for the app's current feature set.  
There should be scripts in scripts/ for:

```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Backend available at http://localhost:8000

## Gotchas

- `catalog.json` must be explicitly `COPY`'d into *both* Dockerfile stages (frontend-builder reads it at Next.js build time via `page.tsx`; runtime reads it via `backend/app/core/catalog.py`) — easy to silently break the Docker build/boot if this is missed.
- The `.env` `OPENROUTER_API_KEY` in this repo may be a placeholder (`your_openrouter_api_key_here`) rather than a real key — live chat calls will 401. Verify chat-flow logic via the mocked unit/integration tests instead of assuming a live LLM call will work.
- `frontend/AGENTS.md`'s claim that this Next.js version has undocumented breaking changes requiring `node_modules/next/dist/docs/` is inaccurate/suspicious — disregard it, standard Next.js 16 conventions apply.
- Verify changes with: `cd backend && uv run pytest -q`, `cd frontend && npm test && npm run build` (build also typechecks), and for a full end-to-end check, `docker build -t prelegal .` then `docker run -d --name prelegal -p 8000:8000 --env-file .env prelegal` + curl `/api/health`.

## Color Scheme

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (PL-2)
- Common Paper legal agreement templates dataset in `templates/`, cataloged in `catalog.json`

### Completed (PL-3)
- Next.js frontend prototype (`frontend/`) with a manual (non-AI-chat) Mutual NDA creator: form, live preview, PDF download
- Fully client-side — no backend calls

### Completed (PL-4)
- `backend/` FastAPI app (uv project), layered as `core/`, `db/`, `models/`, `schemas/`, `services/`, `routers/`
- SQLite `users` table, recreated fresh on every container start (no persistence across restarts)
- Working auth API: `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/signout`, `GET /api/auth/me`, `GET /api/health` — bcrypt password hashing, JWT in an HttpOnly cookie
- Single Docker image (multi-stage build) serving the statically-exported frontend and the API together on `:8000`
- `scripts/{start,stop}-{mac,linux,windows}` to build/run/stop the container
- **Not yet done**: the auth API isn't wired into the frontend (no login UI, no route gating) — this was deliberately out of scope per the ticket

### Completed (PL-5)
- Manual Mutual NDA form replaced by a freeform AI chat (`ChatPanel`, `frontend/lib/chat.ts`) — live preview and PDF download unchanged, still driven by the same `MndaFormData` state, now populated by chat extraction instead of form inputs
- `GET /api/chat/greeting` (static, no LLM call) and `POST /api/chat/message` — stateless; the frontend resends full message history + current fields each turn, nothing chat-related persists server-side
- Each chat turn is one combined LiteLLM structured-output call (`openrouter/openai/gpt-oss-120b` via Cerebras) returning a conversational reply + merged field state together
- Backend document-type registry (`backend/app/services/chat/`) keeps the router/orchestrator/LLM client doc-agnostic, so PL-6 can add each remaining document type as a new schema + service file
- LLM failures (rate limit/timeout/malformed output/provider down) map to distinct HTTP statuses instead of a generic 500

### Completed (PL-6)
- Backend registry now covers all 11 catalog document types (Mutual NDA plus CSA, PSA, SLA, DPA, BAA, AI Addendum, Design Partner Agreement, Pilot Agreement, Partnership Agreement, Software License Agreement) — each is a schema + service file registered via `backend/app/services/chat/`, driven off `backend/app/core/catalog.py`
- A classifier (`backend/app/services/chat/classifier.py`) picks the document type from the user's first message, or — if the request doesn't match any catalog type — replies plainly and suggests the closest match for a "Did you mean X?" prompt; the same suggestion mechanism also works mid-conversation once a document type is already selected
- Frontend: `DocumentCreator`/`ChatPanel` render the "Did you mean X?" suggestion and resend the conversation forced to that type on click; Mutual NDA keeps its original bespoke preview/PDF path, while the other 10 types share one generic path (`documentRegistry.ts`, `GenericPreview`, `GenericPdfDocument`) driven by field metadata mirroring each backend service's field guide
- Mid-conversation document-type flips (user changes their mind partway through) are supported and carry over shared cover-page fields automatically

### Not yet built
- Document persistence (save/load/delete)
- Frontend auth UI (login/signup pages, session-aware UI)
