from . import BaseTool
from schemas import ToolResult, ToolExecutionContext
from typing import Dict, Any, List

class GetMetadataTool(BaseTool):
    """Tool for retrieving detailed metadata for specific images"""
    
    def __init__(self):
        super().__init__(
            name="get_metadata",
            description="Retrieve detailed metadata for specific images including timestamps, locations, activities, and other contextual information."
        )
        self.param_schema = {
            "record_ids": {"type": "list", "example": ["rec1", "rec2"]},
            "dataset": {"type": "string", "example": "lsc24"}
        }
    
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute metadata retrieval"""
        try:
            params = context.parameters
            
            # Prepare metadata request
            metadata_payload = {
                "dataset": params.get("dataset", "lsc24"),
                "model": params.get("model", "clips"),
                "record_ids": params.get("record_ids", [])
            }
            
            # Validate required parameters
            if not metadata_payload["record_ids"]:
                return ToolResult(
                    success=False,
                    error="record_ids parameter is required"
                )
            
            # Make request to milvus service for metadata
            url = f"{self.config['milvus_service_url']}/fetch/fetch_metadata"
            response = await self._make_request("POST", url, json=metadata_payload)
            
            # Extract results
            if response.get("response"):
                metadata_results = response.get("response", [])
                
                # Enrich with additional processing
                enriched_metadata = []
                for item in metadata_results:
                    enriched_item = {
                        **item,
                        "retrieval_timestamp": context.timestamp.isoformat(),
                        "tool_source": "get_metadata"
                    }
                    enriched_metadata.append(enriched_item)
                
                return ToolResult(
                    success=True,
                    data={
                        "metadata": enriched_metadata,
                        "record_count": len(enriched_metadata),
                        "dataset": params.get("dataset"),
                        "model": params.get("model"),
                        "requested_ids": params.get("record_ids")
                    },
                    metadata={
                        "tool": "get_metadata",
                        "retrieval_type": "detailed_metadata",
                        "record_count": len(enriched_metadata)
                    }
                )
            else:
                return ToolResult(
                    success=False,
                    error="No metadata found for the provided record IDs"
                )
                
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Metadata retrieval execution failed: {str(e)}"
            )

class GetEmbeddingsTool(BaseTool):
    """Tool for retrieving embeddings for specific images"""
    
    def __init__(self):
        super().__init__(
            name="get_embeddings",
            description="Retrieve vector embeddings for specific images. Useful for similarity calculations or custom analysis."
        )
        self.param_schema = {
            "record_ids": {"type": "list", "example": ["rec1"]},
            "dataset": {"type": "string", "example": "lsc24"},
            "model": {"type": "string", "example": "clips"}
        }
    
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute embedding retrieval"""
        try:
            params = context.parameters
            
            # Prepare embeddings request
            embeddings_payload = {
                "collection_name": f"{params.get('dataset', 'lsc24')}_{params.get('model', 'clips')}",
                "record_ids": params.get("record_ids", [])
            }
            
            # Validate required parameters
            if not embeddings_payload["record_ids"]:
                return ToolResult(
                    success=False,
                    error="record_ids parameter is required"
                )
            
            # Make request to milvus service for embeddings
            url = f"{self.config['milvus_service_url']}/fetch/fetch_embeddings"
            response = await self._make_request("POST", url, json=embeddings_payload)
            
            # Extract results
            if response.get("response"):
                embeddings_results = response.get("response", [])
                
                return ToolResult(
                    success=True,
                    data={
                        "embeddings": embeddings_results,
                        "embedding_count": len(embeddings_results),
                        "collection_name": embeddings_payload["collection_name"],
                        "requested_ids": params.get("record_ids")
                    },
                    metadata={
                        "tool": "get_embeddings",
                        "retrieval_type": "vector_embeddings",
                        "embedding_dimension": len(embeddings_results[0]) if embeddings_results else 0
                    }
                )
            else:
                return ToolResult(
                    success=False,
                    error="No embeddings found for the provided record IDs"
                )
                
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Embeddings retrieval execution failed: {str(e)}"
            )