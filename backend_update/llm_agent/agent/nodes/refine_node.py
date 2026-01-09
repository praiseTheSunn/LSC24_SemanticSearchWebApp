from agent.types import ChatState
from agent.plan import build_plan, edit_plan, render_plan

def refine_node(state: ChatState) -> ChatState:
    ref = state.get("user_text", "")
    plan = state.get("active_plan") or build_plan(ref, state)
    plan2 = edit_plan(plan, ref)
    state["active_plan"] = plan2
    state["plan_status"] = "draft"
    state["last_results"] = []  # Clear previous results
    state["reply"] = render_plan(plan2)
    state["messages"].append({"role": "assistant", "content": state["reply"]})
    return state
