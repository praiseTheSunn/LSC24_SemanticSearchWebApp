from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal import explore

router = APIRouter(
    prefix = '/explore',
    tags = ['explore'],
)

@router.post("/exlore_similar_images")
async def exlore_similar_images(image_path: str):
    print(image_path)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    image_files = explore.exlore_similar_images(image_path)
    return JSONResponse(content={"image_files": image_files}, headers=header)

@router.post("/exlore_neighbor_images")
async def exlore_neighbor_images(image_path: str):
    print(image_path)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    num_images = 30
    image_files = explore.exlore_neighbor_images(image_path, num_images)
    return JSONResponse(content={"image_files": image_files}, headers=header)
