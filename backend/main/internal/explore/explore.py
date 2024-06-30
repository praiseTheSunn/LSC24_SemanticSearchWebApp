from schemas.request_schemas import RequestExploreSimilarImages, RequestExploreNeighborImages
from internal.explore.helper import *
import setup
from internal.prepare_response import prepare_response

def explore_similar_images(data: RequestExploreSimilarImages):

    model = data.model

    input_embeddings = fetch_embeddings(data)
    # input_embeddings = None
    if not input_embeddings:
        return None
    
    mean_embedding = compute_mean_embedding(input_embeddings)
    mean_embedding = [mean_embedding.tolist()]
    results = explore_similar_embeddings(model, mean_embedding)

    return prepare_response(results["urls"], results["scores"])

def explore_neighbor_images(data: RequestExploreNeighborImages):
    image_url = data.image_url
    span = data.span
    url_position = setup.image_urls.index(image_url)
    left_bound = max(0, url_position - span)
    right_bound = min(len(setup.image_urls), url_position + span + 1)
    return prepare_response(setup.image_urls[left_bound : right_bound])