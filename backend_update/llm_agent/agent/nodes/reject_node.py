from agent.types import ChatState

def reject_node(state: ChatState) -> ChatState:
    state.pop("active_plan", None)
    state["plan_status"] = "empty"
    state["artifacts"] = {}
    state["last_results"] = []
    state["reply"] = "Okay—discarded the draft plan. Send a new query when ready."
    state["messages"].append({"role": "assistant", "content": state["reply"]})
    return state
