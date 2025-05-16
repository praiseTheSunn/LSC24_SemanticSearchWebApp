from fastapi import status, HTTPException
from schemas.request_schemas import QueryClause, QueryStructured
from internal.search.temporal import expand_temporal, aggregate_temporal
from internal.api_handler import compute_image_embedding, compute_text_embedding, search_milvus
from internal.postprocess import prepare_response

import sys
sys.path.append("..")
from dataset.dataset_manager import DatasetManager


async def search_structure(query_clause: QueryClause, dataset: str, model: str, subset_record_ids: list[str] = []):

    text = query_clause.text
    filters = query_clause.filters

    text_embedding = await compute_text_embedding(text, model)
    if text_embedding is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compute text embedding.",
        )
    else:
        result = await search_milvus(
            embedding=text_embedding, 
            dataset=dataset, 
            model=model, 
            filters=filters,
            subset_record_ids=subset_record_ids
        )
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to search in Milvus.",
            )
        else:
            return result
        
    # TODO: more filters



async def search_by_image(image_base64: str, dataset: str, model: str, subset_record_ids: list[str] = []):
    image_embedding = await compute_image_embedding(image_base64, model)
    if image_embedding is None:
        return "Failed to compute text embedding.", status.HTTP_500_INTERNAL_SERVER_ERROR
    else:
        result = await search_milvus(
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
        result = await search_structure(query_structured.clauses[0], query_structured.dataset, query_structured.model, query_structured.subset_record_ids)
        if len(query_structured.clauses) > 1:
            result = expand_temporal(result, query_structured.clauses[1], query_structured.dataset, query_structured.temporal_window_size)
    else:
        partial_results = [await search_structure(clause, query_structured.dataset, query_structured.model, query_structured.subset_record_ids) for clause in query_structured.clauses]
        result = aggregate_temporal(partial_results, query_structured.dataset)

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