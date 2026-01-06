from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from schemas import MilvusSearchDenseRequest, MilvusSearchSparseRequest, ElasticsearchTextSearchRequest
import setup
from pprint import pprint
from pymilvus import AnnSearchRequest, WeightedRanker

from typing import List, Dict, Any
from dataset.dataset_manager import DatasetManager


router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/search_dense")
def search_dense(payload: MilvusSearchDenseRequest) -> List[Dict[str, Any]]:
    """Perform a dense-vector search against the `embedding` field.

    Returns a list of dicts: {record_id, distance}
    """
    print(f"Payload limit: {payload.limit}")
    print(f"Length of subset_record_ids: {len(payload.subset_record_ids)}")
    results = setup.milvus_client.search(
        collection_name=f"{payload.dataset}_{payload.model}", 
        data=payload.embedding,
        anns_field="embedding",
        limit=payload.limit,
        output_fields=["record_id"],
        filter=f"""record_id IN {payload.subset_record_ids}""" if payload.subset_record_ids else None,
        search_params={
            "metric_type": "IP",
        },
    )[0]
    
    print(f"Number of results from Milvus: {len(results)}")
    serialized_results = [
        {"record_id": hit.get("record_id") or hit.get("id"), "distance": hit.get("distance")} for hit in results
    ]
    print(f"Dense search completed for query <embedding>. Number of results: {len(serialized_results)}")
    return serialized_results


@router.post("/search_ocr")
def search_ocr(payload: ElasticsearchTextSearchRequest) -> List[Dict[str, Any]]:
    """
    Perform a BM25 text search against Elasticsearch over OCR/text fields.

    Returns a list of dicts: {record_id, score}
    """
    print(f"Payload limit: {payload.limit}")
    print(f"Length of subset_record_ids: {len(payload.subset_record_ids)}")
    index_name = f"{payload.dataset}_text" if payload.dataset else "aic25_text"

    # Build ES query
    es_query = {
        "size": payload.limit,
        "_source": ["ocr"],
        "query": {
            "bool": {
                "must": [
                    {
                        "match": {
                            "ocr": {
                                "query": payload.query,
                                "fuzziness": "AUTO",
                                # optional tuning:
                                # "operator": "and",
                                # "prefix_length": 1,
                                # "max_expansions": 50,
                                # "fuzzy_transpositions": True,
                            }
                        }
                    }
                ]
            }
        },
    }

    # Only add filter when subset_record_ids is non-empty
    if payload.subset_record_ids:  # [] / None -> False
        es_query["query"]["bool"]["filter"] = [
            {"ids": {"values": [str(x) for x in payload.subset_record_ids]}}
        ]

    # Execute
    resp = setup.es_client.search(index=index_name, body=es_query)
    hits = resp.get("hits", {}).get("hits", [])

    print(f"Number of results from Elasticsearch: {len(hits)}")
    print(f"Top 20 results:")

    # Serialize like dense search does (record_id + score)
    serialized_results = []
    for h in hits:
        # Prefer stored record_id if available, else ES _id
        record_id = None
        fields = h.get("fields")
        if fields and "record_id" in fields:
            # only if you used "fields" retrieval; we didn't
            record_id = fields["record_id"][0]
        if record_id is None:
            # _id is record_id in our indexing script
            try:
                record_id = int(h.get("_id"))
            except Exception:
                record_id = h.get("_id")

        serialized_results.append(
            {"record_id": record_id, "score": h.get("_score", 0.0)}
        )

    print(f"OCR search completed for query <{payload.query[:50]}>. Number of results: {len(serialized_results)}")
    return serialized_results


@router.post("/search_object_tags")
def search_object_tags(payload: ElasticsearchTextSearchRequest) -> List[Dict[str, Any]]:
    """
    Perform a BM25 text search against Elasticsearch over object_tags fields.

    Returns a list of dicts: {record_id, score}
    """
    print(f"Payload limit: {payload.limit}")
    print(f"Length of subset_record_ids: {len(payload.subset_record_ids)}")
    index_name = f"{payload.dataset}_text" if payload.dataset else "aic25_text"

    # Build ES query
    es_query = {
        "size": payload.limit,
        "_source": ["object_tags"],
        "query": {
            "bool": {
                "must": [
                    {
                        "match": {
                            "object_tags": {
                                "query": payload.query,
                                "fuzziness": "AUTO",
                                # optional tuning:
                                # "operator": "and",
                                # "prefix_length": 1,
                                # "max_expansions": 50,
                                # "fuzzy_transpositions": True,
                            }
                        }
                    }
                ]
            }
        },
    }

    # Only add filter when subset_record_ids is non-empty
    if payload.subset_record_ids:  # [] / None -> False
        es_query["query"]["bool"]["filter"] = [
            {"ids": {"values": [str(x) for x in payload.subset_record_ids]}}
        ]

    # Execute
    resp = setup.es_client.search(index=index_name, body=es_query)
    hits = resp.get("hits", {}).get("hits", [])

    print(f"Number of results from Elasticsearch: {len(hits)}")
    print(f"Top 20 results:")

    # Serialize like dense search does (record_id + score)
    serialized_results = []
    for h in hits:
        # Prefer stored record_id if available, else ES _id
        record_id = None
        fields = h.get("fields")
        if fields and "record_id" in fields:
            # only if you used "fields" retrieval; we didn't
            record_id = fields["record_id"][0]
        if record_id is None:
            # _id is record_id in our indexing script
            try:
                record_id = int(h.get("_id"))
            except Exception:
                record_id = h.get("_id")

        serialized_results.append(
            {"record_id": record_id, "score": h.get("_score", 0.0)}
        )

    print(f"OCR search completed for query <{payload.query[:50]}>. Number of results: {len(serialized_results)}")
    return serialized_results


@router.post("/search_sparse")
def search_sparse(payload: MilvusSearchSparseRequest) -> List[Dict[str, Any]]:
    """Perform a sparse-vector search against a specific sparse field (e.g. 'tags_sparse').

    sparse_vectors should be a list of vectors (one per query). anns_field is the sparse field name.
    Returns list of {record_id, distance}
    """
    # Build a single AnnSearchRequest for the sparse field
    print(f"Payload limit: {payload.limit}")
    print(f"Length of subset_record_ids: {len(payload.subset_record_ids)}")
    results = setup.milvus_client.search(
        collection_name=f"{payload.dataset}_{payload.model}", 
        data=[payload.query],
        anns_field=payload.anns_field,
        limit=payload.limit,
        output_fields=["record_id"],
        filter=f"""record_id IN {payload.subset_record_ids}""" if payload.subset_record_ids else None,
        search_params={
            "metric_type": "BM25",
            "params": {"drop_ratio_build": 0.0}
        },
    )[0]
    
    print(f"Number of results from Milvus: {len(results)}")
    serialized_results = [
        {"record_id": hit.get("record_id") or hit.get("id"), "distance": hit.get("distance")} for hit in results
    ]
    print(f"Sparse search completed for query '{payload.query}' on field {payload.anns_field}. Number of results: {len(serialized_results)}")
    return serialized_results


def apply_filter_only(collection_name: str, filters: Dict[str, Any], limit: int = 100) -> List[Dict[str, Any]]:
    """Apply metadata filters only and return matching record ids.

    This uses Milvus' query API to retrieve records matching the expression.
    """
    # Infer dataset name
    dataset_name = "_".join(collection_name.split("_")[:-1])
    dataset = DatasetManager.get_dataset(dataset_name)
    dataset_filters = dataset.get_filters()

    expr_list = []
    if filters:
        for field, value in filters.items():
            if field in dataset_filters and not dataset_filters[field].get("sparse_vector", False):
                if not dataset_filters[field]["lowercase_storing"] and dataset_filters[field]["lowercase_indexing"]:
                    expr_list.append(f"{field}_indexing LIKE '%{value.lower()}%'")
                else:
                    expr_list.append(f"{field} LIKE '%{value}%'")
            else:
                expr_list.append(f"{field} LIKE {value}")

    expr = " and ".join(expr_list) if expr_list else None
    pprint(f"Filter expression: {expr}")

    if not expr:
        return []

    # Use milvus_client.query to fetch matching rows
    try:
        # Some Milvus clients provide `query(collection_name, expr, output_fields)`
        # We ask for record_id or id field
        results = setup.milvus_client.query(collection_name=collection_name, expr=expr, output_fields=["record_id"], limit=limit)
        serialized = [{"record_id": r.get("record_id") or r.get("id")} for r in results]
        return serialized
    except Exception:
        # Fallback: return empty list if query not supported
        return []


# @router.post("/search_milvus")
# async def search_milvus(payload: SearchRequest):
#     collection_name = payload.dataset + "_" + payload.model
#     # simple dense search wrapper
#     try:
#         results = search_dense(collection_name, payload.embedding[0] if isinstance(payload.embedding, list) and payload.embedding else payload.embedding, limit=payload.limit, subset_record_ids=payload.subset_record_ids)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#     return JSONResponse(content={"response": results}, headers={'Access-Control-Allow-Origin': '*'})


# @router.post("/search_by_ocr")
# async def search_by_ocr(payload: dict):
#     """Search by OCR text using Milvus' filter/query API.

#     Expected payload keys: dataset (str), model (str, optional), ocr_text (str), limit (int optional)
#     Returns: {"response": [{"record_id": ..., "score": ...}, ...]}
#     """
#     dataset = payload.get("dataset")
#     model = payload.get("model", "clips")
#     ocr_text = payload.get("ocr_text") or payload.get("query")
#     limit = int(payload.get("limit", 100))

#     if not dataset or not ocr_text:
#         raise HTTPException(status_code=400, detail="dataset and ocr_text are required")

#     collection_name = f"{dataset}_{model}"

#     # Use apply_filter_only to search OCR stored in metadata fields
#     filters = {"ocr": ocr_text}
#     try:
#         matches = apply_filter_only(collection_name, filters, limit=limit)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#     # convert to simple scored response (score unknown for pure filter)
#     serialized = [{"record_id": r.get("record_id"), "score": 1.0} for r in matches]
#     return JSONResponse(content={"response": serialized}, headers={'Access-Control-Allow-Origin': '*'})

