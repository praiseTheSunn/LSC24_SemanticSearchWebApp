import json
from pathlib import Path
from pydantic import BaseModel
from typing import List, Any

def save_log(
    log_path: str,
    interaction_type: str,
    payload: BaseModel,
    response: Any,
) -> None:
    
    log_entry = {
        "log_path": log_path,
        "interaction_type": interaction_type,
        "inputs": payload.model_dump()
    }

    if log_entry["interaction_type"] == "FEEDBACK":
        response_data = {
            "like": [r['image_id'] for r in response.get("like", [])],
            "dislike": [r['image_id'] for r in response.get("dislike", [])]
        }
    elif log_entry["interaction_type"] == "SUBMIT":
        response_data = response
    else:
        response_data = {
            "response": [r['image_id'] for r in response]
        }

    log_entry["response"] = response_data

    # Ensure directory exists
    Path(log_path).parent.mkdir(parents=True, exist_ok=True)

    # Append entry as a new line in a JSONL (json lines) format
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
