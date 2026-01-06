from __future__ import annotations

import math
import random
import re
import time
import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional, Tuple, TypedDict

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain.tools import tool
from agent.types import ChatState


# =========================================================
# 1) Paper-aligned component registry + plan representation
#    - Registry fields: tool_id, score_range, calibration, defaults, latency_cost
#    - Operations: Search / Rerank / Filter
# =========================================================

Operation = Literal["search", "rerank", "filter"]
FusionRule = Literal["combsum", "combmnz", "rrf"]

@dataclass(frozen=True)
class ComponentSpec:
    tool_id: str
    operations: Tuple[Operation, ...]
    index_type: Literal["dense", "keyword"]
    score_range: Tuple[float, float]
    calibration: Optional[Literal["logistic"]] = None
    default_topk: int = 300
    default_weight: float = 0.6
    latency_cost: float = 1.0  # arbitrary units; you can map to ms later


# Minimal registry (you’ll add real components later)
REGISTRY: Dict[str, ComponentSpec] = {
    "text_semantic.milvus:v1": ComponentSpec(
        tool_id="text_semantic.milvus:v1",
        operations=("search", "rerank"),
        index_type="dense",
        score_range=(0.0, 1.0),
        calibration=None,
        default_topk=300,
        default_weight=0.7,
        latency_cost=2.5,
    ),
    "ocr.es:v1": ComponentSpec(
        tool_id="ocr.es:v1",
        operations=("search", "rerank", "filter"),
        index_type="keyword",
        score_range=(0.0, 100.0),
        calibration="logistic",
        default_topk=300,
        default_weight=0.6,
        latency_cost=1.2,
    ),
    "object.es:v1": ComponentSpec(
        tool_id="object.es:v1",
        operations=("search", "rerank", "filter"),
        index_type="keyword",
        score_range=(0.0, 100.0),
        calibration="logistic",
        default_topk=300,
        default_weight=0.6,
        latency_cost=1.2,
    ),
}

# Segment dedupe config (paper mentions (video_id, floor(time/delta)))
SEGMENT_DELTA_SECONDS = 1.0


class PlanStep(TypedDict, total=False):
    tool_id: str
    operation: Operation
    query: str
    top_k: int
    weight: float
    params: Dict[str, Any]        # thresholds, fields, etc.


class Plan(TypedDict, total=False):
    plan_id: str
    created_at_ms: int
    goal: str
    fusion_rule: FusionRule
    rrf_c: float
    budget: Dict[str, Any]        # {"max_steps": int, "max_cost": float}
    early_stop: Dict[str, Any]    # {"enabled": bool, "K": int, "eps": float}
    steps: List[PlanStep]
    rationale: str


# =========================================================
# 2) Session state (stores plan, artifacts, audit trail)
# =========================================================


# =========================================================
# 3) Intent routing (same UX: draft -> approve -> execute)
# =========================================================


# =========================================================
# 4) Planner/editor stubs (paper: plan uses registry + weights + fusion + topk)
# =========================================================


# =========================================================
# 5) Tool stubs (you will implement Milvus + ES later)
#    Unified output: List[{"item_id", "raw_score", "meta", "source"}]
# =========================================================

@tool
def milvus_search(query: str, top_k: int = 300) -> List[Dict[str, Any]]:
    """Placeholder semantic search in Milvus."""
    # Return a random list of 10 items as example
    return [{"item_id": f"milvus_{i}", "raw_score": random.uniform(0, 1), "meta": {}, "source": "milvus"} for i in range(10)]

@tool
def milvus_rerank(query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Placeholder rerank in Milvus (re-score candidates)."""
    return []

@tool
def es_search(query: str, top_k: int = 300, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Placeholder keyword/attribute search in Elasticsearch (OCR/activity/color/object)."""
    return []

@tool
def es_rerank(query: str, candidates: List[Dict[str, Any]], params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Placeholder rerank in Elasticsearch."""
    return []

@tool
def es_filter(query: str, candidates: List[Dict[str, Any]], params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Placeholder filter in Elasticsearch (returns subset)."""
    return candidates


# =========================================================
# 6) Normalization + incremental fusion (paper logic)
#    - calibration (logistic) OR min-max
#    - CombSUM / CombMNZ / RRF
#    - dedupe by segment key
#    - per-source contribution vector
# =========================================================

def logistic_calibrate(x: float) -> float:
    # generic logistic; you can calibrate with parameters later
    return 1.0 / (1.0 + math.exp(-x))

def minmax_normalize(scores: List[float], eps: float = 1e-9) -> List[float]:
    if not scores:
        return []
    mn, mx = min(scores), max(scores)
    if abs(mx - mn) < eps:
        return [0.0 for _ in scores]
    return [(s - mn) / (mx - mn + eps) for s in scores]

def segment_key(meta: Dict[str, Any], delta: float = SEGMENT_DELTA_SECONDS) -> Optional[Tuple[Any, int]]:
    vid = meta.get("video_id")
    t = meta.get("time")
    if vid is None or t is None:
        return None
    return (vid, int(float(t) // delta))

def dedupe_by_segment(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    out = []
    for it in items:
        key = segment_key(it.get("meta", {}))
        if key is None:
            # if unknown segment, fall back to item_id dedupe
            key = ("_item", it.get("item_id"))
        if key in seen:
            continue
        seen.add(key)
        out.append(it)
    return out

def compute_jaccard(a: List[str], b: List[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 1.0
    return len(sa & sb) / max(1, len(sa | sb))

def ndcg_similarity(prev_ids: List[str], curr_ids: List[str]) -> float:
    """
    Order stability proxy: treat previous ranking as “ideal” relevance.
    Gives 1.0 if curr matches prev ordering perfectly, lower otherwise.
    """
    rel = {doc_id: 1.0 / math.log2(i + 2) for i, doc_id in enumerate(prev_ids)}  # higher for earlier
    def dcg(ids: List[str]) -> float:
        s = 0.0
        for i, doc_id in enumerate(ids):
            gain = rel.get(doc_id, 0.0)
            s += gain / math.log2(i + 2)
        return s
    ideal = dcg(prev_ids)
    if ideal <= 1e-9:
        return 1.0
    return dcg(curr_ids) / ideal

def incremental_fuse(
    fusion_rule: FusionRule,
    rrf_c: float,
    aggregated: Dict[str, float],
    nz_count: Dict[str, int],
    source_contrib: Dict[str, Dict[str, float]],
    tool_id: str,
    weight: float,
    normalized_list: List[Dict[str, Any]],
) -> None:
    if fusion_rule in ("combsum", "combmnz"):
        for it in normalized_list:
            doc_id = it["item_id"]
            s = float(it.get("norm_score", 0.0))
            if s > 0:
                nz_count[doc_id] = nz_count.get(doc_id, 0) + 1
            aggregated[doc_id] = aggregated.get(doc_id, 0.0) + weight * s
            source_contrib.setdefault(doc_id, {}).setdefault(tool_id, 0.0)
            source_contrib[doc_id][tool_id] += weight * s

        if fusion_rule == "combmnz":
            # Apply MNZ multiplier after update: A(i) = count_nonzero * sum(weighted_scores)
            for doc_id in list(aggregated.keys()):
                aggregated[doc_id] = aggregated[doc_id] * nz_count.get(doc_id, 0)

    elif fusion_rule == "rrf":
        # RRF uses ranks
        ranked = sorted(normalized_list, key=lambda x: float(x.get("norm_score", 0.0)), reverse=True)
        for rank, it in enumerate(ranked, start=1):
            doc_id = it["item_id"]
            contrib = weight / (rrf_c + rank)
            aggregated[doc_id] = aggregated.get(doc_id, 0.0) + contrib
            source_contrib.setdefault(doc_id, {}).setdefault(tool_id, 0.0)
            source_contrib[doc_id][tool_id] += contrib
    else:
        raise ValueError(f"Unknown fusion rule: {fusion_rule}")


# =========================================================
# 7) Execution loop (budget + early stopping + audit trail)
# =========================================================

def execute_plan(plan: Plan, state: ChatState) -> List[Dict[str, Any]]:
    fusion_rule: FusionRule = plan.get("fusion_rule", "rrf")  # type: ignore
    rrf_c = float(plan.get("rrf_c", 60.0))
    budget = plan.get("budget", {"max_steps": 6, "max_cost": 10.0})
    early = plan.get("early_stop", {"enabled": True, "K": 10, "eps": 0.02})
    K = int(early.get("K", 10))
    eps = float(early.get("eps", 0.02))
    early_enabled = bool(early.get("enabled", True))

    aggregated: Dict[str, float] = {}
    nz_count: Dict[str, int] = {}
    source_contrib: Dict[str, Dict[str, float]] = {}

    artifacts: Dict[str, Any] = {}
    audit = {
        "plan_id": plan.get("plan_id"),
        "fusion_rule": fusion_rule,
        "rrf_c": rrf_c,
        "steps": [],
        "stopped_early": False,
        "stop_reason": None,
        "total_cost": 0.0,
    }

    prev_top_ids: Optional[List[str]] = None
    total_cost = 0.0

    # Current “working set” (for rerank/filter)
    current_items: List[Dict[str, Any]] = []

    for t, step in enumerate(plan.get("steps", [])[: int(budget.get("max_steps", 6))], start=1):
        tool_id = step["tool_id"]
        op: Operation = step["operation"]
        query = step.get("query", plan.get("goal", ""))
        top_k = int(step.get("top_k", REGISTRY[tool_id].default_topk))
        weight = float(step.get("weight", REGISTRY[tool_id].default_weight))
        params = step.get("params", {}) or {}

        spec = REGISTRY[tool_id]
        if op not in spec.operations:
            raise ValueError(f"{tool_id} does not support operation '{op}'")

        # Budget cost accounting
        total_cost += float(spec.latency_cost)
        if total_cost > float(budget.get("max_cost", 10.0)):
            audit["stopped_early"] = True
            audit["stop_reason"] = "budget_exceeded"
            break

        t0 = time.time()

        # ---- Execute component operation ----
        if op == "search":
            if tool_id.startswith("text_semantic.milvus"):
                raw = milvus_search.invoke({"query": query, "top_k": top_k})
            else:
                raw = es_search.invoke({"query": query, "top_k": top_k, "params": params})
            current_items = raw  # working set becomes this candidate list

        elif op == "rerank":
            if tool_id.startswith("text_semantic.milvus"):
                raw = milvus_rerank.invoke({"query": query, "candidates": current_items})
            else:
                raw = es_rerank.invoke({"query": query, "candidates": current_items, "params": params})
            current_items = raw

        elif op == "filter":
            if tool_id.startswith("ocr_object_color_activity.es"):
                raw = es_filter.invoke({"query": query, "candidates": current_items, "params": params})
            else:
                raw = current_items
            current_items = raw

        else:
            raise ValueError(f"Unknown operation: {op}")

        # Ensure standard fields & dedupe by segment
        # Expect each item: {"item_id": str, "raw_score": float, "meta": {...}, "source": tool_id}
        standardized = []
        for it in current_items:
            if "item_id" not in it:
                continue
            it = dict(it)
            it.setdefault("source", tool_id)
            it.setdefault("meta", {})
            it.setdefault("raw_score", float(it.get("score", it.get("raw_score", 0.0))))
            standardized.append(it)

        standardized = dedupe_by_segment(standardized)

        # ---- Normalize scores ----
        raw_scores = [float(x.get("raw_score", 0.0)) for x in standardized]
        if spec.calibration == "logistic":
            norm_scores = [logistic_calibrate(s) for s in raw_scores]
        else:
            norm_scores = minmax_normalize(raw_scores)

        normalized_list = []
        for it, ns in zip(standardized, norm_scores):
            it2 = dict(it)
            it2["norm_score"] = float(ns)
            normalized_list.append(it2)

        # ---- Fuse incrementally (Search/Rerank contribute; Filter just prunes) ----
        if op in ("search", "rerank"):
            incremental_fuse(
                fusion_rule=fusion_rule,
                rrf_c=rrf_c,
                aggregated=aggregated,
                nz_count=nz_count,
                source_contrib=source_contrib,
                tool_id=tool_id,
                weight=weight,
                normalized_list=normalized_list,
            )
        elif op == "filter":
            # prune aggregated scores to the filtered working set
            keep = {it["item_id"] for it in normalized_list}
            aggregated = {k: v for k, v in aggregated.items() if k in keep}
            nz_count = {k: v for k, v in nz_count.items() if k in keep}
            source_contrib = {k: v for k, v in source_contrib.items() if k in keep}

        # ---- Produce current ranking ----
        ranked_ids = sorted(aggregated.keys(), key=lambda k: aggregated[k], reverse=True)
        top_ids = ranked_ids[:K]

        # ---- Early stopping (paper: Jaccard + ΔNDCG@K) ----
        if early_enabled and prev_top_ids is not None:
            jacc = compute_jaccard(prev_top_ids, top_ids)
            ndcg_sim = ndcg_similarity(prev_top_ids, top_ids)
            delta_ndcg = 1.0 - ndcg_sim

            if jacc >= (1.0 - eps) and delta_ndcg <= eps:
                audit["stopped_early"] = True
                audit["stop_reason"] = {"jaccard": jacc, "delta_ndcg": delta_ndcg}
                break

        prev_top_ids = top_ids

        elapsed = time.time() - t0
        audit["steps"].append({
            "t": t,
            "tool_id": tool_id,
            "operation": op,
            "weight": weight,
            "top_k": top_k,
            "latency_cost": spec.latency_cost,
            "elapsed_sec": elapsed,
        })

    audit["total_cost"] = total_cost

    # Final top-K with per-source contributions (paper: source_contrib vector)
    final_ids = sorted(aggregated.keys(), key=lambda k: aggregated[k], reverse=True)[:K]
    final_results = []
    for doc_id in final_ids:
        final_results.append({
            "item_id": doc_id,
            "score": aggregated[doc_id],
            "source_contrib": source_contrib.get(doc_id, {}),
        })

    state["artifacts"] = artifacts
    return final_results


# =========================================================
# 8) Graph nodes (chatbot wrapper around planner/executor)
# =========================================================


# =========================================================
# 9) Build graph + minimal CLI
# =========================================================
