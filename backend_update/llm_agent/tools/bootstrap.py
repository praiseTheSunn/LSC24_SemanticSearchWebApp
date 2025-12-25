# tools/bootstrap.py
from __future__ import annotations
from typing import Any

from .manager import ToolManager

# Your concrete tools
from .tool_text_semantic import TextSemanticTool
from .tool_ocr import OCRTool


def build_tool_manager(*, milvus_client: Any = None, es_client: Any = None) -> ToolManager:
    tm = ToolManager()

    # Retrieval tools
    tm.register(TextSemanticTool())
    tm.register(OCRTool())

    return tm
