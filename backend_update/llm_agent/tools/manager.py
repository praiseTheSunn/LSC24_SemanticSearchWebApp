from __future__ import annotations
from typing import Any, Dict, Optional

from .base import BaseTool, ToolExecutionContext, ToolResult, ToolSpec


class ToolManager:
    """Manages all available tools for the agent."""

    def __init__(self):
        self.tools: Dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        self.tools[tool.spec.name] = tool

    def list_specs(self) -> Dict[str, ToolSpec]:
        return {name: tool.spec for name, tool in self.tools.items()}

    def get_tool(self, tool_name: str) -> Optional[BaseTool]:
        return self.tools.get(tool_name)

    async def execute_tool(self, tool_name: str, ctx: ToolExecutionContext) -> ToolResult:
        tool = self.get_tool(tool_name)
        if not tool:
            return ToolResult(success=False, error=f"Tool '{tool_name}' not found")

        if not tool.supports(ctx.operation):
            return ToolResult(
                success=False,
                error=f"Tool '{tool_name}' does not support operation '{ctx.operation}'"
            )

        try:
            print(f"Executing tool {tool_name}...")
            return await tool.execute(ctx)
        except Exception as e:
            return ToolResult(success=False, error=f"Tool execution failed: {e}")
