from functools import lru_cache
from pathlib import Path
from typing import Iterator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.base import Base
# Import models so they're registered on Base.metadata before create_all runs.
from app.models import user  # noqa: F401

_SQLITE_PREFIX = "sqlite:///"


def _ensure_sqlite_dir(database_url: str) -> None:
    if not database_url.startswith(_SQLITE_PREFIX):
        return
    # "sqlite:///relative/path.db" (relative) vs "sqlite:////abs/path.db"
    # (absolute) — the path is everything after the fixed 10-char prefix.
    db_path = database_url[len(_SQLITE_PREFIX):]
    if db_path and db_path != ":memory:":
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    _ensure_sqlite_dir(settings.database_url)
    connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
    return create_engine(settings.database_url, connect_args=connect_args)


def reset_database(engine: Engine | None = None) -> None:
    """Drop and recreate all tables — the app's "fresh DB every start" contract."""
    engine = engine or get_engine()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def get_db() -> Iterator[Session]:
    session_factory = sessionmaker(bind=get_engine())
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
