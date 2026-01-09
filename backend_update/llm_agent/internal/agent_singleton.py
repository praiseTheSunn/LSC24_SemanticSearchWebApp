"""Simple singleton accessor for LangChainAgentCore.

Use `from internal.agent_singleton import get_agent_core` then call
`agent_core = get_agent_core()` from modules to ensure a single instance.
"""
from typing import Optional

from .agent_core import LangChainAgentCore

_AGENT_CORE: Optional[LangChainAgentCore] = None


def get_agent_core() -> LangChainAgentCore:
    global _AGENT_CORE
    if _AGENT_CORE is None:
        _AGENT_CORE = LangChainAgentCore()
    return _AGENT_CORE


# convenience variable (not evaluated until imported by consumers)
def _ensure_agent():
    return get_agent_core()
