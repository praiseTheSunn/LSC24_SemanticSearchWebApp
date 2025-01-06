from fastapi import status
from internal.helper import *
from internal.prepare_response import prepare_response
from schemas.request_schemas import RequestExploreSimilarImages, RequestFeedbackRelevant, RequestFeedbackIrrelevant, RequestSearchByTextQuery
from sklearn.cluster import KMeans


def get_average_embedding(embeddings: list[list[float]]) -> list[float]:
    return np.mean(embeddings, axis=0).tolist()


def cluster_embeddings(embeddings: list[list[float]]) -> list[dict]:
    if len(embeddings) <= 3:
        return [{
            'centroid_embedding': embedding,
            'cluster_label': label
        } for label, embedding in enumerate(embeddings)]    
    
    kmeans = KMeans(n_clusters=3, random_state=42)
    kmeans.fit(embeddings)
    centroids = kmeans.cluster_centers_
    labels = kmeans.labels_
    return [{
        'centroid_embedding': centroids[label].tolist(),
        'cluster_label': label
    } for label in np.unique(labels)]


async def get_relevant_images(data: dict):
    record_ids = data['ids']
    prior_scores = data['prior_scores']
    limit = data['limit']
    model = data['model']
    dataset = data['dataset']

    if len(record_ids) == 0:
        return prepare_response(dataset=dataset, record_ids=[]), status.HTTP_200_OK

    # Get embeddings for the images
    request_image_embeddings = await fetch_embeddings(
        RequestExploreSimilarImages(
            record_ids=record_ids,
            model=model,
            dataset=dataset
        )
    )
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
        record_ids = explore_similar_embeddings(model, dataset, [ebd], single_limit)['record_ids']
        similar_record_ids.extend(record_ids)
    print(f"Number of relevant record_ids: {len(similar_record_ids)}")

    # Remove duplicate urls but keep the order
    similar_record_ids = list(dict.fromkeys(similar_record_ids))

    return prepare_response(dataset, similar_record_ids), status.HTTP_200_OK


async def get_irrelevant_images(data: dict):
    record_ids = data['ids']
    limit = data['limit']
    model = data['model']
    dataset = data['dataset']

    if len(record_ids) == 0:
        return prepare_response(dataset=dataset, record_ids=[]), status.HTTP_200_OK

    # Get embeddings for the images
    request_image_embeddings = await fetch_embeddings(
        RequestExploreSimilarImages(
            record_ids=record_ids,
            model=model,
            dataset=dataset
        )
    )
    if not request_image_embeddings:
        pass

    # Cluster the embeddings into 3 clusters
    clusters = cluster_embeddings(request_image_embeddings)
    centroid_embeddings = [cluster['centroid_embedding'] for cluster in clusters]

    # Get similar vectors, merge into a list of 'limit' vectors
    similar_record_ids = []
    single_limit = limit // len(centroid_embeddings)
    for centroid in centroid_embeddings:
        record_ids = explore_similar_embeddings(model, dataset, [centroid], single_limit)['record_ids']
        similar_record_ids.extend(record_ids)
    print(f"Number of irrelevant record_ids: {len(similar_record_ids)}")

    # Remove duplicate urls but keep the order
    similar_record_ids = list(dict.fromkeys(similar_record_ids))
    
    return prepare_response(dataset, similar_record_ids), status.HTTP_200_OK