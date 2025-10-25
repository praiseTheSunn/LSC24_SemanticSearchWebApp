from typing import Dict, Any, List, Optional, Tuple

# Core LangChain
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage

# Agent creation
from langgraph.prebuilt import create_react_agent
from langchain_community.tools import Tool

# Memory manager
from langgraph.checkpoint.memory import MemorySaver
from langchain_google_genai import ChatGoogleGenerativeAI  # ⬅️ model swap
from langchain_core.messages import trim_messages

from tools import ToolManager
from schemas import (
    AgentAction, AgentPlan, ToolExecutionContext, ToolResult,
    ConversationMessage, ActionStatus, ToolType
)
from internal.llm_config import LLMManager
import json
import uuid
from datetime import datetime

import json
import re
from langchain_core.messages import AIMessage

FENCED_JSON_RE = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)

class LangChainAgentCore:
    """Core LLM agent using LangChain with tool integration"""
    
    def __init__(self):
        self.llm_manager = LLMManager()
        self.tool_manager = ToolManager()
        # Use LangGraph's MemorySaver for persistent, efficient memory
        self.memory = MemorySaver()
        self.memory_limit = 20  # Maximum number of messages to keep in memory
        self._setup_langchain_tools()
        self._setup_agent()
    
    def _setup_langchain_tools(self):
        """Convert our custom tools to LangChain tools"""
        self.langchain_tools = []
        
        # Create LangChain tool wrappers for our custom tools
        for tool_name, tool_instance in self.tool_manager.tools.items():
            # Augment description with parameter schema so LLM knows expected params
            params = getattr(tool_instance, "param_schema", {}) or {}
            params_lines = []
            for k, v in params.items():
                example = v.get("example") if isinstance(v, dict) else None
                ptype = v.get("type") if isinstance(v, dict) else str(type(v))
                params_lines.append(f"- {k} ({ptype}): example={json.dumps(example)}")
            params_text = "\n".join(params_lines) if params_lines else "(no params documented)"
            augmented_description = f"{tool_instance.description}\n\nParameters:\n{params_text}"

            langchain_tool = Tool(
                name=tool_name,
                description=augmented_description,
                func=self._create_tool_wrapper(tool_name)
            )
            self.langchain_tools.append(langchain_tool)
    
    def _create_tool_wrapper(self, tool_name: str):
        """Create a wrapper function for LangChain tools"""
        async def tool_wrapper(tool_input: str) -> str:
            try:
                # Parse tool input (expecting JSON string)
                if isinstance(tool_input, str):
                    try:
                        params = json.loads(tool_input)
                    except json.JSONDecodeError:
                        # If not JSON, treat as simple query
                        params = {"query": tool_input}
                else:
                    params = tool_input
                
                # Create execution context
                context = ToolExecutionContext(
                    tool=tool_name,
                    parameters=params,
                    session_id=params.get("session_id", "default"),
                    action_id=str(uuid.uuid4())
                )
                
                # Execute tool
                result = await self.tool_manager.execute_tool(tool_name, context)
                
                # Return formatted result
                if result.success:
                    return json.dumps({
                        "success": True,
                        "data": result.data,
                        "metadata": result.metadata
                    })
                else:
                    return json.dumps({
                        "success": False,
                        "error": result.error
                    })
                    
            except Exception as e:
                return json.dumps({
                    "success": False,
                    "error": f"Tool execution failed: {str(e)}"
                })
        
        return tool_wrapper
    
    def _setup_agent(self):
        """Setup the LangGraph ReAct agent node (no AgentExecutor, use default prompt)"""
        self.agent_node = create_react_agent(
            model=self.llm_manager.llm,
            tools=self.langchain_tools,
            checkpointer=self.memory,
        )
    
    async def process_message(self, message: str, session_id: str, user_id: str = None) -> Dict[str, Any]:
        """Process a user message and return agent response using LangGraph agent node"""
        try:
            contextualized_message = f"[Session: {session_id}] {message}"
            print(f"Contextualized Message: {contextualized_message}")
            # Run the agent node (LangGraph)
            result = await self.agent_node.ainvoke(
                {"messages": [("user", contextualized_message)]},
                config={"configurable": {"thread_id": session_id}},
            )
            print(f"Result: {result}")
            agent_response = result.get("output", "I'm not sure how to help with that.")
            # LangGraph's create_react_agent returns a dict with 'output' and 'intermediate_steps' (if available)
            intermediate_steps = result.get("intermediate_steps", [])
            actions_taken = self._parse_intermediate_steps(intermediate_steps)
            return {
                "response": agent_response,
                "actions": actions_taken,
                "session_id": session_id,
                "success": True,
                "metadata": {
                    "llm_provider": self.llm_manager.config.provider,
                    "model": self.llm_manager.config.model,
                    "tool_calls": len(actions_taken),
                    "timestamp": datetime.now().isoformat()
                }
            }
        except Exception as e:
            print(f"Error occurred: {str(e)}")
            return {
                "response": f"I encountered an error while processing your request: {str(e)}",
                "actions": [],
                "session_id": session_id,
                "success": False,
                "error": str(e),
                "metadata": {
                    "timestamp": datetime.now().isoformat()
                }
            }
    
    def _parse_intermediate_steps(self, intermediate_steps: List) -> List[Dict[str, Any]]:
        """Parse intermediate steps from agent execution"""
        actions = []
        
        for step in intermediate_steps:
            if len(step) >= 2:
                action, observation = step[0], step[1]
                
                actions.append({
                    "tool": getattr(action, 'tool', 'unknown'),
                    "input": getattr(action, 'tool_input', ''),
                    "output": str(observation),
                    "status": "completed"
                })
        
        return actions

    def extract_plan(self, planning_result):
        """
        planning_result: the dict returned by the agent node (contains 'messages')
        returns: parsed plan (list of step dicts) or raises ValueError
        """
        messages = planning_result.get("messages", [])
        for message in messages:
            print(isinstance(message, AIMessage))
            print()
        
        # 1) find the AIMessage (the model's reply with the plan)
        ai_msg = next((m for m in reversed(messages) if isinstance(m, AIMessage)), None)
        print(f"AI Message: {ai_msg}")
        if ai_msg is None:
            raise ValueError("No AIMessage found in planning_result['messages'].")

        # 2) normalize content to a single string
        if isinstance(ai_msg.content, str):
            text = ai_msg.content
        elif isinstance(ai_msg.content, list):
            # LangChain’s tool-augmented responses often come as a list of segments
            parts = []
            for seg in ai_msg.content:
                # common shape: {"type": "text", "text": "..."}
                if isinstance(seg, dict) and seg.get("type") == "text":
                    parts.append(seg.get("text", ""))
                elif isinstance(seg, str):
                    parts.append(seg)
            text = "\n".join(parts).strip()
        else:
            text = str(ai_msg.content)

        # 3) try to extract fenced JSON first
        m = FENCED_JSON_RE.search(text)
        json_str = m.group(1) if m else text  # fall back to entire text

        # 4) load as JSON
        try:
            plan_obj = json.loads(json_str)
        except json.JSONDecodeError:
            # sometimes models add trailing code fences or prose; try a lighter cleanup
            cleaned = json_str.strip().strip("`").strip()
            plan_obj = json.loads(cleaned)

        # 5) return full object or just the list under "plan"
        return plan_obj.get("plan", plan_obj)

    
    async def create_plan(self, goal: str, session_id: str, constraints: Dict[str, Any] = None) -> AgentPlan:
        """Create an execution plan for a complex goal using LangGraph agent node"""
        try:
            # Build a detailed tools description (name + params) to guide the LLM
            tools_info = self.tool_manager.list_tools()
            tools_lines = []
            for tname, tmeta in tools_info.items():
                desc = tmeta.get("description", "")
                params = tmeta.get("params", {}) or {}
                param_lines = []    
                for pk, pv in params.items():
                    ex = pv.get("example") if isinstance(pv, dict) else None
                    ptype = pv.get("type") if isinstance(pv, dict) else str(type(pv))
                    param_lines.append(f"    - {pk} ({ptype}) example={json.dumps(ex)}")
                params_text = "\n".join(param_lines) if param_lines else "    (no params documented)"
                tools_lines.append(f"- {tname}: {desc}\n{params_text}")

            tools_text = "\n".join(tools_lines)
            print(f"Tools text:\n{tools_text}")
            print()

            # If constraints include an explicit step count, respect it. Otherwise
            # instruct the model to propose a multi-step plan appropriate to the
            # complexity of the goal. We also perform a single re-prompt if the
            # initial plan is overly coarse (only 1 step).
            explicit_steps = None
            if constraints:
                explicit_steps = constraints.get("steps") or constraints.get("n_steps") or constraints.get("num_steps")

            multi_step_instruction = "If you are not given an explicit number of steps, produce a clear multi-step plan (typically 2-3 steps) appropriate to the goal. If the task is simple, include at least 2 steps. Be granular: break down retrieval, filtering, verification, and summary where relevant."

            # Add merge-strategy documentation so the planner can include merge semantics per step
            merge_doc = (
                "Each step should optionally include a `merge` parameter dict to specify how its results "
                "are combined with previous results. The `merge` dict may contain:\n"
                "- strategy: one of 'search', 'rerank', 'filter'\n"
                "  - 'search': the step is a full search (subset_record_ids=[]). Provide `weight` in [0,1] to indicate how much to trust this new search when combining with previous combined scores.\n"
                "  - 'rerank': the step reorders a subset (subset_record_ids = previous result ids). Provide `weight` in [0,1] to indicate mixing between new ordering and previous combined scores (same ids).\n"
                "  - 'filter': the step filters the existing combined list by inspecting only previous ids (subset_record_ids = previous result ids). Provide `threshold` (float) and items with score < threshold in this step are removed from the combined list.\n"
                "Example merge: {\"strategy\": \"search\", \"weight\": 0.7} or {\"strategy\": \"filter\", \"threshold\": 0.4}.\n"
            )

            planning_prompt = f"""
            Create a step-by-step plan to accomplish this goal: {goal}

            Available tools and their parameters (name + types + examples):
            {tools_text}

            Constraints (apply these defaults or include them in the step parameters): {json.dumps(constraints or {})}

            {multi_step_instruction}

            {merge_doc}

            Please provide a structured plan with specific steps and tool usage. Format your response as a JSON object with a top-level key `plan` which is a list of steps. Each step should include: step (int), tool (one of the tool names), and parameters (mapping of parameter names to values). Use parameter names exactly as listed above when possible.
            """

            # Attempt the initial planning call
            result = await self.agent_node.ainvoke(
                {"messages": [("user", planning_prompt)]},
                config={"configurable": {"thread_id": session_id}},
            )

            parsed = self.extract_plan(result)
            print(f"Extracted Plan: {parsed}")
            print()

            # Normalize parsed plan to a list of steps
            if isinstance(parsed, dict):
                # maybe the model returned {"plan": [...]}
                steps = parsed.get("plan") or parsed.get("steps") or []
            elif isinstance(parsed, list):
                steps = parsed
            else:
                steps = []

            # If the plan is only one step and the user didn't require a single
            # step, re-prompt once to ask for a more granular plan.
            if (not explicit_steps) and len(steps) <= 1:
                try:
                    followup_prompt = (
                        "The plan you returned is very short (1 step).\n"
                        "Please expand this plan into more granular, actionable steps (aim for 3-6 steps) and keep the same JSON `plan` format.\n"
                        "If any step needs multiple tools or parameters, break it into sub-steps."
                    )
                    followup_result = await self.agent_node.ainvoke(
                        {"messages": [("user", followup_prompt)]},
                        config={"configurable": {"thread_id": session_id}},
                    )
                    parsed_followup = self.extract_plan(followup_result)
                    if isinstance(parsed_followup, dict):
                        steps_followup = parsed_followup.get("plan") or parsed_followup.get("steps") or []
                    elif isinstance(parsed_followup, list):
                        steps_followup = parsed_followup
                    else:
                        steps_followup = []

                    # Prefer the expanded plan if it has more than one step
                    if len(steps_followup) > len(steps):
                        steps = steps_followup
                except Exception:
                    # If re-prompt fails, keep original steps
                    pass

                print(f"Refined Plan: {steps}")
                print()

            # Merge constraints into each step parameters if provided
            constraints = constraints or {}

            actions: List[AgentAction] = []
            for step in steps:
                tool_name = step.get("tool") or step.get("action") or step.get("tool_name")
                params = step.get("parameters", {}) or {}

                # Merge constraint keys when missing in params (e.g., top_k, dataset)
                for k, v in constraints.items():
                    if k not in params:
                        params[k] = v

                # Try to convert tool name to enum, fallback to a safe default
                try:
                    tool_enum = ToolType(tool_name)
                except Exception:
                    # fallback: use TEXT_SEMANTIC as a generic retrieval tool
                    tool_enum = ToolType.TEXT_SEMANTIC
                    # keep original tool name in params for downstream use
                    params.setdefault("__raw_tool", tool_name)

                action = AgentAction(
                    id=str(uuid.uuid4()),
                    tool=tool_enum,
                    parameters=params,
                    status=ActionStatus.PENDING
                )
                actions.append(action)

            plan_obj = AgentPlan(
                id=str(uuid.uuid4()),
                goal=goal,
                actions=actions,
                status=ActionStatus.PENDING
            )
            return plan_obj
        except Exception as e:
            return AgentPlan(
                id=str(uuid.uuid4()),
                goal=goal,
                actions=[],
                status=ActionStatus.FAILED
            )
    
    def get_conversation_summary(self) -> str:
        """Get a summary of the current conversation, using trimmed memory."""
        try:
            # Retrieve all messages from memory
            all_messages = list(self.memory.values())
            # Flatten and sort by timestamp if needed
            messages = [m for m in all_messages if isinstance(m, dict) and 'content' in m]
            # Use trim_messages to keep only the most recent N messages
            trimmed = trim_messages(messages, self.memory_limit)
            if not trimmed:
                return "No conversation history"
            message_count = len(trimmed)
            recent_topics = []
            for msg in trimmed[-5:]:
                content = msg.get('content', '').lower()
                if "search" in content:
                    recent_topics.append("searching")
                if "explore" in content:
                    recent_topics.append("exploring")
                if "image" in content:
                    recent_topics.append("images")
            return f"Conversation has {message_count} messages. Recent topics: {', '.join(set(recent_topics)) or 'general chat'}"
        except Exception as e:
            return f"Error getting summary: {str(e)}"
    
    def clear_memory(self):
        """Clear conversation memory"""
        self.memory.clear()
    
    def get_memory_messages(self) -> List[Dict[str, Any]]:
        """Get conversation messages from memory, trimmed to memory_limit."""
        try:
            all_messages = list(self.memory.values())
            messages = [m for m in all_messages if isinstance(m, dict) and 'content' in m]
            trimmed = trim_messages(messages, self.memory_limit)
            return trimmed
        except Exception as e:
            return []