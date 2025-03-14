from fastapi import APIRouter
from fastapi.responses import JSONResponse
from schemas import SearchRequest, SearchRequestForLSC
from internal import search as search_internal

router = APIRouter(prefix="/search", tags=["Search"])

@router.post("/search_milvus")
async def search_milvus(data: SearchRequest):
    response = search_internal.search_milvus(data)
    return JSONResponse(content={"response": response}, headers={'Access-Control-Allow-Origin': '*'})
    
