"""Deprecated thin wrapper module.

The implementations of Milvus search helpers were moved to
`backend_update/milvus/routers/search.py` to centralize the code used by
the HTTP router. To avoid duplicate definitions we re-export the
helpers here so other internal code can continue to import
`milvus.internal.search.search_dense` etc.
"""

import sys
sys.path.append("../routers")
try:
    from backend_update.milvus.routers.search import (
        search_dense,
        search_sparse,
        apply_filter_only,
    )
except Exception:
    # Best-effort import fallback for different execution contexts
    try:
        from routers.search import search_dense, search_sparse, apply_filter_only
    except Exception:
        # Provide simple placeholders raising ImportError when used
        def _missing(*args, **kwargs):
            raise ImportError("Milvus search implementation not available. Ensure routers.search is importable.")

        search_dense = _missing
        search_sparse = _missing
        apply_filter_only = _missing
