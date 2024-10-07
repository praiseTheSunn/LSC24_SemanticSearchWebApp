from schemas.request_schemas import RequestExploreSimilarImages, RequestExploreNeighborImages
from internal.helper import *
import setup
from internal.prepare_response import prepare_response


async def explore_similar_images(data: RequestExploreSimilarImages):
    model = data.model
    input_embeddings = await fetch_embeddings(data)
    if not input_embeddings:
        return None
    
    mean_embedding = compute_mean_embedding(input_embeddings)
    mean_embedding = [mean_embedding.tolist()]
    results = explore_similar_embeddings(model, mean_embedding)

    return prepare_response(results["urls"], results["scores"])


def explore_neighbor_images(data: RequestExploreNeighborImages):
    image_url = data.image_url
    span = data.span
    image_name = "/".join(image_url.split("/")[4:])
    image_position = setup.image_names.index(image_name)
    left_bound = max(0, image_position - span)
    right_bound = min(len(setup.image_names), image_position + span + 1)
    return prepare_response(setup.image_names[left_bound : right_bound])