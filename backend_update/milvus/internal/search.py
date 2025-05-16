import setup
from pprint import pprint
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


def search_milvus(collection_name: str, text_embedding: list, filters: dict, limit: int, subset_record_ids: list):

    dataset_name = "_".join(collection_name.split("_")[:-1])
    dataset = DatasetManager.get_dataset(dataset_name)
    reqs = []
    expr_list = []

    # Add expr
    if filters:
        for field, value in filters.items():
            if field not in dataset.get_full_text_fields():
                if isinstance(value, str):
                    expr_list.append(f"{field} LIKE '{value}'")
                else:
                    expr_list.append(f"{field} LIKE {value}")
    expr = " and ".join(expr_list)
    print(f"Filter expression: {expr}")

    # Add dense search request
    search_param_dense = {
        "data": text_embedding,
        "anns_field": "embedding",
        "param": {
            "metric_type": "IP",
        },
        "expr": expr,
        "limit": limit
    }
    reqs.append(AnnSearchRequest(**search_param_dense))

    # Add sparse search request
    if filters:
        for field in filters:
            if field in dataset.get_full_text_fields():
                search_param_sparse = {
                    "data": [filters[field]],
                    "anns_field": f"sparse_{field}",
                    "param": {
                        "metric_type": "BM25",
                        "params": {"drop_ratio_build": 0.0}
                    },
                    "expr": expr,
                    "limit": limit
                }
                reqs.append(AnnSearchRequest(**search_param_sparse))
                
    dense_weight = 0.6
    sparse_weight = (1 - dense_weight) / len(reqs[1:]) if len(reqs) > 1 else 0
    ranker = WeightedRanker(dense_weight, *[sparse_weight] * (len(reqs) - 1))
    
    results = setup.milvus_client.hybrid_search(
        collection_name=collection_name, reqs=reqs, ranker=ranker, limit=limit, output_fields=["record_id"]
    )[0]

    serialized_results = [
        {
            "record_id": hit.get("record_id"),
            "distance": hit.get("distance"),
        }
        for hit in results
    ]
    pprint(f"First 5 search results: {serialized_results[:5]}")
    return serialized_results