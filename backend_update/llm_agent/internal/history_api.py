from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from .audit_log import AUDIT_LOGGER

router = APIRouter(prefix="/history", tags=["history"])


def _session_dir(session_id: str) -> str:
    return os.path.join(AUDIT_LOGGER.base_dir, "sessions", session_id)


@router.get("/sessions")
def list_sessions() -> Dict[str, Any]:
    base = os.path.join(AUDIT_LOGGER.base_dir, "sessions")
    if not os.path.isdir(base):
        return {"sessions": []}
    sessions = [name for name in os.listdir(base) if os.path.isdir(os.path.join(base, name))]
    sessions.sort()
    return {"sessions": sessions}


@router.get("/session/{session_id}/events")
def get_session_events(
    session_id: str,
    limit: int = Query(500, ge=1, le=5000),
) -> Dict[str, Any]:
    path = os.path.join(_session_dir(session_id), "events.jsonl")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Session not found")

    events: List[Dict[str, Any]] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except Exception:
                continue

    if len(events) > limit:
        events = events[-limit:]

    return {"session_id": session_id, "count": len(events), "events": events}


@router.get("/session/{session_id}/plans")
def list_session_plans(session_id: str) -> Dict[str, Any]:
    plans_dir = os.path.join(_session_dir(session_id), "plans")
    if not os.path.isdir(plans_dir):
        raise HTTPException(status_code=404, detail="Session not found")

    plan_ids = [
        os.path.splitext(name)[0]
        for name in os.listdir(plans_dir)
        if name.lower().endswith(".json")
    ]
    plan_ids.sort()
    return {"session_id": session_id, "plan_ids": plan_ids}


@router.get("/session/{session_id}/plan/{plan_id}")
def get_plan_snapshot(session_id: str, plan_id: str) -> Dict[str, Any]:
    path = os.path.join(_session_dir(session_id), "plans", f"{plan_id}.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Plan snapshot not found")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return {"session_id": session_id, "plan_id": plan_id, "plan": data}
