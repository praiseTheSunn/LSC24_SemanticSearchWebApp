import setup
import numpy as np

def fetch_embeddings(data):
    collection_name = data.collection_name
    ids = data.ids

    raw_results = setup.milvus_client.get(
        collection_name=collection_name,
        ids=ids
    )

    response = {
        'record_ids': [raw_results[i]['keyframe_id'] for i in range(len(raw_results))],
        'embeddings': [np.array(raw_results[i]['embedding']).tolist() for i in range(len(raw_results))]
    }

    return response
