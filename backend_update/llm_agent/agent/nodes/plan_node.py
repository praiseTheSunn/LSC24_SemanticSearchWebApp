from tools.manager import ToolManager
from agent.plan import build_plan, render_plan
from agent.types import ChatState

async def plan_node(state: ChatState, tool_manager: ToolManager) -> ChatState:
    q = state.get("user_text", "")
    plan_dict = await build_plan(
        q,
        tool_manager=tool_manager,
        top_k_display=state.setdefault("memory", {}).setdefault("defaults", {}).get("top_k_display", 10),
    )
    state["active_plan"] = plan_dict
    state["plan_status"] = "draft"
    state["last_results"] = []  # Clear previous results
    state["reply"] = render_plan(plan_dict)
    state["messages"].append({"role": "assistant", "content": state["reply"]})
    return state