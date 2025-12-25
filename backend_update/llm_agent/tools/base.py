from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional
import setup
import httpx

Operation = Literal["search", "rerank", "filter", "expand", "explain"]


@dataclass
class ToolSpec:
    name: str
    description: str
    supported_operations: List[Operation]
    param_schema: Dict[str, Any] = field(default_factory=dict)

    # optional planner/executor hints
    score_range: Optional[tuple[float, float]] = None
    calibration: Optional[str] = None
    default_top_k: int = 300
    default_weight: float = 0.6
    latency_cost: float = 1.0


@dataclass
class ToolExecutionContext:
    operation: Operation
    query: str = ""
    params: Dict[str, Any] = field(default_factory=dict)
    candidates: Optional[List[Dict[str, Any]]] = None
    state: Optional[Dict[str, Any]] = None


@dataclass
class ToolResult:
    success: bool
    items: List[Dict[str, Any]] = field(default_factory=list)
    error: Optional[str] = None
    meta: Dict[str, Any] = field(default_factory=dict)


class BaseTool(ABC):
    """Real base class: shared init, validation helpers, common config."""

    spec: ToolSpec

    def __init__(self):
        # shared init goes here
        # e.g. config, logger, metrics, http clients, etc.
        self.config = setup.get_config()

    def supports(self, operation: Operation) -> bool:
        return operation in self.spec.supported_operations

    def _require_candidates(self, ctx: ToolExecutionContext) -> List[Dict[str, Any]]:
        if ctx.candidates is None:
            raise ValueError(f"{self.spec.name}: operation '{ctx.operation}' requires candidates")
        return ctx.candidates


    @abstractmethod
    async def execute(self, ctx: ToolExecutionContext) -> ToolResult:
        """Execute tool operation; must be implemented by subclasses."""
        raise NotImplementedError


    async def _prepare_search_payload_from_text(self, query, params):
        """Retrieve text embedding from the embedding service and construct the milvus search payload.

        Returns (payload_dict, None) on success or (None, ToolResult) on failure.
        """
        try:
            embedding_resp = await self._make_request(
                method="POST",
                url=f"{self.config['embedding_service_url']}/embedding/text",
                json={
                    "text_query": query,
                    "model": params.get("model", "clips")
                }
            )

            # Expect embedding_resp to contain the key 'text_embedding'
            if not embedding_resp or "text_embedding" not in embedding_resp:
                return None, ToolResult(success=False, error="Embedding service returned unexpected response")

            vector = embedding_resp["text_embedding"]
            payload = {
                "dataset": params.get("dataset", "lsc24"),
                "model": params.get("model", "clips"),
                "embedding": vector,
                "limit": params.get("top_k", 100),
                "subset_record_ids": params.get("subset_record_ids", [])
            }

            return payload, None

        except Exception as e:
            return None, ToolResult(success=False, error=f"Failed to compute text embedding: {str(e)}")
        
    
    async def _make_request(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request to external service"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(method, url, **kwargs)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                raise Exception(f"HTTP request failed: {str(e)}")
            except Exception as e:
                raise Exception(f"Request error: {str(e)}")
