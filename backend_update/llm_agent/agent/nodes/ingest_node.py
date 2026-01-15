
import os

from agent.types import ChatState

def ingest_node(state: 'ChatState') -> 'ChatState':
    state.setdefault("messages", [])
    state.setdefault("plan_status", "empty")
    state.setdefault("artifacts", {})
    state.setdefault("last_results", [])

    defaults = state.setdefault("memory", {}).setdefault("defaults", {})
    if "top_k_display" not in defaults:
        try:
            defaults["top_k_display"] = max(1, int(os.getenv("TOP_K_DISPLAY", "10")))
        except Exception:
            defaults["top_k_display"] = 10

    state["messages"].append({"role": "user", "content": state.get("user_text", "")})
    return state