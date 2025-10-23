import datetime
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from schemas import AgentPlanRequest, ExecutePlanRequest, PlanStatusResponse, AgentPlan
from internal.agent_core import LangChainAgentCore
from typing import Dict, Any
from internal.tools_adapter import StepQuery, ExecutionContext, Candidate, run_step_via_main
from internal.merge import merge_candidates, apply_filters, rerank_candidates
import asyncio

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
from tools import ToolManager
from schemas import ToolExecutionContext, ToolResult

tool_manager = ToolManager()

router = APIRouter(
    prefix="/planning",
    tags=["planning"],
)

# Initialize agent core
agent_core = LangChainAgentCore()
# Simple in-memory plan store (for demo/prototyping). Replace with Redis or DB for production.
PLAN_STORE: Dict[str, Dict[str, Any]] = {}

@router.post("/create_plan")
async def create_execution_plan(payload: AgentPlanRequest):
    """Create an execution plan for a user goal using LLM"""
    try:
        # Use LangChain agent to create intelligent plan
        plan = await agent_core.create_plan(
            goal=payload.goal,
            session_id=payload.session_id,
            constraints=payload.constraints
        )
        
        return JSONResponse(
            content={
                "plan": {
                    "plan_id": plan.id,
                    "session_id": payload.session_id,
                    "goal": plan.goal,
                    "status": plan.status.value,
                    "created_at": plan.created_at.isoformat(),
                    "actions": [action.model_dump() for action in plan.actions],
                    "estimated_steps": len(plan.actions)
                },
                "message": "Execution plan created successfully using LLM"
            },
            headers={'Access-Control-Allow-Origin': '*'}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Plan creation failed: {str(e)}"
        )

@router.get("/plan/{plan_id}/status")
async def get_plan_status(plan_id: str):
    """Get the status of an execution plan"""
    # TODO: Retrieve from memory/storage
    return JSONResponse(
        content={
            "plan_id": plan_id,
            "status": "pending",
            "current_step": 0,
            "total_steps": 3,
            "progress_percentage": 0.0,
            "actions": []
        },
        headers={'Access-Control-Allow-Origin': '*'}
    )

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

    for action in plan_data.get("actions", []):
        tool_name = action.get("tool")
        params = action.get("parameters", {}) or {}

        # Prefer executing the registered Tool class via ToolManager
        candidates: list[Candidate] = []
        tool = tool_manager.get_tool(tool_name)
        if tool:
            # build execution context
            exec_ctx = ToolExecutionContext(
                tool=tool_name,
                parameters=params,
                session_id=payload.session_id,
                action_id=action.get("id")
            )
            try:
                result: ToolResult = await tool_manager.execute_tool(tool_name, exec_ctx)
                print(f"Tool '{tool_name}' executed with result: {result}")
                if result.success and result.data:
                    data = result.data
                    # data may be {'results': [...]}, or {'response': [...]}, or a list
                    candidates_list = []
                    if isinstance(data, dict):
                        candidates_list = data.get("results") or data.get("response") or data.get("data") or []
                    elif isinstance(data, list):
                        candidates_list = data
                    else:
                        candidates_list = []

                    for item in candidates_list:
                        # try to extract record id and score
                        if isinstance(item, dict):
                            rid = item.get("record_id") or item.get("id") or item.get("recordId")
                            score = item.get("score") or item.get("distance") or item.get("similarity") or 1.0
                            try:
                                candidates.append(Candidate(record_id=int(rid), score=float(score), source=f"tool:{tool_name}", metadata=item))
                            except Exception:
                                # skip malformed entries
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
            top_k = int(params.get("top_k") or params.get("n_results") or ctx.global_constraints.get("top_k") or 500)
            collection_name = f"{dataset}_{model}"

            # OCR shortcut
            if tool_name in ("ocr", "OCR", "ocr_tool") and apply_filter_only is not None:
                ocr_text = params.get("ocr") or params.get("query") or params.get("ocr_text")
                if ocr_text:
                    try:
                        matches = await asyncio.to_thread(apply_filter_only, collection_name, {"ocr": ocr_text}, top_k)
                        for m in matches:
                            rid = m.get("record_id") or m.get("id")
                            candidates.append(Candidate(record_id=int(rid), score=float(m.get("score", 1.0) if m.get("score") is not None else 1.0), source="milvus_ocr", metadata=m))
                    except Exception:
                        step = StepQuery(action_type=tool_name, params=params, n_results=top_k, step_id=action.get("id"))
                        candidates, ctx = await run_step_via_main(step, ctx)
                else:
                    step = StepQuery(action_type=tool_name, params=params, n_results=top_k, step_id=action.get("id"))
                    candidates, ctx = await run_step_via_main(step, ctx)
            else:
                # Default fallback to main HTTP adapter
                step = StepQuery(action_type=tool_name, params=params, n_results=params.get("top_k"), step_id=action.get("id"))
                candidates, ctx = await run_step_via_main(step, ctx)

        # store candidates in context keyed by step id
        if action.get("id"):
            ctx.candidates_by_step[action.get("id")] = candidates

        # Serialize candidate lists for response
        serialized = [c.model_dump() for c in candidates]
        results.append({"action_id": action.get("id"), "tool": tool_name, "candidates": serialized})

    # Merge candidates from all steps
    merged = merge_candidates(ctx.candidates_by_step or {}, top_k=plan_data.get("top_k") or 500)
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
            "results": results,
            "merged": merged_serialized,
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

        # plan = AgentPlan(
        #     id="plan-123",
        #     goal=payload.goal,
        #     status="pending",
        #     created_at=datetime.datetime.now(),
        #     actions=[]
        # )

        # For now, plan.actions may be empty (LLM parsing not implemented). We'll create a simple default plan if empty.
        if not plan.actions:
            # Example: simple retrieval plan
            plan.actions = [
                {
                    "id": "step-1",
                    "tool": "text_semantic",
                    "parameters": {"query": "a man buying a train model in a mall", "top_k": 100, "dataset": "lsc24"},
                    "status": "pending"
                },
                {
                    "id": "step-2",
                    "tool": "ocr",
                    "parameters": {"query": "computer", "top_k": 100, "dataset": "lsc24"},
                    "status": "pending"
                }
            ]

        print(f"Final Plan: {plan}")
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

        # Execute immediately by calling execute_plan helper
        exec_payload = ExecutePlanRequest(plan_id=plan.id, session_id=payload.session_id)
        execute_response = await execute_plan(plan_id=plan.id, payload=exec_payload)

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