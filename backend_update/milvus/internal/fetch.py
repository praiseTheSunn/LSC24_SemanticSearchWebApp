import setup
import numpy as np
from pprint import pprint


def convert_floats(obj):
    """Recursively convert all np.float32 (or other non-serializable types) to Python float."""
    if isinstance(obj, dict):
        return {k: convert_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats(i) for i in obj]
    elif isinstance(obj, (np.float32, np.float64)):
        return float(obj)
    else:
        return obj
    

def convert_key(key: str):
    if key.startswith("text_"):
        return key[5:]
    else:
        return key
    

def fetch_metadata(collection_name: str, record_ids: list):
    if not record_ids:
        return []

    results = setup.milvus_client.get(
        collection_name=collection_name,
        ids=record_ids,
        output_fields=None  # Set to None to retrieve all fields
    )


    serialized_results = sorted([
        {convert_key(key): convert_floats(hit.get(key)) for key in hit if key != "embedding"}
        for hit in results
    ], key=lambda x: record_ids.index(x.get("record_id")))

    print(f"Record IDs before mapping: {record_ids[:10]}")
    print(f"Record IDs after mapping: {[rec['record_id'] for rec in serialized_results[:10]]}")

    return serialized_results


def fetch_embeddings(collection_name: str, record_ids: list):
    raw_results = setup.milvus_client.get(
        collection_name=collection_name,
        ids=record_ids
    )

    results = {
        'record_ids': [raw_results[i]['record_id'] for i in range(len(raw_results))],
        'embeddings': [np.array(raw_results[i]['embedding']).tolist() for i in range(len(raw_results))]
    }
    return results
