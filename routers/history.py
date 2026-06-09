from datetime import datetime, timezone
import json
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field


router = APIRouter()

HISTORY_PATH = Path(__file__).resolve().parent.parent / "data" / "history.json"


class HistoryItem(BaseModel):
    filename: str
    url: str
    campaign: str
    background: str = "Uncategorized"
    timestamp: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


def _read_history() -> List[dict]:
    if not HISTORY_PATH.exists():
        return []
    try:
        data = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    return data if isinstance(data, list) else []


def _write_history(items: List[dict]) -> None:
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    HISTORY_PATH.write_text(json.dumps(items[:50], indent=2), encoding="utf-8")


@router.get("/", response_model=List[HistoryItem])
def get_history():
    return _read_history()


@router.post("/", response_model=HistoryItem)
def add_history(item: HistoryItem):
    payload = item.dict()
    payload["background"] = payload.get("background") or "Uncategorized"
    if not payload.get("timestamp"):
        payload["timestamp"] = datetime.now(timezone.utc).isoformat()

    history = _read_history()
    history.insert(0, payload)
    _write_history(history)
    return payload
