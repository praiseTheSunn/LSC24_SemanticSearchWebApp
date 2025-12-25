from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from schemas import AgentChatRequest, AgentChatResponse, ToolExecutionContext
from tools import ToolManager
from internal.agent_core import LangChainAgentCore
from internal.llm_config import LLMManager
from typing import Dict, Any
import uuid
from datetime import datetime

router = APIRouter(
    prefix="/agent",
    tags=["agent"],
)

# Initialize managers
tool_manager = ToolManager()
llm_manager = LLMManager()
agent_core = LangChainAgentCore()


@router.get("/core/info")
async def get_core_info():
    """Return diagnostic info about the shared LangChainAgentCore instance."""
    try:
        info = {
            "instance_id": id(agent_core),
            "created_at": getattr(agent_core, "created_at", None),
            "memory_present": hasattr(agent_core, "memory") and agent_core.memory is not None,
        }
        return JSONResponse(content={"core": info}, headers={"Access-Control-Allow-Origin": "*"})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to get core info: {str(e)}")


@router.get("/status")
async def get_agent_status():
    """Get agent and LLM status"""
    llm_config = llm_manager.get_config()
    
    # Test LLM connection
    connection_test = llm_manager.test_connection()
    
    return JSONResponse(
        content={
            "agent_status": "active",
            "llm_config": llm_config,
            "llm_connection": connection_test,
            "available_tools": len(tool_manager.tools),
            "timestamp": datetime.now().isoformat()
        },
        headers={'Access-Control-Allow-Origin': '*'}
    )


@router.get("/tools")
async def list_available_tools():
    """List all available tools for the agent"""
    return JSONResponse(
        content={
            "tools": tool_manager.list_tools(),
            "tool_count": len(tool_manager.tools)
        },
        headers={'Access-Control-Allow-Origin': '*'}
    )


@router.post("/chat", response_model=AgentChatResponse)
async def agent_chat(payload: AgentChatRequest):
    """Main chat endpoint using LangChain agent for intelligent responses"""
    try:
        # Process message through LangChain agent
        result = await agent_core.process_message(
            message=payload.message,
            session_id=payload.session_id,
            user_id=payload.user_id
        )
        messages = result.get("messages", [])
        
        if result["success"]:
            return AgentChatResponse(
                session_id=payload.session_id,
                response=result["response"],
                actions=result["actions"],
                memory_updated=True,
                metadata=result["metadata"]
            )
        else:
            return AgentChatResponse(
                session_id=payload.session_id,
                response=result["response"],
                actions=[],
                memory_updated=False,
                metadata={"error": result.get("error")}
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent chat failed: {str(e)}"
        )

@router.get("/conversation/summary")
async def get_conversation_summary(session_id: str):
    """Get a summary of the current conversation"""
    try:
        summary = agent_core.get_conversation_summary(session_id)
        return JSONResponse(
            content={
                "session_id": session_id,
                "summary": summary,
                "timestamp": datetime.now().isoformat()
            },
            headers={'Access-Control-Allow-Origin': '*'}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation summary: {str(e)}"
        )

@router.get("/conversation/{session_id}/messages")
async def get_conversation_messages(session_id: str):
    """Get conversation messages for a session"""
    try:
        messages = agent_core.get_memory_messages(session_id)
        return JSONResponse(
            content={
                "session_id": session_id,
                "messages": [m.content for m in messages if hasattr(m, "content")],
                "message_count": len(messages)
            },
            headers={'Access-Control-Allow-Origin': '*'}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation messages: {str(e)}"
        )

@router.delete("/conversation/{session_id}")
async def clear_conversation(session_id: str):
    """Clear conversation memory for a session"""
    try:
        agent_core.clear_session(session_id)
        return JSONResponse(
            content={
                "session_id": session_id,
                "message": "Conversation memory cleared",
                "timestamp": datetime.now().isoformat()
            },
            headers={'Access-Control-Allow-Origin': '*'}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear conversation: {str(e)}"
        )

@router.post("/execute_tool")
async def execute_tool_directly(tool_name: str, parameters: Dict[str, Any], session_id: str):
    """Direct tool execution endpoint for testing"""
    try:
        context = ToolExecutionContext(
            tool=tool_name,
            parameters=parameters,
            session_id=session_id,
            action_id=str(uuid.uuid4())
        )
        
        result = await tool_manager.execute_tool(tool_name, context)
        
        return JSONResponse(
            content={
                "tool": tool_name,
                "success": result.success,
                "data": result.data,
                "error": result.error,
                "metadata": result.metadata
            },
            headers={'Access-Control-Allow-Origin': '*'}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tool execution failed: {str(e)}"
        )