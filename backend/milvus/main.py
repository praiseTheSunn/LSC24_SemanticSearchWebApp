from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import numpy as np


import setup

app = FastAPI(
    docs_url = "/docs", 
    redoc_url = "/redoc",
)

# Setup CORS policy for FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# Define Pydantic model for the request body
class SearchRequest(BaseModel):
    model: str
    embedding: List[List[float]]
class GetRequest(BaseModel):
    collection_name: str
    ids: List[str]

# Include the routes
@app.post("/search_milvus")
async def search_milvus(data: SearchRequest):
    milvus_collection = data.model + "_"
    text_embedding = data.embedding
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    response = setup.milvus_client.search(collection_name=milvus_collection, data=text_embedding, limit=1000)

    return JSONResponse(content={"response": response}, headers=header)



@app.post("/get_embeddings")
async def get_embeddings(data: GetRequest):
    collection_name = data.collection_name
    ids = data.ids
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    raw_results = setup.milvus_client.get(
        collection_name = collection_name,
        ids = ids
    )
    response = {
        'urls': [raw_results[i]['url'] for i in range(len(raw_results))],
        'embeddings': [np.array(raw_results[i]['embedding']).tolist() for i in range(len(raw_results))]
    }

    # debug
    print("Urls: ", response['urls'])

    return JSONResponse(content={"response": response}, headers=header)