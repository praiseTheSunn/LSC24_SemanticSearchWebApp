import setup
import requests
from fastapi import status
from schemas.request_schemas import RequestSearchByTextQuery, RequestSearchByImageQuery
import internal.search.scorer.combine_score as combine_score
from internal.search.search_components import *
from internal.prepare_response import prepare_response
from internal.logger import save_log


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
        return prepare_response(results_semantic["ids"], results_semantic["scores"]), status.HTTP_200_OK            
    else:
        return response.text, response.status_code


def search_with_text_query(data: RequestSearchByTextQuery):

    # Necessary data
    user_id = data.user_id
    model = data.model
    mode = data.mode
    text_query = data.text_query
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
        ids_semantic = results_semantic["ids"] if results_semantic else []
        results_objects = search_objects(dataset, object_local_encoding, color_local_encoding, pose_local_encoding, subset=ids_semantic) if (object_local_encoding or color_local_encoding or pose_local_encoding) else None   
        combined = combine_score.get_combined_scores([results_semantic, results_objects], 'inner')
        # log
        semantic_log_info = {
            "jointEmbedding": text_query
        }
        save_log(user_id, "TEXT", [semantic_log_info], combined["ids"])
        return prepare_response(combined["ids"], combined["scores"]), status.HTTP_200_OK
    
    # Mode: semantic, keywords, objects
    if mode == "vec_kw":
        results_semantic = search_semantic_temporal(dataset, model, text_embeddings) if text_query else None 
        ids_semantic = results_semantic["ids"] if results_semantic else []
        results_keywords, field_items = search_keywords_temporal(dataset, text_query, subset=ids_semantic) if text_query else None
        ids_keywords = results_keywords["ids"] if results_keywords else []
        results_objects = search_objects(dataset, object_local_encoding, color_local_encoding, pose_local_encoding, subset=ids_keywords) if (object_local_encoding or color_local_encoding or pose_local_encoding) else None   
        combined = combine_score.get_combined_scores([results_semantic, results_keywords, results_objects], 'inner')

        # log
        semantic_log_info = {
            "jointEmbedding": text_query
        }
        keywords_log_info = {}
        if "ocr" in field_items:
            keywords_log_info["OCR"] = field_items["ocr"]
        if "caption" in field_items:
            keywords_log_info["caption"] = field_items["caption"]
        if "object_tags" in field_items:
            keywords_log_info["localizedObject"] = all_parsers.parse_object_tags(field_items["object_tags"])
        if "location" in field_items:
            keywords_log_info["location"] = field_items["location"]
        if "date" in field_items:
            keywords_log_info["date"] = field_items["date"]
        if "time" in field_items:
            keywords_log_info["time"] = field_items["time"]

        save_log(user_id, "TEXT", [semantic_log_info, keywords_log_info], combined["ids"])
        return prepare_response(combined["ids"], combined["scores"]), status.HTTP_200_OK

    # Mode: keywords, objects
    if mode == "kw":
        results_keywords = search_keywords_temporal(dataset, text_query) if text_query else None
        ids_keywords = results_keywords["ids"] if results_keywords else []
        results_objects = search_objects(dataset, object_local_encoding, color_local_encoding, pose_local_encoding, subset=ids_keywords) if (object_local_encoding or color_local_encoding or pose_local_encoding) else None   
        combined = combine_score.get_combined_scores([results_keywords, results_objects], 'inner')
        return prepare_response(combined["ids"], combined["scores"]), status.HTTP_200_OK


        
        # # Mode: semantic x datetime
        # if mode == "smt-dtout":
        #     results_semantic = search_semantic_temporal(model, text_embedding)   
        #     results_datetime = search_datetime(text_query)
        #     combined = combine_score.get_combined_scores_datetime([results_semantic], results_datetime)
        #     return prepare_response(combined["ids"], combined["scores"]), status.HTTP_200_OK

        # Mode: semantic + multimatch (datetime included)
        if mode == "smt-mm-dtin":
            results_semantic = search_semantic_temporal(model, text_embedding)
            results_keywords = search_keywords_temporal(text_query)
            combined = combine_score.get_combined_scores([results_semantic, results_keywords])
            return prepare_response(combined["ids"], combined["scores"]), status.HTTP_200_OK
        
        # # Mode: (semantic + multimatch) x datetime
        # if mode == "smt-mm-dtout":
        #     results_semantic = search_semantic_temporal(model, text_embedding)
        #     results_multimatch = search_multimatch(text_query)
        #     results_datetime = search_datetime(text_query)
        #     combined = combine_score.get_combined_scores_datetime([results_semantic, results_multimatch], results_datetime)
        #     return prepare_response(combined["ids"], combined["scores"]), status.HTTP_200_OK
        
        # # Mode: semantic + 3 matches (datetime included)
        # if mode == "smt-3m-dtin":
        #     results_semantic = search_semantic_temporal(model, text_embedding)
        #     results_3match_datetime = search_3match_datetime(text_query)
        #     combined = combine_score.get_combined_scores([results_semantic, results_3match_datetime])
        #     return prepare_response(combined["ids"], combined["scores"]), status.HTTP_200_OK
        
        # # Mode: (semantic + 3 matches) x datetime
        # if mode == "smt-3m-dtout":
        #     results_semantic = search_semantic_temporal(model, text_embedding)
        #     results_objects_tags = search_match_object_tags(text_query)
        #     results_place = search_match_location(text_query)
        #     results_caption = search_match_caption(text_query)
        #     results_datetime = search_datetime(text_query)
        #     combined = combine_score.get_combined_scores_datetime([results_semantic, results_objects_tags, results_place, results_caption], results_datetime)
        #     return prepare_response(combined["ids"], combined["scores"]), status.HTTP_200_OK
        
        return [], status.HTTP_200_OK
    
    else:
        return response.text, response.status_code