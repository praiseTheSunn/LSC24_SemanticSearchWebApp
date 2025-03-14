from fastapi import APIRouter
from fastapi.responses import JSONResponse
from schemas import GetRequest, GetRequestForLSC
from internal import fetch as fetch_internal

router = APIRouter(prefix="/fetch", tags=["Fetch"])

@router.post("/fetch_embeddings")
async def fetch_embeddings(data: FetchRequest):
    response = fetch_internal.get_embeddings(data)
    return JSONResponse(content={"response": response}, headers={'Access-Control-Allow-Origin': '*'})
