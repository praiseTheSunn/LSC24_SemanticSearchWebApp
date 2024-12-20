from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from enum import Enum
from typing import List, Optional
import numpy as np


import setup
from setup import dataset_config


app = FastAPI(
    docs_url = "/docs", 
    redoc_url = "/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)


class DatasetOptions(str, Enum):
    option1 = "aic24"
    option2 = "aic24_lesson"
    option3 = "aic24_cooking"
    option4 = "lsc24"
    option5 = "vbs25"
class SearchRequest(BaseModel):
    model: str
    embedding: List[List[float]]
    limit: Optional[int] = 1000
    dataset: Optional[DatasetOptions] = DatasetOptions.option1
class GetRequest(BaseModel):
    collection_name: str
    ids: List[str]
    dataset: Optional[DatasetOptions] = DatasetOptions.option1


# Include the routes
@app.post("/search_milvus")
async def search_milvus(data: SearchRequest):
    dataset = data.dataset
    collection_name = dataset + "_" + data.model
    text_embedding = data.embedding
    limit = data.limit
    print("Milvus limit: ", limit)
    print("Collection_name: ", collection_name)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    response = setup.milvus_client.search(
        collection_name=collection_name, 
        data=text_embedding, 
        limit=limit,
        filter="""url in [
            "L05/L05_V017/0662.webp",
            "L05/L05_V025/0014.webp"
        ]"""
    )
    return JSONResponse(content={"response": response}, headers=header)



@app.post("/get_embeddings")
async def get_embeddings(data: GetRequest):
    collection_name = data.collection_name
    print("Collection_name: ", collection_name)
    ids = data.ids
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    raw_results = setup.milvus_client.get(
        collection_name = collection_name,
        ids = ids
    )
    print("Collection_name: ", collection_name)
    response = {
        'urls': [raw_results[i]['url'] for i in range(len(raw_results))],
        'embeddings': [np.array(raw_results[i]['embedding']).tolist() for i in range(len(raw_results))]
    }

    # debug
    print("Urls: ", response['urls'])

    return JSONResponse(content={"response": response}, headers=header)