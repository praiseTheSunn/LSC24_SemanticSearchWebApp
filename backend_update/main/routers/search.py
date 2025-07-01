from fastapi import APIRouter, status, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from internal.search.search import search_by_image, search_by_text
from internal.preprocess import parse_raw_query
from internal.postprocess import prepare_response
from internal.logger import save_log
from schemas.request_schemas import RequestSearchByTextQuery, RequestSearchByImageQuery, QueryClause, QueryStructured
from schemas.response_schemas import ResponseURLs

import sys
sys.path.append("..")
from dataset.dataset_manager import DatasetManager

import logging
from datetime import datetime

router = APIRouter(
    prefix = '/search',
    tags = ['search'],
)



@router.post("/search_with_image_query", response_model=ResponseURLs)
async def search_with_image_query(payload: RequestSearchByImageQuery):
    
    # Extract the parameters from the payload  
    inputs = payload.model_dump()
    inputs["model"] = "clips"           # TEMPORARY FIX: Hardcoded model name for testing purposes
    inputs["dataset"] = "lsc24"         # TEMPORARY FIX: Hardcoded dataset name for testing purposes

    # Search for the image
    response_data, response_status = await search_by_image(image_base64=inputs["image_base64"], dataset=inputs["dataset"], model=inputs["model"])

    # DEBUG
    print(inputs)
    print(response_data)

    # Postprocess the response
    response_data = await prepare_response(inputs["dataset"], inputs["model"], response_data["record_ids"], response_data["scores"], inputs["display_window_size"])

    if response_status == 200:
        data = {
            "status": response_status,
            "message": "Data retrieved successfully",
            "data": response_data
        }
    else:
        data = {
            "status": response_status,
            "message": "Data retrieval failed",
            "error": response_data
        }
    
    
    return JSONResponse(content=data, status_code=response_status, headers={'Access-Control-Allow-Origin': '*'})



@router.post("/search_with_text_query", response_model=ResponseURLs)
async def search_with_text_query(payload: RequestSearchByTextQuery):  

    # Extract the parameters from the payload  
    inputs = payload.model_dump()
    print(inputs.keys())
    if inputs["filters"]:
        for k, v in inputs["filters"].items():
            if k == "location":
                k = "-l"
            elif k == "date":
                k = "-d"
            elif k == "ocr":
                k = "-ocr"
            if v is None or v == "":
                continue
            inputs["text_query"] += f" {k} {v}"

    # Preprocess the query
    filters = DatasetManager.get_dataset(inputs["dataset"]).get_filters()
    parsed = parse_raw_query(inputs["text_query"], filters)
    query_structured = QueryStructured(
        clauses=[QueryClause(**q) for q in parsed],
        dataset=inputs["dataset"],
        model=inputs["model"],
        use_temporal_window=inputs["use_temporal_window"],
        temporal_window_size=inputs["temporal_window_size"],
        display_window_size=inputs["display_window_size"],
        subset_record_ids=inputs["subset_record_ids"],
    )

    if len(query_structured.clauses) > 2:
        return JSONResponse(content={"status": status.HTTP_400_BAD_REQUEST, "message": "Data retrieval failed", "error": "Excessive number of temporal clauses in the query."}, status_code=status.HTTP_400_BAD_REQUEST, headers={'Access-Control-Allow-Origin': '*'})
    
    # Search for each clause
    response_data, response_status = await search_by_text(query_structured)

    # Postprocess the response
    if inputs["use_temporal_window"]:
        response_data = await prepare_response(
            dataset=inputs["dataset"], 
            model=inputs["model"], 
            record_ids=response_data["record_ids"], 
            scores=response_data["scores"], 
            display_window_size=inputs["display_window_size"]
        )
    else:
        response_data = await prepare_response(
            dataset=inputs["dataset"], 
            model=inputs["model"], 
            record_ids=response_data["record_ids"], 
            scores=response_data["scores"], 
            display_window_size=inputs["display_window_size"], 
        )
        
    if response_status == 200:
        data = {"status": response_status, "message": "Data retrieved successfully", "data": response_data}
    else:
        data = {"status": response_status, "message": "Data retrieval failed", "error": response_data}

    save_log(
        log_path=f"./logs/{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}.json",
        interaction_type="SEARCH_TEXT",
        payload=payload,
        response=response_data
    )

    return JSONResponse(content=data, status_code=response_status, headers={'Access-Control-Allow-Origin': '*'})