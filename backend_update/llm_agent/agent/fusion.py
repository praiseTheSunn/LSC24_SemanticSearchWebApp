# fusion.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Literal


FusionMethod = Literal["combsum", "combmnz", "rrf"]


def _get_id(item: Dict[str, Any]) -> Optional[str]:
    return item.get("record_id")


def _get_score(item: Dict[str, Any], default: float = 0.0) -> float:
    v = item.get("distance", item.get("score", default))
    try:
        return float(v)
    except Exception:
        return default


# --- add near top-level helpers ---

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
    normalize: bool = True  # applies to combsum/combmnz

    def __post_init__(self) -> None:
        m = self.method.lower()
        if m not in ("combsum", "combmnz", "rrf"):
            raise ValueError(f"Unknown fusion method: {self.method}")
        self.method = m  # type: ignore
        if self.rrf_c <= 0:
            raise ValueError("rrf_c must be > 0")

    @classmethod
    def from_params(cls, params: Dict[str, Any]) -> "Fusion":
        return cls(
            method=str(params.get("method", "rrf")).lower(),  # type: ignore
            rrf_c=float(params.get("rrf_c", 60.0)),
            normalize=bool(params.get("normalize", True)),
        )

    def merge(self, prev: List[Dict[str, Any]], newest: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Merge 2 candidate lists.

        Inputs:
        - prev: previous combined list
        - newest: newest candidates from current tool call

        Output:
        - merged list of items with 'score' field representing fused score,
          sorted descending by fused score.

        Requirements on items:
        - Must have record_id
        - Should have distance/score
        """
        prev = _dedupe_keep_best(prev)
        newest = _dedupe_keep_best(newest)

        if self.method == "rrf":
            return self._merge_rrf(prev, newest)

        # combsum/combmnz
        return self._merge_comb(prev, newest, mnz=(self.method == "combmnz"))

    # --------------------
    # RRF
    # --------------------
    def _merge_rrf(self, prev: List[Dict[str, Any]], newest: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        r_prev = _rank_map(prev)
        r_new = _rank_map(newest)

        # union ids
        ids = set(r_prev.keys()) | set(r_new.keys())
        ids.discard("")

        # preserve one representative item for meta fields
        rep: Dict[str, Dict[str, Any]] = {}
        for it in prev + newest:
            k = _get_id(it)
            if k and k not in rep:
                rep[k] = it

        fused_items: List[Dict[str, Any]] = []
        for k in ids:
            rank_prev = r_prev.get(k)
            rank_new = r_new.get(k)

            score = 0.0
            if rank_prev is not None:
                score += 1.0 / (self.rrf_c + rank_prev)
            if rank_new is not None:
                score += 1.0 / (self.rrf_c + rank_new)

            out = dict(rep.get(k, {"record_id": k}))
            out["score"] = score
            fused_items.append(out)

        fused_items.sort(key=_get_score, reverse=True)
        return fused_items

    # --------------------
    # CombSUM / CombMNZ
    # --------------------
    def _merge_comb(self, prev: List[Dict[str, Any]], newest: List[Dict[str, Any]], *, mnz: bool) -> List[Dict[str, Any]]:
        # optional min-max normalization per list
        p_scores = [_get_score(it) for it in prev]
        n_scores = [_get_score(it) for it in newest]

        if self.normalize:
            p_norm = self._minmax(p_scores)
            n_norm = self._minmax(n_scores)
        else:
            p_norm = p_scores
            n_norm = n_scores

        p_map: Dict[str, float] = {}
        n_map: Dict[str, float] = {}
        rep: Dict[str, Dict[str, Any]] = {}

        for it, s in zip(prev, p_norm):
            k = _get_id(it)
            if not k:
                continue
            p_map[k] = max(p_map.get(k, 0.0), float(s))
            rep.setdefault(k, it)

        for it, s in zip(newest, n_norm):
            k = _get_id(it)
            if not k:
                continue
            n_map[k] = max(n_map.get(k, 0.0), float(s))
            rep.setdefault(k, it)

        ids = set(p_map.keys()) | set(n_map.keys())

        fused_items: List[Dict[str, Any]] = []
        for k in ids:
            s1 = p_map.get(k, 0.0)
            s2 = n_map.get(k, 0.0)
            score = s1 + s2

            if mnz:
                nonzero = int(s1 > 0.0) + int(s2 > 0.0)
                score *= nonzero

            out = dict(rep.get(k, {"record_id": k}))
            out["score"] = float(score)
            fused_items.append(out)

        fused_items.sort(key=_get_score, reverse=True)
        return fused_items


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
    def _minmax(scores: List[float], eps: float = 1e-9) -> List[float]:
        if not scores:
            return []
        mn, mx = min(scores), max(scores)
        if abs(mx - mn) < eps:
            return [0.0 for _ in scores]
        return [(s - mn) / (mx - mn + eps) for s in scores]
