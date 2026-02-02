from fastapi import status, HTTPException
from schemas.request_schemas import QueryClause, QueryStructured
from internal.search.temporal import expand_temporal, aggregate_temporal
from internal.api_handler import compute_image_embedding, compute_text_embedding, search_dense, search_ocr
from internal.postprocess import prepare_response

from dataset.dataset_manager import DatasetManager


from fastapi import HTTPException, status
from typing import Any, Optional

async def search_structure(
    query_clause: QueryClause,
    dataset: str,
    model: str,
    subset_record_ids: Optional[list[str]] = None,
):
    """
    - Allow blank text query OR blank OCR query, but not both.
    - If both result lists exist, merge by record_id:
        combined = 0.5 * dense_norm + 0.5 * ocr_norm
      where each score list is min-max normalized to [0, 1].
    """
    if subset_record_ids is None:
        subset_record_ids = []

    text = (query_clause.text or "").strip()
    filters = query_clause.filters or {}
    ocr_query = (filters.get("ocr") or "").strip()

    # allow blank text OR blank ocr, but not both
    if not text and not ocr_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either text query or OCR query must be provided (at least one non-blank).",
        )

    # ---------- helpers ----------
    def _get_record_id(item: Any) -> str:
        if isinstance(item, dict):
            return item["record_id"]
        return getattr(item, "record_id")

    def _get_score(item: Any) -> float:
        if isinstance(item, dict):
            return float(item["score"])
        return float(getattr(item, "score"))

    def _set_score(item: Any, value: float) -> Any:
        if isinstance(item, dict):
            item["score"] = float(value)
            return item
        setattr(item, "score", float(value))
        return item

    def _normalize_map(record_ids: list[str], scores: list[float]) -> dict[str, float]:
        """Min-max normalize to [0,1]. If all equal -> all 1.0. Returns {record_id: norm_score}."""
        if not record_ids:
            return {}
        if len(record_ids) != len(scores):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Search result format error: record_ids and scores length mismatch.",
            )
        mn, mx = min(scores), max(scores)
        if mx == mn:
            return {rid: 1.0 for rid in record_ids}
        denom = mx - mn
        return {rid: (float(s) - mn) / denom for rid, s in zip(record_ids, scores)}

    # ---------- run searches conditionally ----------
    result_dense = {"record_ids": [], "scores": []}
    result_ocr = {"record_ids": [], "scores": []}

    if text:
        text_embedding = await compute_text_embedding(text, model)
        if text_embedding is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to compute text embedding.",
            )
        result_dense = await search_dense(
            embedding=text_embedding,
            dataset=dataset,
            model=model,
            filters=filters,
            subset_record_ids=subset_record_ids,
        )
        if result_dense is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to search in Milvus.",
            )

    if ocr_query:
        result_ocr = await search_ocr(
            ocr_query=ocr_query,
            dataset=dataset,
            top_k=500,
        ) or {"record_ids": [], "scores": []}

    dense_ids = result_dense.get("record_ids", []) or []
    dense_scores = result_dense.get("scores", []) or []
    ocr_ids = result_ocr.get("record_ids", []) or []
    ocr_scores = result_ocr.get("scores", []) or []
    print("\n[main] Search results:")
    print(f"Dense: {len(dense_ids)} records")
    print(f"OCR: {len(ocr_ids)} records")
    print(f"Top 5 dense IDs: {dense_ids[:5]}")
    print(f"Top 5 OCR IDs: {ocr_ids[:5]}")
    print()
    
    # ---------- merge ----------
    # Only one source available -> return normalized scores in the same structure
    if dense_ids and not ocr_ids:
        dense_norm = _normalize_map(dense_ids, dense_scores)
        out_ids = list(dense_ids)
        out_scores = [dense_norm[rid] for rid in out_ids]
        return {"record_ids": out_ids, "scores": out_scores}

    if ocr_ids and not dense_ids:
        ocr_norm = _normalize_map(ocr_ids, ocr_scores)
        out_ids = list(ocr_ids)
        out_scores = [ocr_norm[rid] for rid in out_ids]
        return {"record_ids": out_ids, "scores": out_scores}

    # Both lists exist -> merge on record_id with 0.5/0.5 weights
    dense_norm = _normalize_map(dense_ids, dense_scores)
    print(ocr_scores)
    ocr_norm = _normalize_map(ocr_ids, ocr_scores)
    print(ocr_norm)

    # preserve some ordering signal: start from dense order, then append ocr-only ids
    union_ids: list[str] = []
    seen = set()
    for rid in dense_ids:
        if rid not in seen:
            union_ids.append(rid)
            seen.add(rid)
    for rid in ocr_ids:
        if rid not in seen:
            union_ids.append(rid)
            seen.add(rid)

    merged_pairs = []
    for rid in union_ids:
        d = dense_norm.get(rid, 0.0)
        o = ocr_norm.get(rid, 0.0)
        merged_pairs.append((rid, 0.5 * d + 0.5 * o))

    # sort by combined score desc
    merged_pairs.sort(key=lambda x: x[1], reverse=True)

    return {
        "record_ids": [rid for rid, _ in merged_pairs],
        "scores": [score for _, score in merged_pairs],
    }


async def search_by_image(image_base64: str, dataset: str, model: str, subset_record_ids: list[str] = []):
    image_embedding = await compute_image_embedding(image_base64, model)
    if image_embedding is None:
        return "Failed to compute image embedding.", status.HTTP_500_INTERNAL_SERVER_ERROR
    else:
        result = await search_dense(
            embedding=image_embedding, 
            dataset=dataset,
            filters={},
            model=model, 
            subset_record_ids=subset_record_ids
        )
        if result is None:
            return "Failed to search in Milvus.", status.HTTP_500_INTERNAL_SERVER_ERROR
        else:
            return result, status.HTTP_200_OK  
        
    # TODO: more filters



async def search_by_text(query_structured: QueryStructured):
    print("Searching for query:")
    print(query_structured)

    if query_structured.use_temporal_window:
        THRESHOLD = 0.05
        result = await search_structure(query_structured.clauses[0], query_structured.dataset, query_structured.model, query_structured.subset_record_ids)
        if len(query_structured.clauses) > 1:
            result = await expand_temporal(result, query_structured.clauses[1], query_structured.dataset, query_structured.temporal_window_size, THRESHOLD)
    else:
        partial_results = [await search_structure(clause, query_structured.dataset, query_structured.model, query_structured.subset_record_ids) for clause in query_structured.clauses]
        if len(query_structured.clauses) == 1:
            result = partial_results[0]
        else:
            # Aggregate the results
            print(f"Aggregating {len(partial_results)} partial results...")
            result = aggregate_temporal(partial_results, query_structured.dataset, query_structured.top_k)

    return result, status.HTTP_200_OK
        


    # text_embeddings = []
    # if text_query:
    #     if "|" in text_query:
    #         print("Temporal query detected. Splitting...\n")
    #         clauses = text_query.split("|")[:2]
    #         for clause in clauses:
    #             print(f"Computing embedding for clause: {clause}\n")
    #             data["text_query"] = clause
    #             response = requests.post(API_TEXT_EMBEDDING, json=data)
    #             if response.status_code == 200:
    #                 text_embedding = response.json()["text_embedding"]
    #                 text_embeddings.append(text_embedding)
    #     else:
    #         print("Single query detected.\n")
    #         print(f"Computing embedding for query: {text_query}\n")
    #         response = requests.post(API_TEXT_EMBEDDING, json=data)
    #         if response.status_code == 200:
    #             text_embedding = response.json()["text_embedding"]
    #             text_embeddings.append(text_embedding)
    
    # Mode: semantic, objects
    if mode == "vec":
        results_semantic = search_semantic_temporal(dataset, model, text_embeddings) if text_query else None
        record_ids_semantic = results_semantic["record_ids"] if results_semantic else []
        results_objects = search_objects(dataset, object_local_encoding, color_local_encoding, pose_local_encoding, subset=record_ids_semantic) if (object_local_encoding or color_local_encoding or pose_local_encoding) else None 
        combined = get_combined_scores([results_semantic, results_objects], 'inner')
        if len(text_embeddings) > 1:
            return prepare_response(dataset, combined["record_ids"], combined["scores"], window_size=window_size, temporal_query=True), status.HTTP_200_OK
        else:
            return prepare_response(dataset, combined["record_ids"], combined["scores"], window_size=window_size), status.HTTP_200_OK
    
    # Mode: semantic, keywords, objects
    if mode == "vec_kw":
        results_semantic = search_semantic_temporal(dataset, model, text_embeddings) if text_query else None 
        record_ids_semantic = results_semantic["record_ids"] if results_semantic else []
        results_keywords = search_keywords_temporal(dataset, text_query, subset=record_ids_semantic) if text_query else None
        record_ids_keywords = results_keywords["record_ids"] if results_keywords else []
        results_objects = search_objects(dataset, object_local_encoding, color_local_encoding, pose_local_encoding, subset=record_ids_keywords) if (object_local_encoding or color_local_encoding or pose_local_encoding) else None   
        combined = get_combined_scores([results_semantic, results_keywords, results_objects], 'inner')
        if len(text_embeddings) > 1:
            return prepare_response(dataset, combined["record_ids"], combined["scores"], window_size=window_size, temporal_query=True), status.HTTP_200_OK
        else:
            return prepare_response(dataset, combined["record_ids"], combined["scores"], window_size=window_size), status.HTTP_200_OK

    # Mode: keywords, objects
    if mode == "kw":
        results_keywords = search_keywords_temporal(dataset, text_query) if text_query else None
        # results_keywords = search_semantic_temporal_new(dataset, model, text_embeddings) if text_query else None
        record_ids_keywords = results_keywords["record_ids"] if results_keywords else []
        results_objects = search_objects(dataset, object_local_encoding, color_local_encoding, pose_local_encoding, subset=record_ids_keywords) if (object_local_encoding or color_local_encoding or pose_local_encoding) else None   
        combined = get_combined_scores([results_keywords, results_objects], 'inner')
        if len(text_embeddings) > 1:
            return prepare_response(dataset, combined["record_ids"], combined["scores"], window_size=window_size, temporal_query=True), status.HTTP_200_OK
        else:
            return prepare_response(dataset, combined["record_ids"], combined["scores"], window_size=window_size), status.HTTP_200_OK
    
    else:
        return response.text, response.status_code