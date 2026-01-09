import setup
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed


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
    return {
        'record_ids': [r['record_id'] for r in raw_results],
        'embeddings': [np.array(r['embedding']).tolist() for r in raw_results]
    }

def fetch_embeddings_new(collection_name: str, record_ids: list, batch_size=500, max_workers=16):
    # Split into batches
    batches = [record_ids[i:i + batch_size] for i in range(0, len(record_ids), batch_size)]

    all_ids = []
    all_embeddings = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(fetch_embeddings, collection_name, batch) for batch in batches]
        for future in as_completed(futures):
            result = future.result()
            all_ids.extend(result['record_ids'])
            all_embeddings.extend(result['embeddings'])

    return {'record_ids': all_ids, 'embeddings': all_embeddings}
