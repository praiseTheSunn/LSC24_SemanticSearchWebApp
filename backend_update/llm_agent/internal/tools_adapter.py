from typing import Any, Dict, List, Optional, Tuple
import httpx
import os
from pydantic import BaseModel

# Default main service URL (can be overridden via env)
MAIN_BASE = os.getenv("MAIN_BASE_URL", "http://localhost:8000")
DEFAULT_TOP_K = int(os.getenv("DEFAULT_TOP_K", "500"))


class StepQuery(BaseModel):
    action_type: str
    params: Dict[str, Any] = {}
    n_results: Optional[int] = None
    step_id: Optional[str] = None


class Candidate(BaseModel):
    record_id: int
    score: float
    source: str
    metadata: Dict[str, Any] = {}
    unifying_category_id: Optional[int] = None


class ExecutionContext(BaseModel):
    last_text: Optional[str] = None
    global_constraints: Dict[str, Any] = {}
    candidates_by_step: Dict[str, List[Candidate]] = {}


def _normalize_params(params: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize common param synonyms to canonical names."""
    p = dict(params)
    if "k" in p and "top_k" not in p:
        p["top_k"] = p.pop("k")
    if "n" in p and "top_k" not in p:
        p["top_k"] = p.pop("n")
    if "n_results" in p and "top_k" not in p:
        p["top_k"] = p.pop("n_results")
    if "n_results_returned" in p and "top_k" not in p:
        p["top_k"] = p.pop("n_results_returned")
    return p


def build_querystructured_from_step(step: StepQuery, ctx: ExecutionContext) -> Tuple[Dict[str, Any], ExecutionContext]:
    """
    Build a dict matching `main`'s RequestSearchByTextQuery / QueryStructured shapes.
    Returns (payload, updated_context).
    """
    params = _normalize_params(step.params or {})
    payload: Dict[str, Any] = {}

    # Fill dataset and model from params or global constraints
    dataset = params.get("dataset") or ctx.global_constraints.get("dataset") or "lsc24"
    model = params.get("model") or ctx.global_constraints.get("model") or "default"

    # Text handling: prefer explicit text, otherwise carry forward
    text = params.get("text") or params.get("query") or None
    if not text:
        text = ctx.last_text

    # top_k / n_results
    top_k = params.get("top_k") or step.n_results or ctx.global_constraints.get("n_results_returned") or DEFAULT_TOP_K

    # Filters
    filters = params.get("filters") or ctx.global_constraints.get("filters") or {}

    # If action is search_with_image_query, expect image_base64 or image_url
    if step.action_type in ("search_image", "search_with_image_query"):
        # Map to RequestSearchByImageQuery
        payload = {
            "image_base64": params.get("image_base64") or params.get("image"),
            "dataset": dataset,
            "model": model,
            "display_window_size": params.get("display_window_size", 10),
        }
        # no last_text update
        return payload, ctx

    # Default: map to RequestSearchByTextQuery
    # Build a single text query string that main.parse_raw_query can consume
    text_query = text or ""
    # incorporate filters into the text_query in the same style main expects
    if filters:
        for k, v in filters.items():
            if v is None or v == "":
                continue
            if k == "location":
                flag = "-l"
            elif k == "date":
                flag = "-d"
            elif k == "ocr":
                flag = "-ocr"
            else:
                flag = f"-{k}"
            text_query += f" {flag} {v}"

    payload = {
        "text_query": text_query,
        "dataset": dataset,
        "model": model,
        "use_temporal_window": params.get("use_temporal_window", False),
        "temporal_window_size": params.get("temporal_window_size", 10),
        "display_window_size": params.get("display_window_size", 10),
        "subset_record_ids": params.get("subset_record_ids", None),
        "top_k": top_k,
        "filters": filters,
    }

    # Update last_text if we have something
    if text:
        ctx.last_text = text

    return payload, ctx


async def run_step_via_main(step: StepQuery, ctx: ExecutionContext) -> Tuple[List[Candidate], ExecutionContext]:
    """Execute a single StepQuery by calling main service endpoints over HTTP and return candidates."""
    payload, ctx = build_querystructured_from_step(step, ctx)
    candidates: List[Candidate] = []

    async with httpx.AsyncClient() as client:
        try:
            if step.action_type in ("search_image", "search_with_image_query"):
                url = f"{MAIN_BASE}/explore/explore_similar_images" if step.action_type == "explore_similar_images" else f"{MAIN_BASE}/search/search_with_image_query"
                resp = await client.post(url, json=payload, timeout=60.0)
                data = resp.json()
                # main returns {"status":.., "data": { response payload }} or similar
                if resp.status_code == 200:
                    # Try to extract record ids and scores
                    # main.search returns wrapped data under 'data' or 'response'
                    inner = data.get("data") or data.get("response") or {}
                    recs = inner.get("record_ids") or inner.get("record_ids", [])
                    scores = inner.get("scores") or inner.get("scores", [])
                else:
                    return [], ctx
            else:
                url = f"{MAIN_BASE}/search/search_with_text_query"
                resp = await client.post(url, json=payload, timeout=60.0)
                data = resp.json()
                if resp.status_code == 200:
                    inner = data.get("data") or data.get("response") or {}
                    recs = inner.get("record_ids") or inner.get("record_ids", [])
                    scores = inner.get("scores") or inner.get("scores", [])
                else:
                    return [], ctx

            # Normalize lengths
            if not recs:
                return [], ctx

            for rid, score in zip(recs, scores):
                candidates.append(Candidate(record_id=int(rid), score=float(score), source=step.action_type, metadata={}, unifying_category_id=None))

            # store candidates in context
            if step.step_id:
                ctx.candidates_by_step[step.step_id] = candidates

            return candidates, ctx

        except Exception as e:
            # On any HTTP or parsing error, return empty list and keep context
            return [], ctx
