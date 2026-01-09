import time
from tools.manager import ToolManager, ToolExecutionContext
from agent.types import ChatState
from agent.fusion import Fusion
from typing import Any, Dict
from pathlib import Path
from datetime import datetime
import json
from pprint import pprint
from internal.postprocess import prepare_response


def save_dict_as_timestamped_json(
    data: Dict[str, Any],
    out_dir: str | Path = ".",
    prefix: str = "data",
    ensure_ascii: bool = False,
) -> Path:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # e.g. 20260105_143012_123456 (YYYYMMDD_HHMMSS_microseconds)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    out_path = out_dir / f"{prefix}_{ts}.json"

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=ensure_ascii)

    return out_path



def _score_of(item: Dict[str, Any]) -> float:
    return float(item.get("distance", 0.0)) or float(item.get("score", 0.0))

def _merged_score_of(item: Dict[str, Any]) -> float:
    return float(item.get("merged_score", 0.0))

def _id_of(item: Dict[str, Any]) -> int:
    return int(item.get("record_id", 0))


def slim(items, keep_meta=False):
    # Optional: reduce memory usage
    if keep_meta:
        return items
    out = []
    for r in items:
        out.append({
            "item_id": r.get("item_id") or r.get("doc_id"),
            "score": r.get("score", r.get("raw_score", 0.0)),
        })
    return out


async def execute_node(state: ChatState, tool_manager: ToolManager) -> ChatState:
    plan = state.get("active_plan")
    if not plan:
        state["reply"] = "No active plan to execute. Send a query first."
        state["messages"].append({"role": "assistant", "content": state["reply"]})
        return state

        
    # Ensure artifacts container exists
    state.setdefault("artifacts", {})
    state["artifacts"].setdefault("calls", [])                  # <-- audit trail per call
    state["artifacts"].setdefault("call_results", {})
    state["artifacts"].setdefault("merged_results", {})
    state["artifacts"].setdefault("audit", {})                  # <-- run-level audit
    pprint(state["artifacts"])

    fusion_cfg = plan.get("fusion", {"method": "rrf", "rrf_c": 60.0})    
    fusion = Fusion.from_plan_fusion(fusion_cfg)
    top_k_display = int(plan.get("top_k_display", 10))
    print(f"Executing plan with fusion method: {fusion_cfg}")

    state["plan_status"] = "executing"
    started_ms = int(time.time() * 1000)

    goal_query = plan.get("goal", "")
    calls = plan.get("calls", [])

    for idx, call in enumerate(calls, start=1):
        t0 = time.time()

        tool_name = call["tool"]
        op = call["operation"]
        query = call.get("query", goal_query)
        params = call.get("params", {})

        # Paper constraint: rerank/filter cannot be first
        if idx == 1 and op in ("rerank", "filter"):
            state["plan_status"] = "draft"
            state["reply"] = f"Invalid plan: first call cannot be '{op}'."
            state["messages"].append({"role": "assistant", "content": state["reply"]})
            return state

        # Always read combined from state artifacts (no local variable)
        last_merged_results = state["artifacts"]["merged_results"][idx - 1] if idx > 1 else []

        # Pass combined into ctx.candidates for rerank/filter
        candidates = last_merged_results if op in ("rerank", "filter") else None
        ctx = ToolExecutionContext(
            operation=op,
            query=query,
            params=params,
            candidates=candidates,
            state=state,
        )

        res = await tool_manager.execute_tool(tool_name, ctx)
        elapsed_ms = int((time.time() - t0) * 1000)

        if not res.success:
            state["plan_status"] = "draft"
            state["reply"] = f"Call failed: tool={tool_name} op={op}\nError: {res.error}"
            state["messages"].append({"role": "assistant", "content": state["reply"]})
            return state

        last_call_results = res.items

        # Store newest output under its artifact key
        state["artifacts"]["call_results"][idx] = last_call_results

        # Update merged *in state only*
        if op == "search":
            if idx == 1:
                last_merged_results = fusion.merge([], last_call_results, params=call.get("params", {}))
            else:
                last_merged_results = fusion.merge(last_merged_results, last_call_results, params=call.get("params", {}))
        elif op == "rerank":
            last_merged_results = fusion.merge(last_merged_results, last_call_results, params=call.get("params", {}))
        elif op == "filter":
            last_merged_results = fusion.filter(last_merged_results, last_call_results, constraint=params.get("constraint", {}))
        else:
            state["plan_status"] = "draft"
            state["reply"] = f"Unknown operation: {op}"
            state["messages"].append({"role": "assistant", "content": state["reply"]})
            return state

        state["artifacts"]["merged_results"][idx] = last_merged_results
        
        # Append audit record
        state["artifacts"]["calls"].append({
            "idx": idx,
            "tool": tool_name,
            "operation": op,
            "query": query,
            "params": params,
            "stats": {
                "elapsed_ms": elapsed_ms,
                "last_call_results_n": len(last_call_results),
                "last_merged_results_n": len(last_merged_results) if last_merged_results else 0,
                "fusion": fusion_cfg,
            },
            # Store slim versions by default (avoid huge state); switch keep_meta=True for debugging
            "last_call_results": slim(last_call_results, keep_meta=False),
            "last_merged_results": slim(last_merged_results, keep_meta=False) if last_merged_results else [],
        })

    ended_ms = int(time.time() * 1000)
    state["artifacts"]["audit"] = {
        "started_at_ms": started_ms,
        "ended_at_ms": ended_ms,
        "total_elapsed_seconds": (ended_ms - started_ms) / 1000.0,
        "fusion": fusion_cfg,
    }

    # Final results: prefer explicit top_results artifact; else top_k from merged_results
    merged_final = state["artifacts"]["merged_results"]
    raw_results = state["artifacts"]["merged_results"][len(calls)] if len(calls) in merged_final else []
    state["plan_status"] = "done"

    # Extract dataset and model from the first call's params or use defaults
    first_call_params = plan.get("calls", [{}])[0].get("params", {})
    dataset = first_call_params.get("dataset", "lsc24")
    model = first_call_params.get("model", "default")
    display_window_size = int(plan.get("display_window_size", 3))
    
    # Prepare formatted response with metadata
    if raw_results:
        record_ids = [_id_of(r) for r in raw_results[:top_k_display]]
        scores = [_merged_score_of(r) for r in raw_results[:top_k_display]]
        
        # Call prepare_response to get full metadata
        state["last_results"] = await prepare_response(
            dataset=dataset,
            model=model,
            record_ids=record_ids,
            scores=scores,
            display_window_size=display_window_size,
            top_k=top_k_display
        )
    else:
        state["last_results"] = []

    # Render output
    results = state["last_results"]
    if not results:
        reply = "No results."
    else:
        lines = ["Top results:"]
        for i, r in enumerate(results[:10], start=1):
            record_id = r.get("record_id", _id_of(r))
            score = r.get("score", _merged_score_of(r))
            lines.append(f"{i}. {record_id}  score={float(score):.8f}")
        reply = "\n".join(lines)

    state["reply"] = reply
    state.setdefault("messages", []).append({"role": "assistant", "content": reply})
    path = save_dict_as_timestamped_json(state["artifacts"], prefix="result")

    return state