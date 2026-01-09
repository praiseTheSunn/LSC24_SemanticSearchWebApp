from schemas.request_schemas import RequestExploreSimilarImages, RequestExploreNeighborImages
from internal.helper import *
import setup
from internal.prepare_response import prepare_response


async def explore_similar_images(data: RequestExploreSimilarImages):
    model = data.model
    dataset = data.dataset
    input_embeddings = await fetch_embeddings(data)
    if not input_embeddings:
        return None
    
    mean_embedding = compute_mean_embedding(input_embeddings)
    mean_embedding = [mean_embedding.tolist()]
    results = explore_similar_embeddings(model, dataset, mean_embedding)

    return prepare_response(dataset, results["record_ids"], results["scores"])


def explore_neighbor_images(data: RequestExploreNeighborImages):
    record_id = data.record_id
    span = data.span
    dataset = data.dataset
    neighbor_ids = list(range(int(record_id) - span, int(record_id) + span + 1))
    print("Neighbor ids:", neighbor_ids)
    return prepare_response(dataset, neighbor_ids)