from agent.types import ChatState

def help_node(state: ChatState) -> ChatState:
    state["reply"] = (
        "Usage:\n"
        "- Send a query → I draft a plan.\n"
        "- Send refinements → I update the draft.\n"
        "- Reply 'approve' → I execute and return top-K.\n"
        "- Reply 'reject' → discard the draft.\n"
    )
    state["messages"].append({"role": "assistant", "content": state["reply"]})
    return state