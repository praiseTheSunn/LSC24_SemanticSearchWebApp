import setup
import requests
from fastapi import status
from schemas.request_schemas import RequestSearchByTextQuery, RequestSearchByImageQuery
import internal.search.scorer.combine_score as combine_score
from internal.search.search_components import *
from internal.prepare_response import prepare_response


def search_with_image_query(data: RequestSearchByImageQuery):

    model = data.model
    image_base64 = data.image_base64
    dataset = data.dataset

    print("Making request to image embedding service...")
    response = requests.post("http://localhost:8002/embedding/image", json=data.dict())

    if response.status_code == 200:
        image_embedding = response.json()["image_embedding"]
        if model == "stfm":                                             # image embedding must be at format [[]], but 'stfm' model returns [] so I have to wrap it
            image_embedding = [image_embedding]
        
        results_semantic = search_semantic_temporal(dataset, model, [image_embedding])  
        return prepare_response(results_semantic["record_ids"], results_semantic["scores"]), status.HTTP_200_OK            
    else:
        return response.text, response.status_code


def search_with_text_query(data: RequestSearchByTextQuery):

    # Necessary data
    model = data.model
    mode = data.mode
    text_query = data.text_query
    window_size = data.window_size
    dataset = data.dataset
    object_global_encoding = data.object_global_encoding
    object_local_encoding = data.object_local_encoding
    color_global_encoding = data.color_global_encoding
    color_local_encoding = data.color_local_encoding
    pose_local_encoding = data.pose_local_encoding

    # Make the POST request for text embedding
    text_embeddings = []
    if text_query:
        if "|" in text_query:
            print("Temporal query detected. Splitting...\n")
            clauses = text_query.split("|")[:2]
            for clause in clauses:
                print(f"Computing embedding for clause: {clause}\n")
                data.text_query = clause
                response = requests.post("http://localhost:8002/embedding/text", json=data.dict())
                if response.status_code == 200:
                    text_embedding = response.json()["text_embedding"]
                    text_embeddings.append(text_embedding)
        else:
            print("Single query detected.\n")
            print(f"Computing embedding for query: {text_query}\n")
            response = requests.post("http://localhost:8002/embedding/text", json=data.dict())
            if response.status_code == 200:
                text_embedding = response.json()["text_embedding"]
                text_embeddings.append(text_embedding)
    
    # Mode: semantic, objects
    if mode == "vec":
        results_semantic = search_semantic_temporal(dataset, model, text_embeddings) if text_query else None
        record_ids_semantic = results_semantic["record_ids"] if results_semantic else []
        results_objects = search_objects(dataset, object_local_encoding, color_local_encoding, pose_local_encoding, subset=record_ids_semantic) if (object_local_encoding or color_local_encoding or pose_local_encoding) else None   
        combined = combine_score.get_combined_scores([results_semantic, results_objects], 'inner')
        return prepare_response(dataset, combined["record_ids"], combined["scores"], window_size=window_size), status.HTTP_200_OK
    
    # Mode: semantic, keywords, objects
    if mode == "vec_kw":
        results_semantic = search_semantic_temporal(dataset, model, text_embeddings) if text_query else None 
        record_ids_semantic = results_semantic["record_ids"] if results_semantic else []
        results_keywords = search_keywords_temporal(dataset, text_query, subset=record_ids_semantic) if text_query else None
        record_ids_keywords = results_keywords["record_ids"] if results_keywords else []
        results_objects = search_objects(dataset, object_local_encoding, color_local_encoding, pose_local_encoding, subset=record_ids_keywords) if (object_local_encoding or color_local_encoding or pose_local_encoding) else None   
        combined = combine_score.get_combined_scores([results_semantic, results_keywords, results_objects], 'inner')
        return prepare_response(dataset, combined["record_ids"], combined["scores"], window_size=window_size), status.HTTP_200_OK

    # Mode: keywords, objects
    if mode == "kw":
        results_keywords = search_keywords_temporal(dataset, text_query) if text_query else None
        record_ids_keywords = results_keywords["record_ids"] if results_keywords else []
        results_objects = search_objects(dataset, object_local_encoding, color_local_encoding, pose_local_encoding, subset=record_ids_keywords) if (object_local_encoding or color_local_encoding or pose_local_encoding) else None   
        combined = combine_score.get_combined_scores([results_keywords, results_objects], 'inner')
        return prepare_response(dataset, combined["record_ids"], combined["scores"], window_size=window_size), status.HTTP_200_OK
    
    else:
        return response.text, response.status_code