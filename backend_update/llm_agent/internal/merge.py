from typing import List, Dict, Any, Optional
from .tools_adapter import Candidate
import numpy as np


def merge_candidates(sources: Dict[str, List[Candidate]], top_k: int = 500, dedupe_by: str = "unifying_category_id") -> List[Candidate]:
    """Union + dedupe + combine scores across sources.
    sources: mapping from source name to a list of Candidate
    """
    all_candidates: List[Candidate] = []
    for src, clist in sources.items():
        # limit per-source to top_k
        all_candidates.extend(clist[:top_k])

    if not all_candidates:
        return []

    # If dedupe by unifying_category_id is preferred, use it when available
    grouped = {}
    for c in all_candidates:
        key = c.unifying_category_id if c.unifying_category_id is not None else c.record_id
        entry = grouped.get(key)
        if not entry:
            grouped[key] = {"candidate": c, "scores": [c.score]}
        else:
            entry["scores"].append(c.score)

    # Combine scores (mean) and produce final list
    merged: List[Candidate] = []
    for key, v in grouped.items():
        candidate = v["candidate"]
        scores = v["scores"]
        combined = float(np.mean(scores))
        merged.append(Candidate(record_id=candidate.record_id, score=combined, source="merged", metadata=candidate.metadata, unifying_category_id=candidate.unifying_category_id))

    # sort
    merged.sort(key=lambda x: x.score, reverse=True)

    return merged[:top_k]


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
