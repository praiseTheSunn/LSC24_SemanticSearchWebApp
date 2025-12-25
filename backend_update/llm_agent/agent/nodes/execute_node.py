import time
from tools.manager import ToolManager, ToolExecutionContext
from agent.types import ChatState
from agent.fusion import Fusion
from typing import Any, List, Dict


def _score_of(item: Dict[str, Any]) -> float:
    return float(item.get("distance"), 0.0)

def _id_of(item: Dict[str, Any]) -> int:
    return int(item.get("record_id"), 0)


def operation_search(prev_combined: List[Dict[str, Any]],
               newest: List[Dict[str, Any]],
               fusion_cfg: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Search op:
    - queries whole DB -> returns newest
    - combine newest with prev_combined using CombSUM/CombMNZ/RRF
    """
    method = fusion_cfg.get("method", "rrf")

    # TODO: implement properly; placeholder = concat + keep best score per id
    best: Dict[str, Dict[str, Any]] = {}
    for it in prev_combined + newest:
        k = _id_of(it)
        if not k:
            continue
        if k not in best or _score_of(it) > _score_of(best[k]):
            best[k] = it
    merged = list(best.values())
    merged.sort(key=_score_of, reverse=True)
    return merged


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
    state["artifacts"].setdefault("combined", [])      # <-- single source of truth
    state["artifacts"].setdefault("calls", [])         # <-- audit trail per call
    state["artifacts"].setdefault("audit", {})         # <-- run-level audit

    fusion_cfg = plan.get("fusion", {"method": "rrf", "rrf_c": 60.0})    
    fusion = Fusion.from_params(fusion_cfg)
    top_k_display = int(plan.get("top_k_display", 10))

    state["plan_status"] = "executing"
    started_ms = int(time.time() * 1000)

    goal_query = plan.get("goal", "")
    calls = plan.get("calls", [])

    for idx, call in enumerate(calls, start=1):
        t0 = time.time()

        tool_name = call["tool"]
        op = call["operation"]
        query = call.get("query", goal_query)
        params = call.get("params", {}) or {}
        save_as = call.get("save_as") or f"call_{idx}"

        # Paper constraint: rerank/filter cannot be first
        if idx == 1 and op in ("rerank", "filter"):
            state["plan_status"] = "draft"
            state["reply"] = f"Invalid plan: first call cannot be '{op}'."
            state["messages"].append({"role": "assistant", "content": state["reply"]})
            return state

        # Always read combined from state artifacts (no local variable)
        combined_before = state["artifacts"]["combined"]

        # Pass combined into ctx.candidates for rerank/filter
        candidates = combined_before if op in ("rerank", "filter") else None

        # Multi-input convention if you still use it: params["inputs"] -> params["lists"]
        # (optional; you can also switch plan schema to have call["inputs"])
        if "inputs" in params:
            input_lists = [state["artifacts"].get(k, []) for k in params["inputs"]]
            params = dict(params)
            params["lists"] = input_lists

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

        newest = res.items

        # Store newest output under its artifact key
        state["artifacts"][save_as] = newest

        # Update combined *in state only*
        if op == "search":
            combined_after = newest if idx == 1 else fusion.merge(combined_before, newest)
        elif op == "rerank":
            combined_after = fusion.merge(combined_before, newest)
        elif op == "filter":
            combined_after = fusion.filter(combined_before, newest, constraint=params.get("constraint", {}))
        else:
            state["plan_status"] = "draft"
            state["reply"] = f"Unknown operation: {op}"
            state["messages"].append({"role": "assistant", "content": state["reply"]})
            return state

        state["artifacts"]["combined"] = combined_after
        
        # Append audit record
        state["artifacts"]["calls"].append({
            "idx": idx,
            "tool": tool_name,
            "operation": op,
            "query": query,
            "params": params,
            "save_as": save_as,
            "stats": {
                "elapsed_ms": elapsed_ms,
                "newest_n": len(newest),
                "combined_before_n": len(combined_before) if combined_before else 0,
                "combined_after_n": len(combined_after),
                "fusion": fusion_cfg,
            },
            # Store slim versions by default (avoid huge state); switch keep_meta=True for debugging
            "newest": slim(newest, keep_meta=False),
            "combined_before": slim(combined_before, keep_meta=False) if combined_before else [],
            "combined_after": slim(combined_after, keep_meta=False),
        })

    ended_ms = int(time.time() * 1000)
    state["artifacts"]["audit"] = {
        "started_at_ms": started_ms,
        "ended_at_ms": ended_ms,
        "total_elapsed_ms": ended_ms - started_ms,
        "fusion": fusion_cfg,
    }

    # Final results: prefer explicit top_results artifact; else top_k from combined
    combined_final = state["artifacts"]["combined"]
    state["last_results"] = state["artifacts"].get("top_results") or combined_final[:top_k_display]
    state["plan_status"] = "done"

    # Render output
    results = state["last_results"]
    if not results:
        reply = "No results."
    else:
        lines = ["Top results:"]
        for i, r in enumerate(results, start=1):
            doc_id = r.get("doc_id") or r.get("item_id")
            score = r.get("score", r.get("raw_score", 0.0))
            lines.append(f"{i}. {doc_id}  score={float(score):.4f}")
        reply = "\n".join(lines)

    state["reply"] = reply
    state.setdefault("messages", []).append({"role": "assistant", "content": reply})
    return state