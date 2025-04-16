from fastapi import APIRouter
from fastapi.responses import JSONResponse
from schemas import FetchRequest
from internal.fetch import fetch_embeddings as fetch_embeddings_internal

router = APIRouter(prefix="/fetch", tags=["Fetch"])

@router.post("/fetch_embeddings")
async def fetch_embeddings(payload: FetchRequest):
    collection_name = payload.collection_name
    record_ids = payload.record_ids
    results = fetch_embeddings_internal(collection_name, record_ids)
    return JSONResponse(content={"response": results}, headers={'Access-Control-Allow-Origin': '*'})
