from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Literal, Union
from datetime import datetime
from enum import Enum

# ==================== ENUMS ====================

class ToolType(str, Enum):
    TEXT_SEMANTIC = "text_semantic"
    OCR = "ocr"
    ACTIVITY = "activity"
    OBJECT = "object_tags"

class ActionStatus(str, Enum):
    PENDING = "pending"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"

class MemoryType(str, Enum):
    CONVERSATION = "conversation"
    SEARCH = "search"
    CONTEXT = "context"

# ==================== CORE MODELS ====================

class AgentAction(BaseModel):
    id: str = Field(..., description="Unique action identifier")
    tool: ToolType = Field(..., description="Tool to execute")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Tool parameters")
    status: ActionStatus = Field(default=ActionStatus.PENDING, description="Current status")
    result: Optional[Dict[str, Any]] = Field(None, description="Execution result")
    error: Optional[str] = Field(None, description="Error message if failed")
    timestamp: datetime = Field(default_factory=datetime.now)

class AgentPlan(BaseModel):
    id: str = Field(..., description="Unique plan identifier")
    goal: str = Field(..., description="User's goal or intent")
    actions: List[AgentAction] = Field(default_factory=list, description="Planned actions")
    current_step: int = Field(default=0, description="Current execution step")
    status: ActionStatus = Field(default=ActionStatus.PENDING, description="Overall plan status")
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = Field(None)

# ==================== MEMORY MODELS ====================

class ConversationMessage(BaseModel):
    role: Literal["user", "agent", "system"] = Field(..., description="Message role")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.now)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ConversationMemory(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    messages: List[ConversationMessage] = Field(default_factory=list)
    summary: str = Field(default="", description="Conversation summary")
    key_entities: List[str] = Field(default_factory=list, description="Important entities mentioned")
    last_updated: datetime = Field(default_factory=datetime.now)

class SearchMemory(BaseModel):
    user_id: str = Field(..., description="User identifier")
    recent_queries: List[str] = Field(default_factory=list, description="Recent search queries")
    preferred_datasets: List[str] = Field(default_factory=list, description="Preferred datasets")
    preferred_models: List[str] = Field(default_factory=list, description="Preferred models")
    feedback_patterns: Dict[str, List[str]] = Field(default_factory=dict, description="Like/dislike patterns")
    temporal_preferences: str = Field(default="recent_first", description="Temporal ordering preference")
    avg_display_window_size: int = Field(default=20, description="Average display window size")
    last_updated: datetime = Field(default_factory=datetime.now)

class ContextMemory(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    current_goal: str = Field(default="", description="Current user goal")
    active_plan: Optional[AgentPlan] = Field(None, description="Currently executing plan")
    active_filters: Dict[str, Any] = Field(default_factory=dict, description="Active search filters")
    intermediate_results: Dict[str, Any] = Field(default_factory=dict, description="Intermediate results")
    tool_execution_context: Dict[str, Any] = Field(default_factory=dict, description="Tool execution state")
    last_updated: datetime = Field(default_factory=datetime.now)

# ==================== REQUEST SCHEMAS ====================

class AgentChatRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    message: str = Field(..., description="User message")
    user_id: Optional[str] = Field(None, description="User identifier for personalization")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")

class AgentPlanRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    goal: str = Field(..., description="User's goal or intent")
    constraints: Optional[Dict[str, Any]] = Field(None, description="Planning constraints")
    user_id: Optional[str] = Field(None, description="User identifier")

class ExecutePlanRequest(BaseModel):
    plan_id: str = Field(..., description="Plan identifier to execute")
    session_id: str = Field(..., description="Session identifier")

class MemoryStoreRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    memory_type: MemoryType = Field(..., description="Type of memory to store")
    data: Dict[str, Any] = Field(..., description="Memory data to store")

class MemoryRetrieveRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    memory_type: MemoryType = Field(..., description="Type of memory to retrieve")
    user_id: Optional[str] = Field(None, description="User identifier for search memory")

# ==================== RESPONSE SCHEMAS ====================

class AgentChatResponse(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    response: str = Field(..., description="Agent response message")
    actions: List[AgentAction] = Field(default_factory=list, description="Actions taken")
    plan: Optional[AgentPlan] = Field(None, description="Created or updated plan")
    memory_updated: bool = Field(default=False, description="Whether memory was updated")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class PlanStatusResponse(BaseModel):
    plan_id: str = Field(..., description="Plan identifier")
    status: ActionStatus = Field(..., description="Plan status")
    current_step: int = Field(..., description="Current execution step")
    total_steps: int = Field(..., description="Total number of steps")
    actions: List[AgentAction] = Field(..., description="Plan actions with status")
    progress_percentage: float = Field(..., description="Execution progress percentage")

class MemoryResponse(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    memory_type: MemoryType = Field(..., description="Type of memory")
    data: Dict[str, Any] = Field(..., description="Memory data")
    last_updated: datetime = Field(..., description="Last update timestamp")

# ==================== TOOL SCHEMAS ====================

class ToolResult(BaseModel):
    success: bool = Field(..., description="Whether tool execution succeeded")
    data: Optional[Dict[str, Any]] = Field(None, description="Tool result data")
    error: Optional[str] = Field(None, description="Error message if failed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class ToolExecutionContext(BaseModel):
    tool: ToolType = Field(..., description="Tool being executed")
    parameters: Dict[str, Any] = Field(..., description="Tool parameters")
    session_id: str = Field(..., description="Session identifier")
    action_id: str = Field(..., description="Action identifier")
    timestamp: datetime = Field(default_factory=datetime.now)

# ==================== ERROR SCHEMAS ====================

class AgentError(BaseModel):
    error_type: str = Field(..., description="Type of error")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    session_id: Optional[str] = Field(None, description="Session identifier if applicable")
    timestamp: datetime = Field(default_factory=datetime.now)