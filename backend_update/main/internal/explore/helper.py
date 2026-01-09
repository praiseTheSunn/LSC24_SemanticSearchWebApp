import numpy as np
from fastapi import status
from internal.api_handler import search_milvus


def compute_mean_embedding(embeddings: list[list[float]]):
    embeddings = np.array(embeddings)
    mean_embedding = np.mean(embeddings, axis=0)
    return mean_embedding


async def search_by_embedding(mean_embedding: list[float], dataset: str, model: str):
    if mean_embedding is None:
        return None
    else:
        result = await search_milvus(
            embedding=mean_embedding, 
            dataset=dataset, 
            filters={}, 
            model=model
        )
        if result is None:
            return None
        else:
            return result
