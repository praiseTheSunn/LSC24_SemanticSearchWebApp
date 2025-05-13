import requests
from constants import API_TEXT_EMBEDDING, API_IMAGE_EMBEDDING, API_SEARCH_MILVUS, API_FETCH_EMBEDDINGS


async def compute_text_embedding(text_query, model):
    data = {
        "text_query": text_query,
        "model": model
    }

    response = requests.post(API_TEXT_EMBEDDING, json=data)
    if response.status_code == 200:
        text_embedding = response.json()["text_embedding"]
    else:
        text_embedding = None
    return text_embedding


async def compute_image_embedding(image_base64, model):
    data = {
        "image_base64": image_base64,
        "model": model
    }

    response = requests.post(API_IMAGE_EMBEDDING, json=data)
    if response.status_code == 200:
        image_embedding = response.json()["image_embedding"]
        if model == "stfm":  # image embedding must be at format [[]], but 'stfm' model returns [] so I have to wrap it
            image_embedding = [image_embedding]
    else:
        image_embedding = None
    return image_embedding



async def search_milvus(embedding, dataset, model, limit=1000, subset_record_ids=[]):
    data = {
        "embedding": embedding,
        "dataset": dataset,
        "model": model,
        "limit": limit,
        "subset_record_ids": subset_record_ids
    }

    response = requests.post(API_SEARCH_MILVUS, json=data, headers={
        "Content-Type": "application/json"
    })
    if response.status_code != 200:
        return None    
    else:
        raw_results = response.json()
        record_ids = [entity['id'] for entity in raw_results['response']]
        scores = [entity['distance'] for entity in raw_results['response']]
        return {
            "record_ids": record_ids,
            "scores": scores
        }
    


async def fetch_embeddings(record_ids, dataset, model):
    data = {
        "collection_name": f"{dataset}_{model}",
        "record_ids": record_ids
    }

    response = requests.post(API_FETCH_EMBEDDINGS, json=data)
    if response.status_code == 200:
        raw_results = response.json()
        embeddings = raw_results["response"]["embeddings"]
        return embeddings
    else:
        return None