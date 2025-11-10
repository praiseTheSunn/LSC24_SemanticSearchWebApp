import setup
from pprint import pprint
from pymilvus import (
    AnnSearchRequest,
    WeightedRanker, RRFRanker
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
    dataset_filters = dataset.get_filters()
    reqs = []
    expr_list = []

    # Add expr
    if filters:
        for field, value in filters.items():
            # Not sparse vector -> a normal metadata field -> expr
            if field in dataset_filters and not dataset_filters[field].get("sparse_vector", False):
                if not dataset_filters[field]["lowercase_storing"] and dataset_filters[field]["lowercase_indexing"]:
                    expr_list.append(f"{field}_indexing LIKE '%{value.lower()}%'")
                else:
                    expr_list.append(f"{field} LIKE '%{value}%'")
            # Sparse vector -> leave for later process         
            elif field in dataset_filters and dataset_filters[field].get("sparse_vector", False):
                continue
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
        for field, value in filters.items():            
            if field in dataset_filters and dataset_filters[field].get("sparse_vector", False):
                search_param_sparse = {
                    "data": [filters[field]],
                    "anns_field": f"{field}_sparse",
                    "param": {
                        "metric_type": "BM25",
                        "params": {"drop_ratio_build": 0.0}
                    },
                    "expr": expr,
                    "limit": limit
                }
                reqs.append(AnnSearchRequest(**search_param_sparse))
                
    dense_weight = 0.5
    sparse_weight = (1 - dense_weight) / len(reqs[1:]) if len(reqs) > 1 else 0
    ranker = WeightedRanker(dense_weight, *[sparse_weight] * (len(reqs) - 1))
    print(f"Ranker weights: {ranker._weights}")

    # sparse_weight = 1 / len(reqs) if len(reqs) > 0 else 0
    # ranker = WeightedRanker(*[sparse_weight] * (len(reqs)))
    # print(f"Ranker weights: {ranker._weights}")

    # ranker = WeightedRanker(1)
    # print(f"Ranker weights: {ranker._weights}")
    
    # ranker = RRFRanker(k=60)

    # results = setup.milvus_client.search(
    #     collection_name=collection_name,
    #     anns_field="embedding",
    #     data=text_embedding,
    #     limit=limit,
    #     filter=expr,
    #     search_params={"metric_type": "IP"}
    # )[0]

    # second_results = setup.milvus_client.search(
    #     collection_name=collection_name,
    #     anns_field="embedding",
    #     data=text_embedding,
    #     limit=limit,
    #     search_params={"metric_type": "IP"}
    # )[0]

    
    # Use the requested `limit` instead of a hard-coded value so callers' top_k/limit is respected
    first_results = setup.milvus_client.hybrid_search(
        collection_name=collection_name, reqs=reqs, ranker=ranker, limit=limit, output_fields=["record_id"]
    )[0]

    # second_results = setup.milvus_client.search(
    #     collection_name=collection_name,
    #     anns_field="embedding",
    #     data=text_embedding,
    #     limit=limit,
    #     search_params={"metric_type": "IP"}
    # )[0]


    # create a list called concatenated_results, the first elements are from results, the rest are from second_results (remove duplicates from results)
    concatenated_results = []
    for hit in first_results:
        if hit not in concatenated_results:
            concatenated_results.append(hit)
    # for hit in second_results:
    #     if hit not in concatenated_results:
    #         concatenated_results.append(hit)


    serialized_results = [
        {
            "record_id": hit.get("record_id"),
            "distance": hit.get("distance"),
        }
        for hit in first_results
    ]
    pprint(f"Filters: {filters}")
    pprint(f"First 5 search results: {serialized_results[:5]}")
    pprint(f"Number of results returned: {len(serialized_results)}")
    return serialized_results