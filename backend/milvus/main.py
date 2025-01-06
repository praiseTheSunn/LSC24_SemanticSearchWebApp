from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
from schemas import SearchRequest, GetRequest
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


# Include the routes
@app.post("/search_milvus")
async def search_milvus(data: SearchRequest):
    dataset = data.dataset
    collection_name = dataset + "_" + data.model
    text_embedding = data.embedding
    limit = data.limit
    ids = data.ids
    header = {
        'Access-Control-Allow-Origin': '*'
    }

    if ids:
        response = setup.milvus_client.search(
            collection_name=collection_name, 
            data=text_embedding, 
            filter=f"""keyframe_id in {ids}""",
            limit=limit
        )
    else:
        response = setup.milvus_client.search(
            collection_name=collection_name, 
            data=text_embedding, 
            limit=limit
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
    response = {
        'record_ids': [raw_results[i]['keyframe_id'] for i in range(len(raw_results))],
        'embeddings': [np.array(raw_results[i]['embedding']).tolist() for i in range(len(raw_results))]
    }

    # debug
    print("Record IDs: ", response['record_ids'])
    return JSONResponse(content={"response": response}, headers=header)