# llm_agent API Reference

This document lists all available API endpoints in the `llm_agent` microservice, together with request/response shapes, example calls, and notes about session and memory usage.

Base URL example: `http://localhost:8000`

## Summary of routers
- `/agent` - main chat and tool endpoints
- `/conversation` - session lifecycle and conversation retrieval
- `/planning` - create and manage execution plans

---

## /agent router

### GET /agent/status
Description: Get agent and LLM status (configuration and connectivity).
Response example:
```json
{
  "agent_status": "active",
  "llm_config": {
    "provider": "...",
    "model": "..."
  },
  "llm_connection": {
    "ok": true
  },
  "available_tools": 5,
  "timestamp": "2025-10-22T..."
}
```

### GET /agent/tools
Description: List available tools for the agent
Response example:
```json
{
  "tools": [
    {"name": "search_text", "description": "..."}
  ],
  "tool_count": 4
}
```

### POST /agent/chat
Description: Main chat endpoint. Send a user message and receive an agent response. Uses session-based memory (pass a unique `session_id`).

Request body (JSON):
```json
{
  "session_id": "your-session-id",
  "message": "Find images of cats in the kitchen",
  "user_id": "optional-user-id"
}
```

Response model: `AgentChatResponse`
Response example:
```json
{
  "session_id": "your-session-id",
  "response": "I found 3 images...",
  "actions": [],
  "plan": null,
  "memory_updated": true,
  "metadata": {}
}
```

### GET /agent/conversation/summary?session_id=...
Description: Return a trimmed conversation summary for the session.

Response example:
```json
{
  "session_id": "your-session-id",
  "summary": "Conversation has 5 messages. Recent topics: searching, images",
  "timestamp": "2025-10-22T..."
}
```

### GET /agent/conversation/{session_id}/messages
Description: Retrieve conversation messages (trimmed by memory limits).

Response example:
```json
{
  "session_id": "your-session-id",
  "messages": [ /* ConversationMessage entries */ ],
  "message_count": 3
}
```

### DELETE /agent/conversation/{session_id}
Description: Clear conversation memory for the session.

Response example:
```json
{
  "session_id": "your-session-id",
  "message": "Conversation memory cleared",
  "timestamp": "2025-10-22T..."
}
```

### POST /agent/execute_tool
Description: Execute a tool directly (useful for testing).

Query parameters (form data or JSON body depending on client):
- `tool_name` (string)
- `parameters` (object)
- `session_id` (string)

Response example:
```json
{
  "tool": "search_text",
  "success": true,
  "data": {...},
  "error": null,
  "metadata": {}
}
```

---

## /conversation router

### POST /conversation/start_session
Description: Start a new conversation session. Returns a new `session_id`.
Query params: `user_id` optional

Response example:
```json
{
  "session_id": "generated-uuid",
  "message": "Conversation session started",
  "session_data": {"session_id":"...","user_id":null,"created_at":"..."}
}
```

### GET /conversation/session/{session_id}/history
Description: Retrieve conversation history for a session (TODO: implement backing store).

Response example:
```json
{"session_id":"...","messages":[],"message_count":0}
```

### DELETE /conversation/session/{session_id}
Description: End a conversation session and cleanup memory.

Response example:
```json
{"session_id":"...","message":"Conversation session ended","status":"completed"}
```

---

## /planning router

### POST /planning/create_plan
Description: Create an execution plan for a high-level goal using the LLM.

Request body:
```json
{
  "session_id": "demo-session",
  "goal": "Find and summarize the top 3 images of cats in the kitchen",
  "constraints": {"optional":"constraints"}
}
```

Response example:
```json
{
  "plan": {
    "plan_id": "...",
    "session_id": "demo-session",
    "goal": "Find and summarize the top 3 images of cats in the kitchen",
    "status": "pending",
    "created_at": "2025-10-22T...",
    "actions": [ /* AgentAction objects */ ],
    "estimated_steps": 3
  },
  "message": "Execution plan created successfully using LLM"
}
```

### GET /planning/plan/{plan_id}/status
Description: Retrieve the status of a plan (TODO: persist plans to memory/storage).

Response example:
```json
{ "plan_id": "...", "status": "pending", "current_step": 0, "total_steps": 3, "progress_percentage": 0.0, "actions": [] }
```

### POST /planning/plan/{plan_id}/execute
Description: Start execution of a plan. (TODO: implement execution worker)

Request body:
```json
{ "plan_id": "...", "session_id": "..." }
```

Response example:
```json
{ "plan_id": "...", "session_id": "...", "status": "executing", "message": "Plan execution started" }
```

### POST /planning/plan/{plan_id}/cancel
Description: Cancel a running plan.

Response example:
```json
{ "plan_id": "...", "status": "cancelled", "message": "Plan execution cancelled" }
```

### POST /planning/create_and_execute
Description: Create a plan for a goal and execute it immediately. Returns the execution results.

Request body:
```json
{
  "session_id": "demo-session",
  "goal": "Find and summarize the top 3 images of cats in the kitchen",
  "constraints": {"optional":"constraints"}
}
```

Response example:
```json
{
  "plan_id": "b1a2c3d4-...",
  "session_id": "demo-session",
  "status": "completed",
  "results": [
    {"action_id":"step-1","tool":"search_text","result":{...}},
    {"action_id":"step-2","tool":"get_metadata","result":{...}}
  ],
  "message": "Plan execution completed"
}
```

---

## How to run locally

From the `backend_update/llm_agent` folder:

```bash
# Create a python virtualenv and install dependencies
python -m venv .venv
source .venv/bin/activate
pip install -e .  # or pip install -r requirements.txt if provided

# Run the service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Visit `http://localhost:8000/docs` for interactive API docs.

---

## Notes and next steps
- Memory persistence (Redis) and plan storage are TODOs. Endpoints exist but backing stores are not implemented yet.
- If you customize prompts or the agent, ensure `thread_id` (session id) is passed to the agent for persistent memory.
- For real-time streaming and plan execution, add a WebSocket endpoint and a worker process.

---

If you want, I can also add example Postman collections or OpenAPI examples. Let me know which format you prefer.
