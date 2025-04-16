import setup
from fastapi import status
from schemas.request_schemas import RequestExploreSimilarImages, RequestExploreNeighborImages
from internal.api_handler import fetch_embeddings
from internal.explore.helper import compute_mean_embedding, search_by_embedding


async def explore_similar_images(record_ids: list[int], dataset: str, model: str):
    input_embeddings = await fetch_embeddings(record_ids=record_ids, dataset=dataset, model=model)
    if not input_embeddings:
        return None, status.HTTP_500_INTERNAL_SERVER_ERROR
    
    mean_embedding = compute_mean_embedding(input_embeddings)
    mean_embedding = [mean_embedding.tolist()]
    results = await search_by_embedding(mean_embedding, dataset, model)
    return results, status.HTTP_200_OK


async def explore_neighbor_images(record_id: str, span: int, dataset: str):
    neighbor_record_ids = list(range(int(record_id) - span, int(record_id) + span + 1))
    results = {
        "record_ids": neighbor_record_ids
    }
    return results, status.HTTP_200_OK