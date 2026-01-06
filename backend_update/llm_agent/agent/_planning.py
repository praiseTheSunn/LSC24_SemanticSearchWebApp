import datetime
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from schemas import AgentPlanRequest, ExecutePlanRequest, PlanStatusResponse, AgentPlan
from internal.agent_core import LangChainAgentCore
from typing import Dict, Any
from internal.tools_adapter import StepQuery, ExecutionContext, Candidate, run_step_via_main
from internal.merge import incremental_merge
from pprint import pprint
import json
# Prefer the milvus internal helpers (re-export shim)
try:
    from backend_update.milvus.internal.search import (
        search_dense,
        search_sparse,
        apply_filter_only,
    )
except Exception:
    # best-effort fallback to None; code will fallback to run_step_via_main
    search_dense = None
    search_sparse = None
    apply_filter_only = None

# Use the local ToolManager so we execute the concrete Tool classes when possible
from backend_update.llm_agent.tools.___init__ import ToolManager
from schemas import ToolExecutionContext, ToolResult
from check_history import log_interaction

tool_manager = ToolManager()

router = APIRouter(
    prefix="/planning",
    tags=["planning"],
)

# Initialize agent core (LangChainAgentCore is a singleton)
agent_core = LangChainAgentCore()
# Simple in-memory plan store (for demo/prototyping). Replace with Redis or DB for production.
PLAN_STORE: Dict[str, Dict[str, Any]] = {}


@router.post("/plan/{plan_id}/execute")
async def execute_plan(plan_id: str, payload: ExecutePlanRequest):
    """Execute a created plan"""
    # Retrieve plan from store
    plan_data = PLAN_STORE.get(plan_id)
    if not plan_data:
        return JSONResponse(
            status_code=404,
            content={"error": "Plan not found"},
            headers={'Access-Control-Allow-Origin': '*'}
        )

    # Execute actions sequentially using HTTP adapter to main service
    results = []
    ctx = ExecutionContext(last_text=None, global_constraints=plan_data.get("constraints") or {})

    # We'll perform incremental merging after each action so later steps can use subset_record_ids
    processed_actions = []
    prev_merged: list[Candidate] = []
    new_merged: list[Candidate] = []
    
    for action in plan_data.get("actions", []):
        tool_name = action.get("tool")
        params = action.get("parameters", {}) or {}

        # Prefer executing the registered Tool class via ToolManager
        candidates: list[Candidate] = []
        tool = tool_manager.get_tool(tool_name)
        print(f"Tool: {tool}")
        if tool:
            # build execution context
            try:
                exec_ctx = ToolExecutionContext(
                    tool=tool_name,
                    parameters=params,
                    session_id=payload.session_id,
                    action_id=action.get("id")
                )
            except Exception as e:
                print(f"Error building execution context: {str(e)}")
                raise e
            try:
                params_copy = {k: v for k, v in params.items() if k != "subset_record_ids"}
                print(f"Executing tool: {tool_name} with params: {params_copy} and length of subset_record_ids: {len(params.get('subset_record_ids', [])) if 'subset_record_ids' in params else 0}")

                result: ToolResult = await tool_manager.execute_tool(tool_name, exec_ctx)
                if result.success and result.data:
                    data = result.data
                    candidates_list = []
                    if isinstance(data, dict):
                        candidates_list = data.get("results") or data.get("response") or data.get("data") or []
                        print(f"Tool '{tool_name}' executed with top-10 result: {candidates_list[:10]}")
                    elif isinstance(data, list):
                        candidates_list = data
                    else:
                        candidates_list = []

                    for item in candidates_list:
                        if isinstance(item, dict):
                            rid = item.get("record_id") or item.get("id") or item.get("recordId")
                            score = item.get("score") or item.get("distance") or item.get("similarity") or 1.0
                            try:
                                candidates.append(Candidate(record_id=int(rid), score=float(score), source=f"tool:{tool_name}", metadata=item))
                            except Exception:
                                continue
                else:
                    # Tool executed but returned no data or failed -> fallback to adapter
                    step = StepQuery(action_type=tool_name, params=params, n_results=params.get("top_k"), step_id=action.get("id"))
                    candidates, ctx = await run_step_via_main(step, ctx)
            except Exception:
                # If tool execution raises, fallback to adapter
                step = StepQuery(action_type=tool_name, params=params, n_results=params.get("top_k"), step_id=action.get("id"))
                candidates, ctx = await run_step_via_main(step, ctx)

        else:
            # Not a registered tool: fall back to previous Milvus/HTTP logic
            # common params
            dataset = params.get("dataset") or ctx.global_constraints.get("dataset") or "lsc24"
            model = params.get("model") or ctx.global_constraints.get("model") or "clips"
        

        # store candidates in context keyed by step id
        if action.get("id"):
            ctx.candidates_by_step[action.get("id")] = candidates

        # Serialize candidate lists for response
        serialized = [c.model_dump() for c in candidates]
        results.append({"action_id": action.get("id"), "tool": tool_name, "candidates": serialized})

        # Perform incremental merge up to this step so subsequent steps can use subset_record_ids
        print()
        new_merged = incremental_merge(prev_merged, candidates, action, top_k=plan_data.get("top_k") or 500)
        prev_merged = new_merged
        print()

        # Mark this action as processed (ensure we use the dict form expected by incremental_merge)
        processed_actions.append(action if isinstance(action, dict) else action.model_dump())

        # Optionally propagate subset_record_ids to remaining steps when their merge strategy is rerank or filter
        merged_ids = [int(c.record_id) for c in new_merged]
        # Find upcoming actions and inject subset_record_ids when they request rerank/filter
        for upcoming in plan_data.get("actions", []):
            # only consider future steps (not processed yet)
            if upcoming in processed_actions:
                continue
            up_params = upcoming.get("parameters", {}) or {}
            merge_cfg = (up_params.get("merge") or {})
            if merge_cfg.get("strategy", "").lower() in ("rerank", "filter"):
                up_params["subset_record_ids"] = merged_ids
                upcoming["parameters"] = up_params

    # After the loop, final merged list is the last new_merged (or empty)
    merged = new_merged if 'new_merged' in locals() else []
    merged_serialized = [m.model_dump() for m in merged]

    # Update plan store
    PLAN_STORE[plan_id]["status"] = "completed"
    PLAN_STORE[plan_id]["results"] = results
    PLAN_STORE[plan_id]["merged"] = merged_serialized

    return JSONResponse(
        content={
            "plan_id": plan_id,
            "session_id": payload.session_id,
            "status": "completed",
            # "results": results,
            "results": merged_serialized,
            "message": "Plan execution completed"
        },
        headers={'Access-Control-Allow-Origin': '*'}
    )



@router.post("/create_and_execute")
async def create_and_execute(payload: AgentPlanRequest):
    """Create a plan for the provided goal and execute it immediately, returning aggregated results."""
    try:
        print(f"Payload: {payload}")
        print()
        plan = await agent_core.create_plan(goal=payload.goal, session_id=payload.session_id, constraints=payload.constraints)

        # create a dummy plan for testing
        # "Create and execute failed: 1 validation error for AgentPlan\ncreated_at\n  Input should be a valid datetime [type=datetime_type, input_value=None, input_type=NoneType]\n 


        if not plan.actions:
            print("Plan actions is empty or None, creating default plan for testing.")
            plan = AgentPlan(
                id="plan-123",
                goal=payload.goal,
                status="pending",
                created_at=datetime.datetime.now(),
                actions=[]
            )

            plan.actions = [
                {
                    "id": "step-1",
                    "tool": "text_semantic",
                    "parameters": {
                        "query": "picture of me taking a photo",
                        "top_k": 50,
                        "dataset": "lsc24",
                        "merge": {"strategy": "search", "weight": 0.7}
                    },
                    "status": "pending"
                },
                {
                    "id": "step-2",
                    "tool": "text_semantic",
                    "parameters": {
                        "query": "taking a photo",
                        "top_k": 50,
                        "dataset": "lsc24",
                        "merge": {"strategy": "rerank", "weight": 0.7}
                    },
                    "status": "pending"
                },
                {
                    "id": "step-3",
                    "tool": "activity",
                    "parameters": {
                        "query": "taking a photo",
                        "top_k": 50,
                        "dataset": "lsc24",
                        "merge": {"strategy": "filter", "threshold": 0.}
                    },
                    "status": "pending"
                }
            ]

        else:
            print("Plan actions found from LLM planning.")
            pprint(plan.model_dump())
            print()

        # Store plan
        PLAN_STORE[plan.id] = {
            "plan_id": plan.id,
            "session_id": payload.session_id,
            "goal": plan.goal,
            "status": "executing",
            "actions": [a if isinstance(a, dict) else a.model_dump() for a in plan.actions],
            "created_at": plan.created_at.isoformat()
        }

        # Best-effort: persist the plan into the agent's MemorySaver so it
        # becomes part of the conversation history and can be retrieved later.
        try:
            agent_core.save_plan(payload.session_id, PLAN_STORE[plan.id])
        except Exception:
            # don't fail the request if memory saving isn't available
            pass

        # Also log the plan to disk (best-effort)
        try:
            log_interaction(payload.session_id, role="plan", content=json.dumps(PLAN_STORE[plan.id]), metadata={"plan_id": plan.id}, agent_core=agent_core)
        except Exception:
            pass

        # Execute immediately by calling execute_plan helper
        exec_payload = ExecutePlanRequest(plan_id=plan.id, session_id=payload.session_id)
        execute_response = await execute_plan(plan_id=plan.id, payload=exec_payload)

        # If execution returned a status or updated actions, reflect that in
        # the in-memory store and the memory checkpointer (best-effort).
        try:
            if isinstance(execute_response, dict):
                new_status = execute_response.get("status") or execute_response.get("state")
                if new_status:
                    PLAN_STORE[plan.id]["status"] = new_status
                # attach execution result
                PLAN_STORE[plan.id]["last_execution"] = execute_response
                agent_core.save_plan(payload.session_id, PLAN_STORE[plan.id])
        except Exception:
            pass

        return execute_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Create and execute failed: {str(e)}")

@router.post("/plan/{plan_id}/cancel")
async def cancel_plan(plan_id: str):
    """Cancel an executing plan"""
    # TODO: Implement plan cancellation
    return JSONResponse(
        content={
            "plan_id": plan_id,
            "status": "cancelled",
            "message": "Plan execution cancelled"
        },
        headers={'Access-Control-Allow-Origin': '*'}
    )