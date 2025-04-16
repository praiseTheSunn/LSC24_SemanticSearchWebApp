from fastapi import status
import numpy as np
from schemas.request_schemas import RequestExploreSimilarImages
from internal.api_handler import fetch_embeddings
from internal.feedback.helper import get_average_embedding, cluster_embeddings, search_by_embedding


async def get_relevant_images(record_ids: list[int], prior_scores: list[float], limit: int, model: str, dataset: str):
    if len(record_ids) == 0:
        result = {"record_ids": []}
        return result

    # Get embeddings for the images
    request_image_embeddings = await fetch_embeddings(record_ids=record_ids, model=model, dataset=dataset)
    if not request_image_embeddings:
        pass

    print(f"Number of relevant embeddings: {len(request_image_embeddings)}")

    # Add avg embedding and avg score to the list
    avg_embedding = get_average_embedding(request_image_embeddings)
    request_image_embeddings.append(avg_embedding)
    avg_score = np.mean(prior_scores)
    prior_scores.append(avg_score)

    # Sort the 2 lists by the prior scores descending
    print(f"Prior_scores: {prior_scores}")
    sorted_indices = np.argsort(prior_scores)[::-1]
    print(f"Sorted_indices: {sorted_indices}")
    request_image_embeddings = [request_image_embeddings[index] for index in sorted_indices]
    
    # # Cluster the embeddings into 3 clusters
    # clusters = cluster_embeddings(request_image_embeddings)
    # centroid_embeddings = [cluster['centroid_embedding'] for cluster in clusters]

    # Get similar vectors, merge into a list of 'limit' vectors
    similar_record_ids = []
    single_limit = limit // len(request_image_embeddings)
    for ebd in request_image_embeddings:
        results = await search_by_embedding(ebd, dataset, model, single_limit)
        record_ids = results['record_ids']
        similar_record_ids.extend(record_ids)
    print(f"Number of relevant record_ids: {len(similar_record_ids)}")

    # Remove duplicate urls but keep the order
    similar_record_ids = list(dict.fromkeys(similar_record_ids))
    result = {"record_ids": similar_record_ids}
    return result


async def get_irrelevant_images(record_ids: list[int], limit: int, model: str, dataset: str):
    if len(record_ids) == 0:
        result = {"record_ids": []}
        return result

    # Get embeddings for the images
    request_image_embeddings = await fetch_embeddings(record_ids=record_ids, model=model, dataset=dataset)
    if not request_image_embeddings:
        pass

    # Cluster the embeddings into 3 clusters
    clusters = cluster_embeddings(request_image_embeddings)
    centroid_embeddings = [cluster['centroid_embedding'] for cluster in clusters]

    # Get similar vectors, merge into a list of 'limit' vectors
    similar_record_ids = []
    single_limit = limit // len(centroid_embeddings)
    for centroid in centroid_embeddings:
        results = await search_by_embedding(centroid, dataset, model, single_limit)
        record_ids = results['record_ids']
        similar_record_ids.extend(record_ids)
    print(f"Number of irrelevant record_ids: {len(similar_record_ids)}")

    # Remove duplicate urls but keep the order
    similar_record_ids = list(dict.fromkeys(similar_record_ids))
    result = {"record_ids": similar_record_ids}
    return result