# agent/graph.py
from __future__ import annotations

import re

from agent.types import ChatState

from langchain_openai import ChatOpenAI

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver


from tools.manager import ToolManager
from agent.nodes.ingest_node import ingest_node
from agent.nodes.help_node import help_node
from agent.nodes.refine_node import refine_node
from agent.nodes.reject_node import reject_node
from agent.nodes.execute_node import execute_node
from agent.nodes.plan_node import plan_node


# -----------------------
# Router
# -----------------------

_APPROVE_PATTERN = re.compile(r"^(approve|yes|y|ok|okay|run|go|execute)$", re.IGNORECASE)
_REJECT_PATTERN  = re.compile(r"^(reject|no|n|cancel|stop)$", re.IGNORECASE)
_REFINEMENT_MARKERS = ["only", "exclude", "without", "not", "filter", "remove", "more like", "under", "after", "sort"]

def route_intent(state: ChatState) -> ChatState:
    text = (state.get("user_text") or "").strip()
    has_plan = bool(state.get("active_plan"))
    status = state.get("plan_status", "empty")
    print(f"Routing intent: has_plan={has_plan} status={status} text='{text}'")

    if text.lower() in {"help", "/help", "?"}:
        state["intent"] = "HELP"
        return state

    if has_plan and status == "draft":
        if _APPROVE_PATTERN.match(text):
            print("User approved the plan.")
            state["intent"] = "APPROVE"
            return state
        if _REJECT_PATTERN.match(text):
            state["intent"] = "REJECT"
            return state

    if not has_plan or status == "empty":
        state["intent"] = "NEW_QUERY"
        return state

    t = text.lower()
    if any(m in t for m in _REFINEMENT_MARKERS) or len(t.split()) <= 6:
        state["intent"] = "REFINEMENT"
        return state

    state["intent"] = "NEW_QUERY"
    return state


def router(state: ChatState) -> str:
    i = state.get("intent")
    if i == "HELP": return "help"
    if i == "REJECT": return "reject"
    if i == "APPROVE": return "execute"
    if i == "REFINEMENT": return "refine"
    return "plan"


# -----------------------
# Build graph (inject ToolManager)
# -----------------------

def build_graph(tool_manager: ToolManager):
    g = StateGraph(ChatState)

    g.add_node("ingest", ingest_node)
    g.add_node("route", route_intent)
    g.add_node("help", help_node)
    g.add_node("refine", refine_node)
    g.add_node("reject", reject_node)

    # Inject ToolManager via closure
    async def _plan(state: ChatState) -> ChatState:
        return await plan_node(state, tool_manager)
    
    async def _execute(state: ChatState) -> ChatState:
        return await execute_node(state, tool_manager)

    g.add_node("plan", _plan)
    g.add_node("execute", _execute)

    g.add_edge(START, "ingest")
    g.add_edge("ingest", "route")
    g.add_conditional_edges("route", router, {
        "help": "help",
        "reject": "reject",
        "execute": "execute",
        "refine": "refine",
        "plan": "plan",
    })

    g.add_edge("help", END)
    g.add_edge("reject", END)
    g.add_edge("plan", END)
    g.add_edge("refine", END)
    g.add_edge("execute", END)

    return g.compile(checkpointer=MemorySaver())