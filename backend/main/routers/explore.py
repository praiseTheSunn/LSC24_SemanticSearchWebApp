from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal import helper
from internal.explore import explore
from schemas.request_schemas import RequestExploreSimilarImages, RequestExploreNeighborImages
from schemas.response_schemas import ResponseURLs, ResponseEmbeddings

router = APIRouter(
    prefix = '/explore',
    tags = ['explore'],
)

@router.post("/explore_similar_images", response_model=ResponseURLs)
async def explore_similar_images(data: RequestExploreSimilarImages):
    print(data.image_urls)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    response = await explore.explore_similar_images(data)
    return JSONResponse(content={"response": response}, headers=header)

@router.post("/explore_neighbor_images", response_model=ResponseURLs)
async def explore_neighbor_images(data: RequestExploreNeighborImages):
    print(data.image_url)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    response = explore.explore_neighbor_images(data)
    return JSONResponse(content={"response": response}, headers=header)

@router.post("/fetch_embeddings", response_model=ResponseEmbeddings)
async def fetch_embeddings(data: RequestExploreSimilarImages):
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    embeddings = await helper.fetch_embeddings(data.image_urls, data.model, data.dataset)
    return JSONResponse(content={"embeddings": embeddings}, headers=header)
