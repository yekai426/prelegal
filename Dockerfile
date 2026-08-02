# syntax=docker/dockerfile:1

# ---------- Stage 1: Next.js static export ----------
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY templates/ /app/templates/
RUN npm run build
# next.config.ts sets output: "export" -> emits /app/frontend/out

# ---------- Stage 2: resolve backend deps with uv ----------
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS backend-builder
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=0
WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project --no-dev
COPY backend/app ./app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

# ---------- Stage 3: minimal runtime ----------
FROM python:3.12-slim-bookworm AS runtime
RUN useradd --create-home --uid 999 prelegal
WORKDIR /app/backend
COPY --from=backend-builder /app/backend /app/backend
COPY --from=frontend-builder /app/frontend/out /app/backend/static
RUN mkdir -p /app/backend/data && chown -R prelegal:prelegal /app/backend

ENV PATH="/app/backend/.venv/bin:$PATH" PYTHONUNBUFFERED=1
USER prelegal
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
