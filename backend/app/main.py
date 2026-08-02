from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.db.session import reset_database
from app.routers import auth, health

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    reset_database()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
# PL-5 will add: app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
# PL-7 will add: app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

if STATIC_DIR.is_dir():
    # Registered last so /api/* routes above always take precedence over the
    # static catch-all. Serves the Next.js static export (see next.config.ts).
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
