# fusion.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Literal, Optional
import math
from pprint import pprint


FusionMethod = Literal["combsum", "combmnz", "rrf"]
NormMethod = Literal[
    "none",
    "minmax",
    "max",
    "sum",
    "zscore",
    "rank_linear",
    "rank_rr",
    "softmax",
]


def _get_id(item: Dict[str, Any]) -> Optional[str]:
    return item.get("record_id")


def _get_score(item: Dict[str, Any]) -> float:
    v = item.get("distance", item.get("score", 1.0))
    try:
        return float(v)
    except Exception:
        return 1.0

def _get_field(item: Dict[str, Any], field_path: str) -> Any:
    """
    Supports dotted path like 'meta.ocr_conf' to access nested dicts.
    """
    cur: Any = item
    for part in field_path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def _safe_float(x: Any, default: float = 0.0) -> float:
    try:
        v = float(x)
        if not math.isfinite(v):
            return default
        return v
    except Exception:
        return default


def _passes_constraint(value: Any, c: Dict[str, Any]) -> bool:
    """
    Constraint format (examples):
      {"field": "meta.ocr_conf", "op": ">=", "value": 0.7}
      {"field": "objects", "op": "contains", "value": "person"}
      {"field": "activity", "op": "in", "value": ["running","cycling"]}
      {"field": "has_ocr", "op": "==", "value": True}
    """
    op = str(c.get("op", "exists")).lower()
    target = c.get("value")

    if op == "exists":
        return value is not None

    if op in ("==", "eq"):
        return value == target
    if op in ("!=", "ne"):
        return value != target

    # numeric compares
    if op in (">", ">=", "<", "<="):
        try:
            v = float(value)
            t = float(target)
        except Exception:
            return False
        if op == ">":
            return v > t
        if op == ">=":
            return v >= t
        if op == "<":
            return v < t
        return v <= t  # "<="

    # membership / containment
    if op == "in":
        if not isinstance(target, (list, set, tuple)):
            return False
        return value in target

    if op == "contains":
        # if value is list -> membership; if string -> substring
        if isinstance(value, list):
            return target in value
        if isinstance(value, str) and isinstance(target, str):
            return target in value
        return False

    raise ValueError(f"Unknown constraint op: {op}")



def _dedupe_keep_best(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Within a single list, keep only best-scoring item per id."""
    best: Dict[str, Dict[str, Any]] = {}
    for it in items:
        k = _get_id(it)
        if not k:
            continue
        if k not in best or _get_score(it) > _get_score(best[k]):
            best[k] = it
    return list(best.values())


# ----------------------------
# Normalization registry
# ----------------------------
NormFn = Callable[[List[float], Dict[str, Any]], List[float]]


def _norm_none(scores: List[float], _: Dict[str, Any]) -> List[float]:
    return list(scores)


def _norm_minmax(scores: List[float], params: Dict[str, Any]) -> List[float]:
    if not scores:
        return []
    eps = float(params.get("eps", 1e-9))
    constant_value = float(params.get("constant_value", 1.0))  # better than all-zeros
    mn, mx = min(scores), max(scores)
    if abs(mx - mn) < eps:
        return [constant_value for _ in scores]
    denom = (mx - mn) + eps
    return [(s - mn) / denom for s in scores]


def _norm_max(scores: List[float], params: Dict[str, Any]) -> List[float]:
    if not scores:
        return []
    eps = float(params.get("eps", 1e-9))
    m = max(scores)
    if abs(m) < eps:
        return [0.0 for _ in scores]
    return [s / (m + eps) for s in scores]


def _norm_sum(scores: List[float], params: Dict[str, Any]) -> List[float]:
    if not scores:
        return []
    eps = float(params.get("eps", 1e-9))
    ssum = sum(scores)
    if abs(ssum) < eps:
        return [0.0 for _ in scores]
    return [s / (ssum + eps) for s in scores]


def _norm_zscore(scores: List[float], params: Dict[str, Any]) -> List[float]:
    if not scores:
        return []
    eps = float(params.get("eps", 1e-9))
    mu = sum(scores) / max(1, len(scores))
    var = sum((s - mu) ** 2 for s in scores) / max(1, len(scores))
    sigma = math.sqrt(var)
    if sigma < eps:
        return [0.0 for _ in scores]
    return [(s - mu) / (sigma + eps) for s in scores]


def _norm_rank_linear(scores: List[float], _: Dict[str, Any]) -> List[float]:
    """
    Convert to rank-based [0..1], best gets 1.0.
    Keeps ordering even if original scores are uncalibrated.
    """
    if not scores:
        return []
    # ranks by descending score
    order = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    n = len(scores)
    out = [0.0] * n
    if n == 1:
        out[order[0]] = 1.0
        return out
    for r, i in enumerate(order, start=1):
        out[i] = (n - r) / (n - 1)  # best=1, worst=0
    return out


def _norm_rank_rr(scores: List[float], params: Dict[str, Any]) -> List[float]:
    """
    Reciprocal-rank normalization: 1/(c+rank)
    """
    if not scores:
        return []
    c = float(params.get("rrf_c", 60.0))
    order = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    out = [0.0] * len(scores)
    for r, i in enumerate(order, start=1):
        out[i] = 1.0 / (c + r)
    return out


def _norm_softmax(scores: List[float], params: Dict[str, Any]) -> List[float]:
    if not scores:
        return []
    eps = float(params.get("eps", 1e-9))
    T = float(params.get("temperature", 1.0))
    T = max(eps, T)
    m = max(scores)
    exps = [math.exp((s - m) / T) for s in scores]
    denom = sum(exps)
    if denom < eps:
        return [0.0 for _ in scores]
    return [e / denom for e in exps]


NORM_REGISTRY: Dict[str, NormFn] = {
    "none": _norm_none,
    "minmax": _norm_minmax,
    "max": _norm_max,
    "sum": _norm_sum,
    "zscore": _norm_zscore,
    "rank_linear": _norm_rank_linear,
    "rank_rr": _norm_rank_rr,
    "softmax": _norm_softmax,
}


# ----------------------------
# Fusion methods
# ----------------------------
def _rank_map(items: List[Dict[str, Any]]) -> Dict[str, int]:
    """Rank is 1-based after sorting by descending score."""
    items_sorted = sorted(items, key=_get_score, reverse=True)
    return {(_get_id(it) or ""): i + 1 for i, it in enumerate(items_sorted) if _get_id(it)}



@dataclass
class Fusion:
    """
    Fusion that merges two ranked candidate lists into one list.

    Supported methods:
    - combsum: sum normalized scores across lists (with optional min-max normalization per list)
    - combmnz: combsum * (#lists where doc has non-zero score)
    - rrf: reciprocal rank fusion (needs rrf_c)

    Note:
    - This class merges exactly 2 lists (prev, newest) as you requested.
    - You can call merge repeatedly to accumulate across multiple steps.
    """
    method: FusionMethod = "rrf"
    rrf_c: float = 60.0

    # defaults (can be overridden per call via params)
    default_norm: str = "minmax"
    default_top_k: int = 50
    default_weight_newest: float = 0.5

    # optional: drop low scores
    score_floor: Optional[float] = None


    def __post_init__(self) -> None:
        m = str(self.method).lower()
        if m not in ("combsum", "combmnz", "rrf"):
            raise ValueError(f"Unknown fusion method: {self.method}")
        self.method = m  # type: ignore
        if self.rrf_c <= 0:
            raise ValueError("rrf_c must be > 0")
        

    @classmethod
    def from_plan_fusion(cls, fusion_cfg: Dict[str, Any]) -> "Fusion":
        # plan.fusion = {"method":"combsum", "rrf_c":60, "default_norm":"minmax", ...}
        return cls(
            method=str(fusion_cfg.get("method", "rrf")).lower(),  # type: ignore
            rrf_c=float(fusion_cfg.get("rrf_c", 60.0)),
            default_norm=str(fusion_cfg.get("default_norm", "minmax")),
            default_top_k=int(fusion_cfg.get("top_k", 50)),
            default_weight_newest=float(fusion_cfg.get("weight", 0.5)),
            score_floor=fusion_cfg.get("score_floor", None),
        )


    def merge(
        self,
        prev: List[Dict[str, Any]],
        newest: List[Dict[str, Any]],
        *,
        params: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Merge prev + newest using method configured at the Fusion instance.

        Per-call params (examples):
          - weight: float in [0,1]  (weight for newest; prev gets 1-weight)
          - norm: "minmax"|"rank_linear"|...
          - normalize: bool (if False, norm becomes "none")
          - distance_to_score: "neg"|"inv"|"exp"
          - temperature: float (for softmax or exp distance)
          - top_k: int
          - rrf_c: float (override)
        """
        p = dict(params or {})
        top_k = int(p.get("top_k", self.default_top_k))
        weight_new = float(p.get("weight", self.default_weight_newest))
        weight_new = min(1.0, max(0.0, weight_new))
        weight_prev = 1.0 - weight_new

        normalize = bool(p.get("normalize", True))
        norm_name = str(p.get("norm", self.default_norm)).lower()
        if not normalize:
            norm_name = "none"
        norm_fn = NORM_REGISTRY.get(norm_name)
        if norm_fn is None:
            raise ValueError(f"Unknown norm: {norm_name}. Available: {sorted(NORM_REGISTRY.keys())}")

        # dedupe input lists (by record_id)
        prev = _dedupe_keep_best(prev)
        newest = _dedupe_keep_best(newest)

        if self.method == "rrf":
            return self._merge_rrf(prev, newest, weight_prev, weight_new, top_k, p)

        # combsum / combmnz
        mnz = (self.method == "combmnz")
        return self._merge_comb(prev, newest, mnz, norm_fn, weight_prev, weight_new, top_k, p)

    def _merge_rrf(
        self,
        prev: List[Dict[str, Any]],
        newest: List[Dict[str, Any]],
        w_prev: float,
        w_new: float,
        top_k: int,
        p: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        c = float(p.get("rrf_c", self.rrf_c))
        prev_rank = _rank_map(prev)
        new_rank = _rank_map(newest)

        ids = set(prev_rank.keys()) | set(new_rank.keys())
        ids.discard("")

        rep: Dict[str, Dict[str, Any]] = {}
        for it in prev + newest:
            rid = _get_id(it)
            if rid and rid not in rep:
                rep[rid] = it

        out: List[Dict[str, Any]] = []
        for rid in ids:
            s = 0.0
            r1 = prev_rank.get(rid)
            r2 = new_rank.get(rid)
            if r1 is not None:
                s += w_prev * (1.0 / (c + r1))
            if r2 is not None:
                s += w_new * (1.0 / (c + r2))
            item = dict(rep.get(rid, {"record_id": rid}))
            item["merged_score"] = s
            out.append(item)

        out.sort(key=lambda x: _safe_float(x.get("merged_score", 0.0)), reverse=True)
        if self.score_floor is not None:
            out = [it for it in out if _safe_float(it.get("merged_score", 0.0)) >= float(self.score_floor)]
        return out[:top_k]

    def _merge_comb(
        self,
        prev: List[Dict[str, Any]],
        newest: List[Dict[str, Any]],
        mnz: bool,
        norm_fn: NormFn,
        w_prev: float,
        w_new: float,
        top_k: int,
        p: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        # unify scores
        p_raw = [_get_score(it) for it in prev]
        n_raw = [_get_score(it) for it in newest]

        # normalize per-list
        p_norm = norm_fn(p_raw, p)
        n_norm = norm_fn(n_raw, p)

        rep: Dict[str, Dict[str, Any]] = {}
        p_map: Dict[str, float] = {}
        n_map: Dict[str, float] = {}

        prev_ids = set()
        new_ids = set()

        for it, s in zip(prev, p_norm):
            rid = _get_id(it)
            if not rid:
                continue
            prev_ids.add(rid)
            rep.setdefault(rid, it)
            p_map[rid] = max(p_map.get(rid, 0.0), float(s) * w_prev)

        for it, s in zip(newest, n_norm):
            rid = _get_id(it)
            if not rid:
                continue
            new_ids.add(rid)
            rep.setdefault(rid, it)
            n_map[rid] = max(n_map.get(rid, 0.0), float(s) * w_new)

        ids = set(p_map.keys()) | set(n_map.keys())

        out: List[Dict[str, Any]] = []
        for rid in ids:
            s = p_map.get(rid, 0.0) + n_map.get(rid, 0.0)
            if mnz:
                # presence-based MNZ (more stable than "weighted score > 0")
                nonzero = int(rid in prev_ids) + int(rid in new_ids)
                s *= nonzero
            item = dict(rep.get(rid, {"record_id": rid}))
            item["merged_score"] = float(s)
            out.append(item)

        out.sort(key=lambda x: _safe_float(x.get("merged_score", 0.0)), reverse=True)
        if self.score_floor is not None:
            out = [it for it in out if _safe_float(it.get("score", 0.0)) >= float(self.score_floor)]
        return out[:top_k]



    def filter(
        self,
        prev: List[Dict[str, Any]],
        newest: List[Dict[str, Any]],
        *,
        constraint: Dict[str, Any],
        strict_missing: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Filter operation:
        - prev: previous combined list (scores preserved)
        - newest: a list that contains per-item info used to evaluate the constraint
        - constraint: dict describing how to test newest item's field
        - strict_missing: if True, items missing from newest are removed
                         if False, items missing from newest are kept

        Returns: subset of prev (same objects), scores unchanged.
        """

        # Build newest lookup by id
        newest_map: Dict[str, Dict[str, Any]] = {}
        for it in newest:
            k = _get_id(it)
            if k:
                newest_map[str(k)] = it

        field = str(constraint.get("field", "")).strip()
        if not field:
            raise ValueError("constraint.field is required")

        kept: List[Dict[str, Any]] = []

        for it in prev:
            k = _get_id(it)
            if not k:
                continue

            probe = newest_map.get(str(k))
            if probe is None:
                if strict_missing:
                    continue
                kept.append(it)
                continue

            value = _get_field(probe, field)
            if _passes_constraint(value, constraint):
                kept.append(it)

        return kept


    @staticmethod
    def _minmax(scores: List[float], eps: float = 1e-9, constant_value: float = 1.0) -> List[float]:
        if not scores:
            return []
        mn, mx = min(scores), max(scores)
        if abs(mx - mn) < eps:
            return [constant_value for _ in scores]
        denom = (mx - mn)
        return [(s - mn) / (denom + eps) for s in scores]