import requests
import asyncio
from constants import (
    API_TEXT_EMBEDDING, 
    API_IMAGE_EMBEDDING, 
    API_SEARCH_DENSE,
    API_SEARCH_OCR,
    API_FETCH_EMBEDDINGS, 
    API_FETCH_METADATA
)
from pprint import pprint


async def compute_text_embedding(text_query, model):
    data = {
        "text_query": text_query,
        "model": model
    }

    # Use requests in a thread to avoid blocking the event loop
    resp = await asyncio.to_thread(requests.post, API_TEXT_EMBEDDING, json=data)
    if resp.status_code == 200:
        text_embedding = resp.json().get("text_embedding")
    else:
        text_embedding = None
    return text_embedding


async def compute_image_embedding(image_base64, model):
    data = {
        "image_base64": image_base64,
        "model": model
    }

    resp = await asyncio.to_thread(requests.post, API_IMAGE_EMBEDDING, json=data)
    if resp.status_code == 200:
        image_embedding = resp.json().get("image_embedding")
        if model == "stfm":  # image embedding must be at format [[]], but 'stfm' model returns [] so I have to wrap it
            image_embedding = [image_embedding]
    else:
        image_embedding = None
    return image_embedding



async def search_dense(embedding, dataset, filters, model, limit=500, subset_record_ids=[]):
    data = {
        "embedding": embedding,
        "filters": filters,
        "dataset": dataset,
        "model": model,
        "limit": limit,
        "subset_record_ids": subset_record_ids
    }

    resp = await asyncio.to_thread(requests.post, API_SEARCH_DENSE, json=data, headers={"Content-Type": "application/json"})
    if resp.status_code != 200:
        return None
    else:
        raw_results = resp.json()
        record_ids = [entity.get('record_id') for entity in raw_results]
        scores = [entity.get('distance') for entity in raw_results]
        return {
            "record_ids": record_ids,
            "scores": scores
        }


async def search_ocr(ocr_query, dataset, top_k=100, subset_record_ids=[]):
    data = {
        "query": ocr_query,
        "limit": top_k,
        "dataset": dataset,
        "subset_record_ids": subset_record_ids
    }

    resp = await asyncio.to_thread(requests.post, API_SEARCH_OCR, json=data)
    if resp.status_code != 200:
        return None
    else:
        raw_results = resp.json()
        record_ids = [entity.get('record_id') for entity in raw_results]
        scores = [entity.get('score') for entity in raw_results]
        return {
            "record_ids": record_ids,
            "scores": scores
        }

async def fetch_metadata(record_ids, dataset, model):
    data = {
        "dataset": dataset,
        "model": model,
        "record_ids": record_ids
    }

    resp = await asyncio.to_thread(requests.post, API_FETCH_METADATA, json=data)
    if resp.status_code == 200:
        raw_results = resp.json()
        metadata = raw_results.get("response")
        return metadata
    else:
        return None


async def fetch_embeddings(record_ids, dataset, model):
    data = {
        "collection_name": f"{dataset}_{model}",
        "record_ids": record_ids
    }

    resp = await asyncio.to_thread(requests.post, API_FETCH_EMBEDDINGS, json=data)
    if resp.status_code == 200:
        raw_results = resp.json()
        embeddings = raw_results.get("response", {}).get("embeddings")
        return embeddings
    else:
        return None