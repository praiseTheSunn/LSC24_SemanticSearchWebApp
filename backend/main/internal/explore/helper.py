import setup
import numpy as np
import requests
from schemas.request_schemas import RequestExploreSimilarImages

def compute_mean_embedding(embeddings: list[list[float]]):
    embeddings = np.array(embeddings)
    mean_embedding = np.mean(embeddings, axis=0)
    return mean_embedding

def fetch_embeddings(data: RequestExploreSimilarImages):
    image_urls = data.image_urls
    model = data.model
    print("Image urls:", image_urls)

    # image_urls theo thu tu similarity nhung ket qua tra ve cua ham get() lai la thu tu alphabet cua url
    # vi vay can tao map tu url den vi tri cua no trong ket qua tra ve
    image_urls_sorted = sorted(image_urls)
    position_in_result = {}
    for pos, url in enumerate(image_urls_sorted):
        position_in_result[url] = pos

    data = {
        "collection_name": model + "_",
        "ids": image_urls   
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        raw_results = requests.post("http://localhost:8004/get_embeddings", json=data, headers=headers).json()
        response = raw_results['response']
        return response['embeddings'] 
    except:
        return None       
    # vi du lieu nhan duoc la float32 nhung muon serialize de chuyen di phai convert sang float64 -> dung np.array de convert

def explore_similar_embeddings(model: str, image_embedding: list[float]):
    
    data = {
        "model": model,
        "embedding": image_embedding,    
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.post("http://localhost:8004/search_milvus", json=data, headers=headers)
    raw_results = response.json()

    urls = [entity['id'] for entity in raw_results['response'][0]]
    scores = [entity['distance'] for entity in raw_results['response'][0]]
    return {
        "urls": urls,
        "scores": scores,
    }