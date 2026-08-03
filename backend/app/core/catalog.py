import json
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

CATALOG_PATH = Path(__file__).resolve().parents[3] / "catalog.json"


def slugify(stem: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", stem.lower()).strip("_")


@dataclass(frozen=True)
class CatalogEntry:
    key: str
    name: str
    description: str
    filename: str


@lru_cache
def load_catalog() -> tuple[CatalogEntry, ...]:
    raw = json.loads(CATALOG_PATH.read_text())
    entries = []
    for item in raw:
        stem = Path(item["filename"]).stem
        # Cover-page fragments (currently only Mutual-NDA-coverpage.md) are
        # not standalone document types — they complete another entry.
        if "coverpage" in stem.lower():
            continue
        entries.append(
            CatalogEntry(key=slugify(stem), name=item["name"], description=item["description"], filename=item["filename"])
        )
    return tuple(entries)


@lru_cache
def catalog_by_key() -> dict[str, CatalogEntry]:
    return {entry.key: entry for entry in load_catalog()}


def label_for(document_type: str) -> str | None:
    entry = catalog_by_key().get(document_type)
    return entry.name if entry else None
