from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal import embedding
from pydantic import BaseModel

class Data(BaseModel):
    text_query: str
    model: str


router = APIRouter(
    prefix = '/embedding',
    tags = ['embedding'],
)

@router.post("/text")
async def compute_text_embedding(data: dict):    
    text_query = data["text_query"]
    # model = data["model"]
    model = "clip_v32"
    print(f"Computing text embedding using {model}: ", text_query)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    text_embedding = embedding.compute_embedding(text_query, model)
    if text_embedding is None:
        raise HTTPException(status_code=400, detail="Text embedding could not be computed.")
    return JSONResponse(content={"text_embedding": text_embedding.tolist()}, headers=header)