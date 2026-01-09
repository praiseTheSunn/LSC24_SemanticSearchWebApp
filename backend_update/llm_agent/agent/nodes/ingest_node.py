
from agent.types import ChatState

def ingest_node(state: 'ChatState') -> 'ChatState':
    state.setdefault("messages", [])
    state.setdefault("plan_status", "empty")
    state.setdefault("artifacts", {})
    state.setdefault("last_results", [])
    state.setdefault("memory", {}).setdefault("defaults", {"top_k_display": 10})

    state["messages"].append({"role": "user", "content": state.get("user_text", "")})
    return state