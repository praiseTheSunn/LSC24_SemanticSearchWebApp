import os
import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any

DEFAULT_LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
DEFAULT_JSONL = "history.jsonl"


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _atomic_write(path: str, data: str) -> None:
    # Write to a temp file in same dir then replace for atomicity
    d = os.path.dirname(path) or "."
    _ensure_dir(d)
    tmp = os.path.join(d, f".{os.path.basename(path)}.tmp.{uuid.uuid4().hex}")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(data)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def init_logger(log_dir: Optional[str] = None, jsonl_name: str = DEFAULT_JSONL) -> Dict[str, str]:
    """Initialize logger directory and return paths."""
    ld = log_dir or DEFAULT_LOG_DIR
    _ensure_dir(ld)
    jsonl_path = os.path.join(ld, jsonl_name)
    # ensure file exists
    if not os.path.exists(jsonl_path):
        open(jsonl_path, "a", encoding="utf-8").close()
    return {"log_dir": ld, "jsonl": jsonl_path}


# initialize default paths on import
_paths = init_logger()


def log_interaction(
    session_id: str,
    role: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
    agent_core: Optional[Any] = None,
) -> Dict[str, Any]:
    """Log an interaction to the global JSONL and to a per-session snapshot file.

    - Appends a JSON line to the global log file (`logs/history.jsonl`).
    - Rewrites a per-session snapshot file (`logs/session_{session_id}.json`) containing
      a list of ordered entries (best-effort atomic rewrite).
    - If `agent_core` is provided and exposes `_memory_set`, updates the MemorySaver
      with a session-scoped key so the memory and logs stay in sync.

    Returns the log entry dict.
    """
    ts = datetime.utcnow().isoformat() + "Z"
    entry_id = uuid.uuid4().hex
    entry = {
        "id": entry_id,
        "timestamp": ts,
        "session_id": session_id,
        "role": role,
        "content": content,
        "metadata": metadata or {},
    }

    # 1) append to global JSONL
    try:
        with open(_paths["jsonl"], "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        # best-effort: ignore failures to not break endpoints
        pass

    # 2) rewrite per-session snapshot
    try:
        session_file = os.path.join(_paths["log_dir"], f"session_{session_id}.json")
        if os.path.exists(session_file):
            try:
                with open(session_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if not isinstance(data, list):
                    data = []
            except Exception:
                data = []
        else:
            data = []
        data.append(entry)
        _atomic_write(session_file, json.dumps(data, ensure_ascii=False, indent=2))
    except Exception:
        pass

    # 3) best-effort: update agent memory if available
    try:
        if agent_core is not None:
            # prefer using agent_core helper if available
            save_fn = getattr(agent_core, "_memory_set", None)
            if callable(save_fn):
                key = f"msg:{session_id}:{entry_id}"
                save_fn(key, {"type": "message", "content": entry["content"], "created_at": entry["timestamp"], "role": role, "session_id": session_id})
            else:
                # try common public save method
                save_fn = getattr(agent_core, "save_plan", None)
                if callable(save_fn):
                    # save_plan expects plan-like object; wrap message minimally
                    plan_like = {"id": entry_id, "goal": entry["content"], "created_at": entry["timestamp"]}
                    try:
                        agent_core.save_plan(session_id, plan_like)
                    except Exception:
                        # fallback: attempt direct memory access
                        try:
                            mem = getattr(agent_core, "memory", None)
                            if mem is not None:
                                mem_key = f"msg:{session_id}:{entry_id}"
                                try:
                                    mem[mem_key] = {"type": "message", "content": entry["content"], "created_at": entry["timestamp"], "role": role}
                                except Exception:
                                    # try save method on memory
                                    for mname in ("save", "put", "add", "write"):
                                        if hasattr(mem, mname):
                                            try:
                                                getattr(mem, mname)(mem_key, {"type": "message", "content": entry["content"], "created_at": entry["timestamp"], "role": role})
                                                break
                                            except Exception:
                                                continue
                        except Exception:
                            pass
    except Exception:
        pass

    return entry


def get_session_log(session_id: str) -> Optional[list]:
    session_file = os.path.join(_paths["log_dir"], f"session_{session_id}.json")
    try:
        with open(session_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception:
        return None


def list_sessions() -> list:
    try:
        files = os.listdir(_paths["log_dir"])
        sessions = [f[len("session_"):-5] for f in files if f.startswith("session_") and f.endswith(".json")]
        return sessions
    except Exception:
        return []