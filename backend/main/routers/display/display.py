from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import FileResponse
from internal.explore import explore

router = APIRouter(
    prefix = '/display',
    tags = ['display'],
)

@router.get("/get_image/{image_path: path}")
async def get_image(image_path: str):
    print(image_path)
    header = {
        'Access-Control-Allow-Origin': '*'
    }    
    return FileResponse(image_path, media_type='image/jpeg', headers=header)