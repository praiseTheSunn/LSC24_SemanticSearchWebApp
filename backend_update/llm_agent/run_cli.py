# run_cli.py
import asyncio
from agent.graph import build_graph
from tools.bootstrap import build_tool_manager

async def main():
    tool_manager = build_tool_manager(milvus_client=None, es_client=None)
    graph = build_graph(tool_manager)

    session_id = "demo-session"
    config = {"configurable": {"thread_id": session_id}}

    print("Chatbot ready. Type 'help'. Ctrl+C to exit.\n")

    while True:
        user = input("You: ").strip()
        out = await graph.ainvoke({"user_text": user}, config=config)
        print("\nBot:\n" + out.get("reply", "") + "\n")

if __name__ == "__main__":
    asyncio.run(main())