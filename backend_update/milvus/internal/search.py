import setup
from pymilvus import (
    AnnSearchRequest,
    WeightedRanker
)

import sys
sys.path.append("..")
from dataset.dataset_manager import DatasetManager


def search_milvus_hybrid(collection_name: str, text_embedding: list, limit: int, subset_record_ids: list):
    if len(subset_record_ids) > 0:
        results = setup.milvus_client.search(
            collection_name=collection_name,
            data=text_embedding,
            anns_field="embedding",
            filter=f"""id in {subset_record_ids}""",
            limit=limit
        )[0]
    else:
        results = setup.milvus_client.search(
            collection_name=collection_name,
            data=text_embedding,
            anns_field="embedding",
            limit=limit
        )[0]  
    serialized_results = [
        {
            "id": hit.get("id"),
            "distance": hit.get("distance"),
        }
        for hit in results
    ]
    return serialized_results


def search_milvus(collection_name: str, text_embedding: list, limit: int, subset_record_ids: list):

    dataset_name = "_".join(collection_name.split("_")[:-1])

    search_param_dense = {
        "data": text_embedding,
        "anns_field": "embedding",
        "param": {
            "metric_type": "IP",
        },
        "limit": limit
    }
    dense_req = AnnSearchRequest(**search_param_dense)

    search_param_sparse = {
        "data": ["activity"],
        "anns_field": "sparse_activity",
        "param": {
            "metric_type": "BM25",
            "params": {"drop_ratio_build": 0.0}
        },
        "limit": limit
    }
    sparse_req = AnnSearchRequest(**search_param_sparse)
    
    sparse_weight = 0.4
    dense_weight = 0.6
    ranker = WeightedRanker(sparse_weight, dense_weight)
    
    results = setup.milvus_client.hybrid_search(
        collection_name=collection_name, reqs=[sparse_req, dense_req], ranker=ranker, limit=limit, output_fields=["image_id"]
    )[0]

    serialized_results = [
        {
            "id": hit.get("id"),
            "distance": hit.get("distance"),
        }
        for hit in results
    ]
    return serialized_results