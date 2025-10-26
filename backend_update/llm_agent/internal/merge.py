from typing import List, Dict, Any, Optional
from .tools_adapter import Candidate


def incremental_merge(prev_merged_candidates: List[Candidate],
                      step_candidates: List[Candidate],
                      action: Dict[str, Any],
                      top_k: int = 500,
                      dedupe_by: str = "unifying_category_id") -> List[Candidate]:
    """Perform an ordered, incremental merge of candidate lists according to per-step merge strategies.

    action: dict (in execution order). Each action's parameters may include a `merge` dict:
      - strategy: one of 'search', 'rerank', 'filter'
      - weight: float in [0,1] (how much to trust the newly returned list when combining)
      - threshold: float (for 'filter' strategy) ; items below threshold are dropped

    The algorithm walks actions in order and updates a running `merged` list.
    For 'search' and 'rerank' we combine scores as: combined = weight * new_score + (1-weight) * prev_score
    For 'filter' we remove items whose score in the new step is below threshold (when present).
    """
    # Helper: map list of Candidate to dict {record_id: Candidate}
    def list_to_map(clist: List[Candidate]) -> Dict[int, Candidate]:
        m = {}
        for c in clist:
            m[int(c.record_id)] = c
        return m

    # iterate through actions in provided order
    step_id = action.get("id")
    step_params = action.get("parameters", {}) or {}
    merge_cfg = step_params.get("merge", {}) or {}
    strategy = (merge_cfg.get("strategy") or "search").lower()
    weight = float(merge_cfg.get("weight", 0.5))
    threshold = merge_cfg.get("threshold")

    prev_merged_map = list_to_map(prev_merged_candidates)
    step_map = list_to_map(step_candidates)
    print(f"Number of candidates in previous merged: {len(prev_merged_candidates)}")
    print(f"Number of candidates in current step: {len(step_candidates)}")
    new_merged_map: Dict[int, Candidate] = {}

    if not prev_merged_map:
        # first step: initialize new_merged_map depending on filter strategy
        if strategy == "filter" and threshold is not None:
            for rid, c in step_map.items():
                if c.score >= float(threshold):
                    new_merged_map[rid] = c
        else:
            new_merged_map.update(step_map)
        # produce sorted list
        new_merged_list = list(new_merged_map.values())
        new_merged_list.sort(key=lambda x: x.score, reverse=True)
        print(f"Number of candidates after merging and before returning: {len(new_merged_list)}")
        return new_merged_list[:top_k]


    # For subsequent steps, apply strategy
    if strategy in ("search", "rerank"):
        # Combine scores across union of ids
        all_ids = set(prev_merged_map.keys()) | set(step_map.keys())
        for rid in all_ids:
            prev_c = prev_merged_map.get(rid)
            new_c = step_map.get(rid)
            prev_score = float(prev_c.score) if prev_c is not None else 0.0
            new_score = float(new_c.score) if new_c is not None else 0.0
            combined = weight * new_score + (1.0 - weight) * prev_score
            # choose metadata from the new candidate when present, else prev
            meta = (new_c.metadata if new_c is not None and new_c.metadata else (prev_c.metadata if prev_c is not None else {}))
            unifying = (new_c.unifying_category_id if new_c is not None and new_c.unifying_category_id is not None else (prev_c.unifying_category_id if prev_c is not None else None))
            new_merged_map[rid] = Candidate(record_id=rid, score=float(combined), source="merged", metadata=meta, unifying_category_id=unifying)

    elif strategy == "filter":
        # Use the step's scores to remove items below threshold from the currently merged set
        if threshold is None:
            new_merged_map = prev_merged_map
        else:
            th = float(threshold)
            to_keep = {}
            for rid, prev_c in prev_merged_map.items():
                step_c = step_map.get(rid)
                # If the step did not return the id, treat its score as 0 -> drop when below threshold
                step_score = float(step_c.score) if step_c is not None else 0.0
                if step_score >= th:
                    to_keep[rid] = prev_c
            new_merged_map = to_keep

    else:
        # unknown strategy - fallback to union average
        all_ids = set(prev_merged_map.keys()) | set(step_map.keys())
        for rid in all_ids:
            prev_c = prev_merged_map.get(rid)
            new_c = step_map.get(rid)
            prev_score = float(prev_c.score) if prev_c is not None else 0.0
            new_score = float(new_c.score) if new_c is not None else 0.0
            combined = (prev_score + new_score) / 2.0
            meta = (new_c.metadata if new_c is not None and new_c.metadata else (prev_c.metadata if prev_c is not None else {}))
            unifying = (new_c.unifying_category_id if new_c is not None and new_c.unifying_category_id is not None else (prev_c.unifying_category_id if prev_c is not None else None))
            new_merged_map[rid] = Candidate(record_id=rid, score=float(combined), source="merged", metadata=meta, unifying_category_id=unifying)

    # produce sorted list
    new_merged_list = list(new_merged_map.values())
    new_merged_list.sort(key=lambda x: x.score, reverse=True)
    print(f"Number of candidates after merging and before returning: {len(new_merged_list)}")
    return new_merged_list[:top_k]


def apply_filters(candidates: List[Candidate], filters: Dict[str, Any]) -> List[Candidate]:
    """Apply simple filters to the candidate list. Filters could include dataset, date ranges, modality, etc.
    This is a best-effort local filter; for robust filtering prefer main to handle it.
    """
    if not filters:
        return candidates

    out = []
    for c in candidates:
        ok = True
        # Example filter by record_id range
        if "min_record_id" in filters:
            if c.record_id < int(filters["min_record_id"]):
                ok = False
        if "max_record_id" in filters:
            if c.record_id > int(filters["max_record_id"]):
                ok = False
        if ok:
            out.append(c)

    return out


def rerank_candidates(candidates: List[Candidate], reranker: Optional[Any] = None, top_k: int = 100) -> List[Candidate]:
    """Stub for reranking. If a reranker callable is provided, it should accept a list of Candidates and return a reordered list.
    """
    if not candidates:
        return []
    if reranker is None:
        # Nothing to do, just return top_k
        candidates.sort(key=lambda x: x.score, reverse=True)
        return candidates[:top_k]
    else:
        return reranker(candidates)[:top_k]
