from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal.explore import explore
from internal.postprocess import prepare_response
from schemas.request_schemas import RequestExploreSimilarImages, RequestExploreNeighborImages
from schemas.response_schemas import ResponseURLs, ResponseEmbeddings

import sys
sys.path.append("..")
from dataset.dataset_manager import DatasetManager


router = APIRouter(
    prefix = '/explore',
    tags = ['explore'],
)


@router.post("/explore_similar_images", response_model=ResponseURLs)
async def explore_similar_images(payload: RequestExploreSimilarImages):
    inputs = payload.model_dump()
    image_ids = [DatasetManager.get_dataset(inputs["dataset"]).standardize_image_id(url) for url in inputs["image_urls"]]
    record_ids = [DatasetManager.get_dataset(inputs["dataset"]).image_id_to_record_id[image_id] for image_id in image_ids]

    response_data, response_status = await explore.explore_similar_images(record_ids=record_ids, dataset=inputs["dataset"], model=inputs["model"])
    response_data = await prepare_response(inputs["dataset"], inputs["model"], response_data["record_ids"], scores=response_data["scores"], display_window_size=inputs["display_window_size"])

    return JSONResponse(content={"response": response_data}, status_code=response_status, headers={'Access-Control-Allow-Origin': '*'})


@router.post("/explore_neighbor_images", response_model=ResponseURLs)
async def explore_neighbor_images(payload: RequestExploreNeighborImages):
    inputs = payload.model_dump()
    image_id = DatasetManager.get_dataset(inputs["dataset"]).standardize_image_id(inputs["image_url"])
    record_id = DatasetManager.get_dataset(inputs["dataset"]).image_id_to_record_id[image_id]
    
    response_data, response_status = await explore.explore_neighbor_images(record_id=record_id, span=inputs["span"], dataset=inputs["dataset"])
    response_data = await prepare_response(inputs["dataset"], "default", response_data["record_ids"], display_window_size=inputs["display_window_size"])      # model=default for not retrieving data from Milvus

    return JSONResponse(content={"response": response_data}, status_code=response_status, headers={'Access-Control-Allow-Origin': '*'})


# @router.post("/fetch_embeddings", response_model=ResponseEmbeddings)
# async def fetch_embeddings(data: RequestExploreSimilarImages):
#     header = {
#         'Access-Control-Allow-Origin': '*'
#     }
#     embeddings = helper.fetch_embeddings(data)
#     return JSONResponse(content={"embeddings": embeddings}, headers=header)
