from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal import search

router = APIRouter(
    prefix = '/search',
    tags = ['search'],
)

@router.post("/search_with_text_query")
async def search_with_text_query(mode: str, text_query: str):
    print(text_query)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    image_files = search.search_with_text_query(mode, text_query)
    return JSONResponse(content={"image_files": image_files}, headers=header)
