import json
import os
from pathlib import Path
import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _atomic_write_text(path: str, text: str) -> None:
    directory = os.path.dirname(path) or "."
    _ensure_dir(directory)
    tmp = os.path.join(directory, f".{os.path.basename(path)}.tmp.{uuid.uuid4().hex}")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


@dataclass(frozen=True)
class AuditPaths:
    base_dir: str

    def session_dir(self, session_id: str) -> str:
        return os.path.join(self.base_dir, "sessions", session_id)

    def session_events_jsonl(self, session_id: str) -> str:
        return os.path.join(self.session_dir(session_id), "events.jsonl")

    def session_state_json(self, session_id: str) -> str:
        return os.path.join(self.session_dir(session_id), "state.json")

    def session_plans_dir(self, session_id: str) -> str:
        return os.path.join(self.session_dir(session_id), "plans")

    def session_plan_snapshot(self, session_id: str, plan_id: str) -> str:
        return os.path.join(self.session_plans_dir(session_id), f"{plan_id}.json")


class SessionAuditLogger:
    """Durable per-session audit log.

    Writes:
    - logs/sessions/<session_id>/events.jsonl  (append-only)
    - logs/sessions/<session_id>/plans/<plan_id>.json (latest snapshot per plan_id)
    - logs/sessions/<session_id>/state.json (small summary pointers)

    This is intentionally file-based and dependency-free.
    """

    def __init__(self, base_dir: Optional[str] = None):
        if base_dir is None:
            env = (os.getenv("AGENT_AUDIT_DIR") or "").strip()
            if env:
                base_dir = env
            else:
                # backend_update/llm_agent/internal/audit_log.py -> backend_update/llm_agent/logs
                here = os.path.dirname(__file__)
                base_dir = os.path.abspath(os.path.join(here, "..", "logs"))

        self._paths = AuditPaths(base_dir=base_dir)
        self._lock = threading.Lock()


    @property
    def base_dir(self) -> str:
        return self._paths.base_dir


    def _get_session_plan_id(self, session_id: str) -> Optional[str]:
        try:
            state_path = Path(__file__).parent.parent / "logs" / "sessions" / session_id / "state.json"
            if not state_path.exists():
                return None
            data = json.loads(state_path.read_text(encoding="utf-8"))
            # try common shapes where a plan id might be stored
            for key in ("latest_plan_id", "plan_id", "current_plan_id", "plan", "active_plan"):
                if key in data:
                    val = data[key]
                    if isinstance(val, str) and val:
                        return val
                    if isinstance(val, dict) and "id" in val:
                        return val["id"]
        except Exception:
            return None
        return None


    def ensure_session(self, session_id: str) -> None:
        _ensure_dir(self._paths.session_dir(session_id))
        _ensure_dir(self._paths.session_plans_dir(session_id))
        # ensure events file exists
        events_path = self._paths.session_events_jsonl(session_id)
        if not os.path.exists(events_path):
            _ensure_dir(os.path.dirname(events_path))
            open(events_path, "a", encoding="utf-8").close()


    def append_event(
        self,
        session_id: str,
        event_type: str,
        payload: Dict[str, Any],
        *,
        direction: str = "out",
        message_id: Optional[str] = None,
        plan_id: Optional[str] = None,
        step_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Append one event (JSON line) to the per-session log."""
            
        # Ensure session directory and files exist
        self.ensure_session(session_id)

        # Preserve explicit plan_id if provided, otherwise try to read from session state
        if not plan_id:
            plan_id = self._get_session_plan_id(session_id)
        entry = {
            "id": str(uuid.uuid4()),
            "ts": _utc_now_iso(),
            "session_id": session_id,
            "direction": direction,
            "type": event_type,
            "message_id": message_id,
            "plan_id": plan_id,
            "step_id": step_id,
            "payload": payload,
        }
        print(f"Appending event: session_id={session_id}, event_type={event_type}, plan_id={plan_id}, step_id={step_id}")

        # Serialize and append to events.jsonl
        line = json.dumps(entry, ensure_ascii=False)
        events_path = self._paths.session_events_jsonl(session_id)

        # Use a process-local lock to avoid interleaving lines.
        with self._lock:
            with open(events_path, "a", encoding="utf-8") as f:
                f.write(line + "\n")

        return entry


    def snapshot_plan(self, session_id: str, plan: Dict[str, Any]) -> Optional[str]:
        """Write/overwrite the latest plan snapshot for this plan_id."""
        if not isinstance(plan, dict):
            return None

        plan_id = str(plan.get("id") or plan.get("plan_id") or "").strip()
        if not plan_id:
            # Don't mutate caller; just skip snapshotting without id.
            return None

        self.ensure_session(session_id)
        path = self._paths.session_plan_snapshot(session_id, plan_id)
        _atomic_write_text(path, json.dumps(plan, ensure_ascii=False, indent=2))

        # Update session state pointer
        self._update_state(session_id, {"latest_plan_id": plan_id, "updated_at": _utc_now_iso()})
        return plan_id


    def _update_state(self, session_id: str, patch: Dict[str, Any]) -> None:
        """ Patch the session state JSON with the given key-values."""
        self.ensure_session(session_id)
        state_path = self._paths.session_state_json(session_id)

        with self._lock:
            cur: Dict[str, Any] = {}
            if os.path.exists(state_path):
                try:
                    with open(state_path, "r", encoding="utf-8") as f:
                        cur = json.load(f) or {}
                except Exception:
                    cur = {}

            if not isinstance(cur, dict):
                cur = {}

            cur.update(patch)
            _atomic_write_text(state_path, json.dumps(cur, ensure_ascii=False, indent=2))


# Singleton used by the service
AUDIT_LOGGER = SessionAuditLogger()
