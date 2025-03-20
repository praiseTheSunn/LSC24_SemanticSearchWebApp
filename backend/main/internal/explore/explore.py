from schemas.request_schemas import RequestExploreSimilarImages, RequestExploreNeighborImages
from internal.helper import *
import setup
from internal.prepare_response import prepare_response


async def explore_similar_images(data: RequestExploreSimilarImages):
    image_urls = data.image_urls
    model = data.model
    dataset = data.dataset
    print(f"Image urls: {image_urls}")
    print(f"Model: {model}")
    print(f"Dataset: {dataset}")
    input_embeddings = await fetch_embeddings(image_urls, model, dataset)
    if not input_embeddings:
        return None
    
    mean_embedding = compute_mean_embedding(input_embeddings)
    mean_embedding = [mean_embedding.tolist()]
    results = explore_similar_embeddings(model, mean_embedding)

    return prepare_response(results["urls"], results["scores"])


def explore_neighbor_images(data: RequestExploreNeighborImages):
    image_url = data.image_url
    span = data.span
    image_name = "/".join(image_url.split("/")[-3:])
    print(f"Image url: {image_url}")
    print(f"Image name: {image_name}")
    image_position = setup.all_image_names.index(image_name)
    left_bound = max(0, image_position - span)
    right_bound = min(len(setup.all_image_names), image_position + span + 1)
    print(f"Left bound: {setup.all_image_names[left_bound]}")
    print(f"Right bound: {setup.all_image_names[right_bound - 1]}")
    return prepare_response(setup.all_image_names[left_bound : right_bound])