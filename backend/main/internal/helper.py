from setup import dataset_config, id_mappings
import numpy as np
import requests
import math
from schemas.request_schemas import RequestExploreSimilarImages


def compute_mean_embedding(embeddings: list[list[float]]):
    embeddings = np.array(embeddings)
    mean_embedding = np.mean(embeddings, axis=0)
    return mean_embedding


async def fetch_embeddings(data: RequestExploreSimilarImages):

    # # AIC
    # image_urls = data.image_urls
    # model = data.model
    # if image_urls[0].startswith("http"):
    #     short_image_urls = ["/".join(url.split("/")[4:]) for url in image_urls]
    # else:
    #     short_image_urls = image_urls

    # VBS
    record_ids = data.record_ids
    record_ids = [int(id) for id in record_ids]
    model = data.model
    dataset = data.dataset
    # if record_ids[0].startswith("http"):
    #     # def image_url_to_record_name(url: str):
    #     #     splits = url.split("/")
    #     #     dataset = splits[-3]
    #     #     video_id = splits[-2]
    #     #     frame_id = int(splits[-1].split(".")[0])
    #     #     context_id = math.ceil(frame_id / 16)
    #     #     return f"{dataset}/{video_id}/{context_id:05d}/{frame_id:05d}"
    #     print("Record ids:", record_ids[:3])
    # else:
    #     record_ids = record_ids
    #     print("Record ids:", record_ids[:3])

    # print("Image urls:", image_urls[:3])
    # print("Short image urls:", short_image_urls[:3])

    # image_urls theo thu tu similarity nhung ket qua tra ve cua ham get() lai la thu tu alphabet cua url
    # vi vay can tao map tu url den vi tri cua no trong ket qua tra ve
    # image_urls_sorted = sorted(image_urls)
    # position_in_result = {}
    # for pos, url in enumerate(image_urls_sorted):
    #     position_in_result[url] = pos

    data = {
        "collection_name": f"{dataset}_{model}",
        "ids": record_ids   
    }
    headers = {
        "Content-Type": "application/json"
    }

    print(f"Fetching embeddings for ids: {data['ids']}")
    
    try:
        raw_results = requests.post("http://localhost:8003/get_embeddings", json=data, headers=headers).json()
        response = raw_results['response']
        return response['embeddings'] 
    except:
        return None       
    # vi du lieu nhan duoc la float32 nhung muon serialize de chuyen di phai convert sang float64 -> dung np.array de convert

def explore_similar_embeddings(model: str, dataset: str, image_embedding: list[list[float]], limit: int = 1000):
    data = {
        "model": model,
        "embedding": image_embedding,    
        "limit": limit,
        "dataset": dataset
    }

    headers = {
        "Content-Type": "application/json"
    }    
    response = requests.post("http://localhost:8003/search_milvus", json=data, headers=headers)
    raw_results = response.json()

    record_ids = [entity['id'] for entity in raw_results['response'][0]]
    scores = [entity['distance'] for entity in raw_results['response'][0]]
    return {
        "record_ids": record_ids,
        "scores": scores,
    }