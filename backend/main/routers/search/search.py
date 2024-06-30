from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal.search import search
from schemas.request_schemas import RequestSearchByTextQuery
from schemas.response_schemas import ResponseURLs

router = APIRouter(
    prefix = '/search',
    tags = ['search'],
)

@router.post("/search_with_text_query", response_model=ResponseURLs)
async def search_with_text_query(data: RequestSearchByTextQuery):
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    response = search.search_with_text_query(data)
    return JSONResponse(content={"response": response}, headers=header)