from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal import embedding
from schemas import TextEmbeddingRequest, ImageEmbeddingRequest


router = APIRouter(
    prefix = '/embedding',
    tags = ['embedding'],
)

@router.post("/text")
async def compute_text_embedding(payload: TextEmbeddingRequest):    
    text_query = payload.text_query
    model = payload.model

    print(f"Computing text embedding using {model}: ", text_query)
    header = { 'Access-Control-Allow-Origin': '*' }
    text_embedding = embedding.compute_text_embedding(text_query, model)
    if text_embedding is None:
        return JSONResponse(status_code=400, content={"error": "Text embedding could not be computed."}, headers=header)
    return JSONResponse(content={"text_embedding": text_embedding.tolist()}, headers={'Access-Control-Allow-Origin': '*'})


@router.post("/image")
async def compute_image_embedding(payload: ImageEmbeddingRequest):
    image_base64 = payload.image_base64
    model = payload.model
    
    print(f"Computing image embedding using {model}")
    header = { 'Access-Control-Allow-Origin': '*' }
    image_embedding = embedding.compute_image_embedding(image_base64, model)
    if image_embedding is None:
        return JSONResponse(status_code=400, content={"error": "Image embedding could not be computed."}, headers=header)
    return JSONResponse(content={"image_embedding": image_embedding.tolist()}, headers={'Access-Control-Allow-Origin': '*'})