from typing import Any, Dict, List, Literal, Optional, TypedDict

class ChatState(TypedDict, total=False):
    messages: List[Dict[str, str]]
    user_text: str

    intent: Literal["NEW_QUERY", "REFINEMENT", "APPROVE", "REJECT", "HELP"]
    reply: str

    active_plan: Dict[str, Any]
    plan_status: Literal["empty", "draft", "approved", "executing", "done"]

    artifacts: Dict[str, Any]
    last_results: List[Dict[str, Any]]

    memory: Dict[str, Any]