from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import httpx
from schemas import ToolResult, ToolExecutionContext
import setup

class BaseTool(ABC):
    """Base class for all agent tools"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.config = setup.get_config()
        # A dict describing parameter names, types and examples for LLM prompt hints
        # Example: {"query": {"type": "string", "example": "a woman wearing a hat"}}
        self.param_schema: Dict[str, Dict[str, Any]] = {}
    
    @abstractmethod
    async def execute(self, context: ToolExecutionContext) -> ToolResult:
        """Execute the tool with given parameters"""
        pass
    
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

class ToolManager:
    """Manages all available tools for the agent"""
    
    def __init__(self):
        self.tools = {}
        self._register_tools()
    
    def _register_tools(self):
        """Register all available tools"""
        from ._search_tools import TextSemanticTool, OCRTool, ActivityTool, ObjectTool
        from .explore_tools import ExploreSimilarTool, ExploreNeighborTool
        from .feedback_tools import ProvideFeedbackTool
        from ._metadata_tools import GetMetadataTool
        
        tools = [
            TextSemanticTool(),
            OCRTool(),
            ActivityTool(),
            ObjectTool()
            # SearchByImageTool(),
            # ExploreSimilarTool(),
            # ExploreNeighborTool(),
            # ProvideFeedbackTool(),
            # GetMetadataTool(),
        ]
        
        for tool in tools:
            self.tools[tool.name] = tool

    def list_tools(self) -> Dict[str, Any]:
        """List tools with descriptions and parameter schemas."""
        return {
            name: {
                "description": tool.description,
                "params": getattr(tool, "param_schema", {})
            }
            for name, tool in self.tools.items()
        }
    
    def get_tool(self, tool_name: str) -> Optional[BaseTool]:
        """Get tool by name"""
        return self.tools.get(tool_name)
    
    async def execute_tool(self, tool_name: str, context: ToolExecutionContext) -> ToolResult:
        """Execute a tool by name"""
        tool = self.get_tool(tool_name)
        if not tool:
            return ToolResult(
                success=False,
                error=f"Tool '{tool_name}' not found"
            )
        
        try:
            return await tool.execute(context)
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Tool execution failed: {str(e)}"
            )