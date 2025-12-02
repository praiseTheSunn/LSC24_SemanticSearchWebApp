from . import BaseTool
from schemas import ToolResult, ToolExecutionContext
from typing import Dict, Any

class TextSemanticTool(BaseTool):
    """Tool for searching/filtering images using text queries"""
    
    def __init__(self):
        super().__init__(
            name="text_semantic",
            description="Look for images using the semantic embeddings of natural language text queries."
        )
        self.param_schema = {
            "query": {"type": "string", "example": "a woman wearing a hat with text 'happy new year'"},
            "top_k": {"type": "int", "example": 100},
            "dataset": {"type": "string", "example": "lsc24"},
            "model": {"type": "string", "example": "clips"},
            "filters": {"type": "object", "example": {"exclude_tags": ["people"]}},
            "subset_record_ids": {"type": "array", "example": [123, 456, 789]}
        }  

    
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute text-based image search"""
        params = context.parameters
        payload, error = await self._prepare_search_payload_from_text(params)
        if error:
            return error

        try:
            # Make request to milvus dense search endpoint
            url = f"{self.config['milvus_service_url']}/search/search_dense"
            response = await self._make_request("POST", url, json=payload)

            # Expect embedding_resp to contain the key 'text_embedding'
            if not response or len(response) == 0:
                return ToolResult(success=False, error="Milvus service returned zero candidates.")

            # Extract results
            search_results = response
            return ToolResult(
                success=True,
                data={
                    "results": search_results,
                    "query": params.get("query"),
                    "result_count": len(search_results),
                    "dataset": params.get("dataset"),
                    "model": params.get("model"),
                    "top_k": params.get("top_k"),
                },
                metadata={
                    "tool": "text_semantic",
                    "filters_applied": params.get("filters", {})
                }
            )

        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Text search execution failed: {str(e)}"
            )

    async def _prepare_search_payload_from_text(self, params: Dict[str, Any]):
        """Retrieve text embedding from the embedding service and construct the milvus search payload.

        Returns (payload_dict, None) on success or (None, ToolResult) on failure.
        """
        try:
            embedding_resp = await self._make_request(
                method="POST",
                url=f"{self.config['embedding_service_url']}/embedding/text",
                json={
                    "text_query": params.get("query", ""),
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

class OCRTool(BaseTool):
    """Tool for searching/filtering images using OCR text queries"""
    
    def __init__(self):
        super().__init__(
            name="ocr",
            description="Look for images containing specific text using OCR-based queries."
        )
        self.param_schema = {
            "query": {"type": "string", "example": "happy new year"},
            "top_k": {"type": "int", "example": 100},
            "dataset": {"type": "string", "example": "lsc24"},
            "model": {"type": "string", "example": "clips"},
            "subset_record_ids": {"type": "array", "example": [123, 456, 789]}
        }
    
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute OCR-based image search"""
        try:
            params = context.parameters
            search_payload = {
                "dataset": params.get("dataset", "lsc24"),
                "model": params.get("model", "clips"),
                "query": params.get("query", ""),
                "anns_field": "ocr_sparse",
                "limit": params.get("top_k", 100),
                "subset_record_ids": params.get("subset_record_ids", [])
            }

            # Validate required parameters
            if not search_payload["query"]:
                return ToolResult(
                    success=False,
                    error="query (ocr or query param) is required for OCR search"
                )

            # Call milvus service directly (router we added)
            url = f"{self.config['milvus_service_url']}/search/search_sparse"
            response = await self._make_request("POST", url, json=search_payload)

            if not response or len(response) == 0:
                return ToolResult(success=False, error="Milvus service returned zero candidates.")

            search_results = response
            return ToolResult(
                success=True,
                data={
                    "results": search_results,
                    "query": search_payload["query"],
                    "result_count": len(search_results),
                    "dataset": search_payload["dataset"],
                    "model": search_payload["model"]
                },
                metadata={
                    "tool": "ocr",
                    "search_type": "fuzzy",
                    "source": "milvus"
                }
            )
                
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"OCR search execution failed: {str(e)}"
            )

class ActivityTool(BaseTool):
    """Tool for searching/filtering images using activity-based queries"""

    def __init__(self):
        super().__init__(
            name="activity",
            description="Look for images containing specific activities."
        )
        self.param_schema = {
            "query": {"type": "string", "example": "playing soccer"},
            "top_k": {"type": "int", "example": 100},
            "dataset": {"type": "string", "example": "lsc24"},
            "model": {"type": "string", "example": "clips"},
            "subset_record_ids": {"type": "array", "example": [123, 456, 789]}
        }
    
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute activity-based image search"""
        try:
            params = context.parameters
            search_payload = {
                "dataset": params.get("dataset", "lsc24"),
                "model": params.get("model", "clips"),
                "query": params.get("query", ""),
                "anns_field": "activity_sparse",
                "limit": params.get("top_k", 100),
                "subset_record_ids": params.get("subset_record_ids", [])
            }

            # Validate required parameters
            if not search_payload["query"]:
                return ToolResult(
                    success=False,
                    error="query (activity or query param) is required for activity search"
                )

            # Call milvus service directly (router we added)
            url = f"{self.config['milvus_service_url']}/search/search_sparse"
            response = await self._make_request("POST", url, json=search_payload)

            if not response or len(response) == 0:
                return ToolResult(success=False, error="Milvus service returned zero candidates.")

            search_results = response
            return ToolResult(
                success=True,
                data={
                    "results": search_results,
                    "query": search_payload["query"],
                    "result_count": len(search_results),
                    "dataset": search_payload["dataset"],
                    "model": search_payload["model"]
                },
                metadata={
                    "tool": "activity",
                    "search_type": "fuzzy",
                    "source": "milvus"
                }
            )
                
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Activity search execution failed: {str(e)}"
            )

class ObjectTool(BaseTool):
    """Tool for searching/filtering images using object tag-based queries"""

    def __init__(self):
        super().__init__(
            name="object_tags",
            description="Look for images containing specific objects using object tag-based queries."
        )
        self.param_schema = {
            "query": {"type": "string", "example": "car, tree"},
            "top_k": {"type": "int", "example": 100},
            "dataset": {"type": "string", "example": "lsc24"},
            "model": {"type": "string", "example": "clips"},
            "subset_record_ids": {"type": "array", "example": [123, 456, 789]}
        }
    
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute object tag-based image search"""
        try:
            params = context.parameters
            search_payload = {
                "dataset": params.get("dataset", "lsc24"),
                "model": params.get("model", "clips"),
                "query": params.get("query", ""),
                "anns_field": "object_tags_sparse",
                "limit": params.get("top_k", 100),
                "subset_record_ids": params.get("subset_record_ids", [])
            }

            # Validate required parameters
            if not search_payload["query"]:
                return ToolResult(
                    success=False,
                    error="query (object tags or query param) is required for object tag search"
                )

            # Call milvus service directly (router we added)
            url = f"{self.config['milvus_service_url']}/search/search_sparse"
            response = await self._make_request("POST", url, json=search_payload)

            if not response or len(response) == 0:
                return ToolResult(success=False, error="Milvus service returned zero candidates.")

            search_results = response
            return ToolResult(
                success=True,
                data={
                    "results": search_results,
                    "query": search_payload["query"],
                    "result_count": len(search_results),
                    "dataset": search_payload["dataset"],
                    "model": search_payload["model"]
                },
                metadata={
                    "tool": "object_tags",
                    "search_type": "fuzzy",
                    "source": "milvus"
                }
            )
                
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Object tag search execution failed: {str(e)}"
            )

class SearchByImageTool(BaseTool):
    """Tool for searching similar images using an input image"""
    
    def __init__(self):
        super().__init__(
            name="search_image",
            description="Search for similar images using an input image (base64 encoded). Returns visually similar images."
        )
        self.param_schema = {
            "image_base64": {"type": "string", "example": "<base64-image>"},
            "top_k": {"type": "int", "example": 100},
            "dataset": {"type": "string", "example": "lsc24"},
            "model": {"type": "string", "example": "clips"},
            "subset_record_ids": {"type": "array", "example": [123, 456, 789]}
        }
    
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute image-based similarity search"""
        try:
            params = context.parameters
            
            # Prepare request for main service
            search_payload = {
                "image_base64": params.get("image_base64", ""),
                "dataset": params.get("dataset", "lsc24"),
                "model": params.get("model", "clips"),
                "display_window_size": params.get("display_window_size", 20)
            }
            
            # Validate required parameters
            if not search_payload["image_base64"]:
                return ToolResult(
                    success=False,
                    error="image_base64 parameter is required for image search"
                )
            
            # Make request to main service
            url = f"{self.config['milvus_service_url']}/search/search_with_image_query"
            response = await self._make_request("POST", url, json=search_payload)
            
            # Extract results
            if response.get("status") == 200:
                search_results = response.get("data", {})
                return ToolResult(
                    success=True,
                    data={
                        "results": search_results,
                        "result_count": len(search_results.get("response", [])),
                        "dataset": params.get("dataset"),
                        "model": params.get("model")
                    },
                    metadata={
                        "tool": "search_image",
                        "search_type": "image_similarity"
                    }
                )
            else:
                return ToolResult(
                    success=False,
                    error=f"Image search failed: {response.get('message', 'Unknown error')}"
                )
                
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Image search execution failed: {str(e)}"
            )