from fastapi import APIRouter
from fastapi.responses import JSONResponse
from schemas import SearchRequest
from internal.search import search_milvus as search_milvus_internal

router = APIRouter(prefix="/search", tags=["Search"])

@router.post("/search_milvus")
async def search_milvus(payload: SearchRequest):
    collection_name = payload.dataset + "_" + payload.model
    text_embedding = payload.embedding
    limit = payload.limit
    subset_record_ids = payload.subset_record_ids
    results = search_milvus_internal(collection_name, text_embedding, limit, subset_record_ids)
    return JSONResponse(content={"response": results}, headers={'Access-Control-Allow-Origin': '*'})
    
