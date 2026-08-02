# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation supports one document type (Mutual NDA) via a manual form, not yet AI chat. A backend/auth foundation exists but user authentication and document persistence are not yet wired into the product. See "Implementation Status" below for what's actually built.

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

### Not yet built
- AI chat interface for establishing document type/fields
- Support for the other 10 document types beyond Mutual NDA
- Document persistence (save/load/delete)
- Frontend auth UI (login/signup pages, session-aware UI)
