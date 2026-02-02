from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal.explore import explore
from internal.postprocess import prepare_response
from internal.logger import save_log
from schemas.request_schemas import RequestExploreSimilarImages, RequestExploreNeighborImages
from schemas.response_schemas import ResponseURLs, ResponseEmbeddings
from datetime import datetime
from dataset.dataset_manager import DatasetManager
import pandas as pd

from setup import SYSTEM_CONFIG


router = APIRouter(
    prefix = '/explore',
    tags = ['explore'],
)


@router.post("/explore_similar_images", response_model=ResponseURLs)
async def explore_similar_images(payload: RequestExploreSimilarImages):
    
    inputs = payload.model_dump()
    dataset = inputs["dataset"].value if hasattr(inputs["dataset"], "value") else inputs["dataset"]
    model = inputs["model"].value if hasattr(inputs["model"], "value") else inputs["model"]
    
    if 'image_ids' in inputs.keys() and inputs["image_ids"] is not None:
        record_ids = inputs["image_ids"]

    response_data, response_status = await explore.explore_similar_images(
        record_ids=record_ids, 
        dataset=dataset,
        model=model
    )
    response_data = await prepare_response(
        dataset, 
        model, 
        response_data["record_ids"], 
        scores=response_data["scores"], 
        display_window_size=inputs["display_window_size"]
    )

    save_log(
        log_path=f"./logs/{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}.json",
        interaction_type="EXOLORE_SIMILAR",
        payload=payload,
        response=response_data
    )

    return JSONResponse(content={"response": response_data}, status_code=response_status, headers={'Access-Control-Allow-Origin': '*'})


@router.post("/explore_neighbor_images", response_model=ResponseURLs)
async def explore_neighbor_images(payload: RequestExploreNeighborImages):

    inputs = payload.model_dump()
    record_id = inputs["image_id"]
    
    response_data, response_status = await explore.explore_neighbor_images(record_id=record_id, span=inputs["span"], dataset=inputs["dataset"])
    response_data = await prepare_response(inputs["dataset"], "default", response_data["record_ids"], display_window_size=inputs["display_window_size"])      # model=default for not retrieving data from Milvus
    
    save_log(
        log_path=f"./logs/{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}.json",
        interaction_type="EXPLORE_NEIGHBOR",
        payload=payload,
        response=response_data
    )

    return JSONResponse(content={"response": response_data}, status_code=response_status, headers={'Access-Control-Allow-Origin': '*'})


# @router.post("/fetch_embeddings", response_model=ResponseEmbeddings)
# async def fetch_embeddings(data: RequestExploreSimilarImages):
#     header = {
#         'Access-Control-Allow-Origin': '*'
#     }
#     embeddings = helper.fetch_embeddings(data)
#     return JSONResponse(content={"embeddings": embeddings}, headers=header)
