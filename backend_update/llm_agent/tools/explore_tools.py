from . import BaseTool
from schemas import ToolResult, ToolExecutionContext
from typing import Dict, Any, List

class ExploreSimilarTool(BaseTool):
    """Tool for exploring images similar to given images"""
    
    def __init__(self):
        super().__init__(
            name="explore_similar",
            description="Find images similar to a set of provided images. Takes image IDs or URLs and returns visually similar images."
        )
        self.param_schema = {
            "image_ids": {"type": "list", "example": ["id1", "id2"]},
            "image_urls": {"type": "list", "example": ["https://..."]},
            "top_k": {"type": "int", "example": 10},
            "dataset": {"type": "string", "example": "lsc24"}
        }
    
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute similar image exploration"""
        try:
            params = context.parameters
            
            # Prepare request for main service
            explore_payload = {
                "dataset": params.get("dataset", "lsc24"),
                "model": params.get("model", "clips"),
                "display_window_size": params.get("display_window_size", 20)
            }
            
            # Handle image IDs or URLs
            if "image_ids" in params:
                explore_payload["image_ids"] = params["image_ids"]
            elif "image_urls" in params:
                explore_payload["image_urls"] = params["image_urls"]
            else:
                return ToolResult(
                    success=False,
                    error="Either image_ids or image_urls parameter is required"
                )
            
            # Make request to main service
            url = f"{self.config['main_service_url']}/explore/explore_similar_images"
            response = await self._make_request("POST", url, json=explore_payload)
            
            # Extract results
            if response.get("status") == 200:
                explore_results = response.get("data", {})
                return ToolResult(
                    success=True,
                    data={
                        "results": explore_results,
                        "result_count": len(explore_results.get("response", [])),
                        "dataset": params.get("dataset"),
                        "model": params.get("model"),
                        "source_images": params.get("image_ids") or params.get("image_urls")
                    },
                    metadata={
                        "tool": "explore_similar",
                        "exploration_type": "similarity",
                        "source_count": len(params.get("image_ids", []) or params.get("image_urls", []))
                    }
                )
            else:
                return ToolResult(
                    success=False,
                    error=f"Similar exploration failed: {response.get('message', 'Unknown error')}"
                )
                
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Similar exploration execution failed: {str(e)}"
            )

class ExploreNeighborTool(BaseTool):
    """Tool for exploring temporal/spatial neighbors of given images"""
    
    def __init__(self):
        super().__init__(
            name="explore_neighbor",
            description="Find neighboring images (temporal or spatial) to a set of provided images. Useful for finding images taken around the same time or location."
        )
        self.param_schema = {
            "image_ids": {"type": "list", "example": ["id1"]},
            "neighbor_type": {"type": "string", "example": "temporal"},
            "window_size": {"type": "int", "example": 10},
            "dataset": {"type": "string", "example": "lsc24"}
        }
    
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute neighbor image exploration"""
        try:
            params = context.parameters
            
            # Prepare request for main service
            explore_payload = {
                "dataset": params.get("dataset", "lsc24"),
                "model": params.get("model", "clips"),
                "display_window_size": params.get("display_window_size", 20),
                "neighbor_type": params.get("neighbor_type", "temporal"),  # or "spatial"
                "window_size": params.get("window_size", 10)
            }
            
            # Handle image IDs or URLs
            if "image_ids" in params:
                explore_payload["image_ids"] = params["image_ids"]
            elif "image_urls" in params:
                explore_payload["image_urls"] = params["image_urls"]
            else:
                return ToolResult(
                    success=False,
                    error="Either image_ids or image_urls parameter is required"
                )
            
            # Make request to main service
            url = f"{self.config['main_service_url']}/explore/explore_neighbor_images"
            response = await self._make_request("POST", url, json=explore_payload)
            
            # Extract results
            if response.get("status") == 200:
                explore_results = response.get("data", {})
                return ToolResult(
                    success=True,
                    data={
                        "results": explore_results,
                        "result_count": len(explore_results.get("response", [])),
                        "dataset": params.get("dataset"),
                        "model": params.get("model"),
                        "source_images": params.get("image_ids") or params.get("image_urls"),
                        "neighbor_type": params.get("neighbor_type", "temporal")
                    },
                    metadata={
                        "tool": "explore_neighbor",
                        "exploration_type": "neighbor",
                        "neighbor_type": params.get("neighbor_type", "temporal"),
                        "window_size": params.get("window_size", 10)
                    }
                )
            else:
                return ToolResult(
                    success=False,
                    error=f"Neighbor exploration failed: {response.get('message', 'Unknown error')}"
                )
                
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Neighbor exploration execution failed: {str(e)}"
            )