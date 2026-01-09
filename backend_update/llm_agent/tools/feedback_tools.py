from . import BaseTool
from schemas import ToolResult, ToolExecutionContext
from typing import Dict, Any, List

class ProvideFeedbackTool(BaseTool):
    """Tool for providing user feedback to refine search results"""
    
    def __init__(self):
        super().__init__(
            name="provide_feedback",
            description="Provide positive or negative feedback on search results to get refined recommendations. Takes liked and disliked image IDs."
        )
        self.param_schema = {
            "liked_ids": {"type": "list", "example": ["id1", "id2"]},
            "disliked_ids": {"type": "list", "example": ["id3"]},
            "like_limit": {"type": "int", "example": 10},
            "dataset": {"type": "string", "example": "lsc24"}
        }
    
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute feedback-based result refinement"""
        try:
            params = context.parameters
            
            # Prepare feedback request
            feedback_payload = {
                "dataset": params.get("dataset", "lsc24"),
                "model": params.get("model", "clips"),
                "like": {
                    "ids": params.get("liked_ids", []),
                    "prior_scores": params.get("prior_scores", []),
                    "limit": params.get("like_limit", 10)
                },
                "dislike": {
                    "ids": params.get("disliked_ids", []),
                    "limit": params.get("dislike_limit", 10)
                }
            }
            
            # Validate that we have some feedback
            if not feedback_payload["like"]["ids"] and not feedback_payload["dislike"]["ids"]:
                return ToolResult(
                    success=False,
                    error="At least one of liked_ids or disliked_ids must be provided"
                )
            
            # Make request to main service
            url = f"{self.config['main_service_url']}/feedback"
            response = await self._make_request("POST", url, json=feedback_payload)
            
            # Extract results
            if response.get("status") == 200:
                feedback_results = response.get("response", {})
                
                return ToolResult(
                    success=True,
                    data={
                        "results": feedback_results,
                        "liked_recommendations": feedback_results.get("like", {}),
                        "disliked_exclusions": feedback_results.get("dislike", {}),
                        "dataset": params.get("dataset"),
                        "model": params.get("model")
                    },
                    metadata={
                        "tool": "provide_feedback",
                        "liked_count": len(params.get("liked_ids", [])),
                        "disliked_count": len(params.get("disliked_ids", [])),
                        "feedback_type": "refinement"
                    }
                )
            else:
                return ToolResult(
                    success=False,
                    error=f"Feedback processing failed: {response.get('message', 'Unknown error')}"
                )
                
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Feedback tool execution failed: {str(e)}"
            )