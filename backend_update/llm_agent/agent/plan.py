# agent/plan.py
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple

from pydantic import ConfigDict, ValidationError

from tools.base import Operation, ToolSpec
from tools.manager import ToolManager

from langchain_openai import ChatOpenAI

import json
from pprint import pprint

# -----------------------
# Plan = sequence of tool calls
# -----------------------


@dataclass
class ToolCall:
    """One invocation of a tool."""
    step_id: int
    tool: str
    operation: Operation

    # How to run it
    query: Optional[str] = None
    params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Plan:
    model_config = ConfigDict(extra="forbid")
    goal: str
    calls: List[ToolCall]

    top_k_display: int = 10
    rationale: Optional[str] = None
    budget: Optional[Dict[str, Any]] = None
    fusion: Optional[Dict[str, Any]] = None


# -----------------------
# Derived runtime metadata
# -----------------------

@dataclass
class CallMeta:
    idx: int
    tool: str
    operation: Operation
    supports_operation: bool

    resolved_query: str
    resolved_params: Dict[str, Any]

    consumes: List[str] = field(default_factory=list)
    produces: str = ""

    latency_cost: float = 0.0
    default_weight: float = 0.0
    score_range: Optional[Tuple[float, float]] = None
    calibration: Optional[str] = None


@dataclass
class PlanMeta:
    plan: Plan
    tools_used: List[ToolSpec]
    calls: List[CallMeta]
    total_cost_estimate: float = 0.0


# -----------------------
# Serialization helpers
# -----------------------

def plan_to_dict(plan: Plan) -> Dict[str, Any]:
    return asdict(plan)

def plan_from_dict(d: Dict[str, Any]) -> Plan:
    calls = [ToolCall(**c) for c in d.get("calls", [])]
    return Plan(
        goal=d["goal"],
        calls=calls,
        top_k_display=int(d.get("top_k_display", 10)),
        rationale=d.get("rationale"),
        budget=d.get("budget"),
        fusion=d.get("fusion"),
    )


# -----------------------
# Tool specs from ToolManager (avoid re-creating ToolSpec!)
# -----------------------

def get_tool_specs(tool_manager: ToolManager) -> Dict[str, ToolSpec]:
    """
    Requires ToolManager.list_specs() to return Dict[str, ToolSpec].
    """
    return tool_manager.list_specs()


def get_tool_catalog_for_prompt(tool_manager: ToolManager) -> Dict[str, Any]:
    specs = get_tool_specs(tool_manager)

    out: Dict[str, Any] = {}
    for name, spec in specs.items():
        out[name] = {
            "description": spec.description,
            "supported_operations": spec.supported_operations,
            "param_schema": spec.param_schema,
            "default_top_k": spec.default_top_k,
            "default_weight": spec.default_weight,
            "latency_cost": spec.latency_cost,
            "score_range": spec.score_range,
            "calibration": spec.calibration,
        }
    return out


def extract_plan_meta(plan: Plan, tool_manager: ToolManager) -> PlanMeta:
    specs = get_tool_specs(tool_manager)

    tools_used_map: Dict[str, ToolSpec] = {}
    call_meta: List[CallMeta] = []
    total_cost = 0.0

    for idx, call in enumerate(plan.calls, start=1):
        spec = specs.get(call.tool)

        if spec is None:
            # Unknown tool: still record something
            dummy = ToolSpec(
                name=call.tool,
                description="(unknown tool)",
                operations=[],
                param_schema={},
                latency_cost=0.0,
            )
            spec = dummy

        tools_used_map.setdefault(spec.name, spec)
        supports = call.operation in spec.operations

        resolved_query = (call.query or plan.goal).strip()

        resolved_params = dict(call.params or {})
        if call.operation in ("search", "rerank"):
            resolved_params.setdefault("top_k", spec.default_top_k)

        consumes: List[str] = []
        if call.input:
            consumes.append(call.input)
        if call.inputs:
            consumes.extend(call.inputs)

        total_cost += float(spec.latency_cost)

        call_meta.append(CallMeta(
            idx=idx,
            tool=call.tool,
            operation=call.operation,
            supports_operation=supports,
            resolved_query=resolved_query,
            resolved_params=resolved_params,
            consumes=consumes,
            latency_cost=spec.latency_cost,
            default_weight=spec.default_weight,
            score_range=spec.score_range,
            calibration=spec.calibration,
        ))

    return PlanMeta(
        plan=plan,
        tools_used=list(tools_used_map.values()),
        calls=call_meta,
        total_cost_estimate=total_cost,
    )


# -----------------------
# Default plan
# -----------------------

def default_fallback_plan(top_k_display: int = 10) -> Plan:
    return Plan(
        goal='Retrieve images/videos related to a visit to a house with a stone shed in Ireland on a sunny day.',
        top_k_display=top_k_display,
        calls=[
            ToolCall(
                step_id=1,
                tool="text_semantic",
                operation="search",
                query='images or videos of a house with a stone shed in Ireland under green trees on a sunny day',
                # query='house in Ireland',
                params={'top_k': 1000, 'weight': 0.6, 'norm': 'minmax'}
            ),
            ToolCall(
                step_id=2, 
                tool='ocr',
                operation='search',
                query="for sale",
                params={'top_k': 1000, 'weight': 0.3, 'norm': 'zscore'}
            ),
            ToolCall(
                step_id=3,
                tool='object_tags',
                operation='search',
                query="house",
                # params={'top_k': 50, "subset_record_ids": list(range(8715))}
                params={'top_k': 1000, 'weight': 0.1}
            ),
        ],
        rationale="Default plan: semantic search followed by two reranking steps to refine results.",
        # fusion={"method": "rrf", "rrf_c": 60.0}
        fusion={"method": "combsum"}
    )        


# -----------------------

async def build_plan(
    query: str,
    *,
    tool_manager: ToolManager,
    top_k_display: int = 10,
) -> Dict[str, Any]:
    """
    Returns a JSON-able dict suitable to store in state["active_plan"].
    The executor should iterate plan["calls"].
    """

    catalog = get_tool_catalog_for_prompt(tool_manager)

    system_prompt = """You are a retrieval planner for an agentic image/video retrieval chatbot.

You MUST produce a plan that can be executed step-by-step with tools.

Hard requirements:
- Output must match the JSON schema exactly (no markdown).
- Only use tools that exist in TOOL_CATALOG.
- You should create a plan with 3 tool calls. Among these calls, a tool can be called multiple times with different params. For example, with one tool, you can use different queries at each call.
- You can paraphrase the query to feed to each tool based on the original user query.
- Remember to specify the fusion operation at each tool call.
- Each call.input must be unique.
- Use call.input for single-input operations (rerank/filter).
- Use call.inputs (list of artifact keys) for multi-input operations (merge/fuse).
- Ensure the final call produces 'top_results' (save_as == "top_results") which is what the UI will display.
- Prefer: semantic search for recall, then attribute/keyword filtering/rerank if relevant, then fusion/top-k.

Notes:
- If constraints are not explicit, keep it simple: semantic search -> top_k.
"""

    user_payload = {
        "user_query": query,
        "top_k_display": top_k_display,
        "tool_catalog": catalog,
    }

    # llm = ChatGoogleGenerativeAI(
    #     model="gemini-2.5-pro",
    #     google_api_key="AIzaSyCJnvsu-XwFRsPmE30ldk_UkUs0ojSyOz4",
    #     temperature=0.2,
    # )   

    llm = ChatOpenAI(
        model="gpt-4o-mini",   # fast + cheap
        temperature=0,
    )

    try:
        assert 1==2
        llm_struct = llm.with_structured_output(
            schema=Plan,
            # method="function_calling",            # Not needed with OpenAI
        )

        plan_dict: Plan = await llm_struct.ainvoke(
            [
                ("system", system_prompt),
                ("human", "TOOL_CATALOG:\n" + json.dumps(catalog, ensure_ascii=False)),
                ("human", "REQUEST:\n" + json.dumps(user_payload, ensure_ascii=False)),
            ]
        )

        plan = plan_from_dict(plan_dict)
        calls = plan.calls 

        print(f"Planner output plan:")
        pprint(plan)

        if not calls:
            # Add a final top_k call if available; else just rename last output
            if "top_k" in tool_manager.list_specs():
                calls.append(
                    ToolCall(
                        tool="top_k",
                        operation="filter",
                        params={"k": plan.top_k_display}
                    )
                )

        plan = Plan(
            goal=plan.goal,
            calls=calls,
            top_k_display=plan.top_k_display,
            rationale=plan.rationale,
            budget=plan.budget,
            fusion=plan.fusion,
        )
        return plan_to_dict(plan)

    except (ValidationError, Exception):
        # Keep your system robust: always return an executable plan.
        plan = default_fallback_plan(top_k_display)
        print(f"Planner fallback plan:")
        return plan_to_dict(plan)
    

def edit_plan(plan: Dict[str, Any], refinement: str) -> Dict[str, Any]:
    # You’ll later patch params/calls based on refinement
    plan2 = dict(plan)
    plan2["goal"] = f"{plan.get('goal','')} | refinement: {refinement}"
    return plan2


def render_plan(plan: Dict[str, Any]) -> str:
    lines = [f"Proposed plan (draft):", f"- Goal: {plan.get('goal','')}", "- Calls:"]
    for i, s in enumerate(plan.get("calls", []), start=1):
        lines.append(f"  {i}. {s.get('tool')} op={s.get('operation')}")
    lines.append("")
    lines.append("Reply **approve** to run, or send refinements. Reply **reject** to discard.")
    return "\n".join(lines)