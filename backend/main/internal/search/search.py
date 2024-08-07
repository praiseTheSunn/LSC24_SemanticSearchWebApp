import setup
import requests
import numpy as np
from schemas.request_schemas import RequestSearchByTextQuery
import internal.search.scorer.combine_score as combine_score
from internal.search.search_components import *
from internal.prepare_response import prepare_response


def search_with_text_query(data: RequestSearchByTextQuery):

    # Necessary data
    model = data.model
    text_query = data.text_query
    mode = data.mode

    # Make the POST request
    print("Searching with text query:", text_query)
    print("Making request to text embedding service...")
    response = requests.post("http://localhost:8002/embedding/text", json=data.dict())

    # Check response status
    if response.status_code == 200:
        text_embedding = response.json()["text_embedding"]
        if model == "stfm":                                             # text embedding must be at format [[]], but 'stfm' model returns [] so I have to wrap it
            text_embedding = [text_embedding]
    
        # Mode: semantic
        if mode == "smt":
            results_semantic = search_semantic(model, text_embedding)  
            return prepare_response(results_semantic["urls"], results_semantic["scores"])
        
        # Mode: semantic x datetime
        if mode == "smt-dtout":
            results_semantic = search_semantic(model, text_embedding)   
            results_datetime = search_datetime(text_query)
            combined = combine_score.get_combined_scores_datetime([results_semantic], results_datetime)
            return prepare_response(combined["urls"], combined["scores"])

        # Mode: semantic + multimatch (datetime included)
        if mode == "smt-mm-dtin":
            results_semantic = search_semantic(model, text_embedding)
            results_multimatch_datetime = search_multimatch_datetime(text_query)
            print(f"Metadata search scores: {results_multimatch_datetime['scores'][:20]}")
            combined = combine_score.get_combined_scores([results_semantic, results_multimatch_datetime])
            return prepare_response(combined["urls"], combined["scores"])
        
        # Mode: (semantic + multimatch) x datetime
        if mode == "smt-mm-dtout":
            results_semantic = search_semantic(model, text_embedding)
            results_multimatch = search_multimatch(text_query)
            results_datetime = search_datetime(text_query)
            combined = combine_score.get_combined_scores_datetime([results_semantic, results_multimatch], results_datetime)
            return prepare_response(combined["urls"], combined["scores"])
        
        # Mode: semantic + 3 matches (datetime included)
        if mode == "smt-3m-dtin":
            results_semantic = search_semantic(model, text_embedding)
            results_3match_datetime = search_3match_datetime(text_query)
            combined = combine_score.get_combined_scores([results_semantic, results_3match_datetime])
            return prepare_response(combined["urls"], combined["scores"])
        
        # Mode: (semantic + 3 matches) x datetime
        if mode == "smt-3m-dtout":
            results_semantic = search_semantic(model, text_embedding)
            results_objects_tags = search_match_objects_tags(text_query)
            results_place = search_match_place(text_query)
            results_caption = search_match_caption(text_query)
            results_datetime = search_datetime(text_query)
            combined = combine_score.get_combined_scores_datetime([results_semantic, results_objects_tags, results_place, results_caption], results_datetime)
            return prepare_response(combined["urls"], combined["scores"])
        
        return None
    
    else:
        print("Error:", response.status_code, response.text)
        return None