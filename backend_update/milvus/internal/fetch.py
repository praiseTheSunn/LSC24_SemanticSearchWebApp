import setup
import numpy as np

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
