from __future__ import annotations
from typing import Any, Dict, List
import time

from .base import BaseTool, ToolSpec, ToolExecutionContext, ToolResult


class OCRTool(BaseTool):
    def __init__(self):
        super().__init__()
        
        self.spec = ToolSpec(
            name="ocr",
            description="OCR text retrieval using Elasticsearch",
            supported_operations=["search", "rerank"],
            param_schema={
                "top_k": {"type": "int", "default": 300},
                "filters": {"type": "object", "optional": True},
            },
            score_range=(0.0, 1.0),
            calibration=None,
            default_top_k=300,
            default_weight=0.7,
            latency_cost=2.5,
        )

    def supports(self, operation: str) -> bool:
        return operation in self.spec.supported_operations

    async def execute(self, ctx: ToolExecutionContext) -> ToolResult:
        t0 = time.time()
        op = ctx.operation
        items: List[Dict[str, Any]] = []

        if op == "search":
            payload, error = await self._prepare_search_payload_from_text(ctx.query, ctx.params)
            if error:
                return error
            items = await self._make_request(
                method="POST", 
                url=f"{self.config['milvus_service_url']}/search/search_ocr", 
                json=payload
            )
            return ToolResult(True, items=items, meta={"elapsed_sec": time.time() - t0})

        if op == "rerank":
            cands = ctx.candidates or []
            # TODO: rerank via re-embedding, cross-encoder, etc.
            # items = await self.milvus.rerank(ctx.query, cands)
            items = cands
            return ToolResult(True, items=items, meta={"elapsed_sec": time.time() - t0})

        return ToolResult(False, error=f"Unsupported operation: {op}")
    

    async def _prepare_search_payload_from_text(self, query, params):
        return {
                "query": query,
                "limit": params.get("top_k", 100),
                "subset_record_ids": params.get("subset_record_ids", []),
                "dataset": params.get("dataset", "lsc24")
            }, None