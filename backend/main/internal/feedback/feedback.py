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
    # text_query = data['text_query']
    image_urls = data['image_urls']
    prior_scores = data['prior_scores']
    limit = data['limit']
    model = data['model']
    dataset = data['dataset']

    if len(image_urls) == 0:
        return prepare_response([]), status.HTTP_200_OK

    # Get embeddings for the images
    request_image_embeddings = await fetch_embeddings(
        RequestExploreSimilarImages(
            image_urls=image_urls,
            model=model,
            dataset=dataset
        )
    )
    if not request_image_embeddings:
        pass

    # Add avg embedding and avg score to the list
    avg_embedding = get_average_embedding(request_image_embeddings)
    request_image_embeddings.append(avg_embedding)
    avg_score = np.mean(prior_scores)
    prior_scores.append(avg_score)

    # Sort the 2 lists by the prior scores descending
    print(f"prior_scores: {prior_scores}")
    sorted_indices = np.argsort(prior_scores)[::-1]
    print(f"sorted_indices: {sorted_indices}")
    request_image_embeddings = [request_image_embeddings[index] for index in sorted_indices]
    
    # # Cluster the embeddings into 3 clusters
    # clusters = cluster_embeddings(request_image_embeddings)
    # centroid_embeddings = [cluster['centroid_embedding'] for cluster in clusters]

    # Get similar vectors, merge into a list of 'limit' vectors
    similar_urls = []
    single_limit = limit // len(request_image_embeddings)
    for ebd in request_image_embeddings:
        urls = explore_similar_embeddings(model, [ebd], single_limit, dataset)['urls']
        similar_urls.extend(urls)
    print(f"Len relevant urls: {len(similar_urls)}")

    # Remove duplicate urls but keep the order
    similar_urls = list(dict.fromkeys(similar_urls))

    # similar_image_embeddings = await fetch_embeddings(
    #     RequestExploreSimilarImages(
    #         image_urls=similar_urls,
    #         model=model,
    #         dataset=dataset
    #     )
    # )

    # # Get the text embedding for text query
    # text_data = RequestSearchByTextQuery(
    #     text_query=text_query,
    #     model="clip",
    #     mode="vec",
    #     dataset=dataset
    # )
    # text_response = requests.post("http://localhost:8002/embedding/text", json=text_data.dict())
    # text_embedding = text_response.json()["text_embedding"]
    # text_embedding = np.array(text_embedding)

    # # Convert into a matrix and compute the similarities with the text embedding, then sort the similar urls
    # similar_image_embeddings = np.array(similar_image_embeddings)
    # similarities = np.dot(similar_image_embeddings, text_embedding.T)
    # sorted_indices = np.argsort(similarities.flatten())[::-1]
    # sorted_urls = [similar_urls[int(index)] for index in sorted_indices]

    return prepare_response(similar_urls), status.HTTP_200_OK


async def get_irrelevant_images(data: dict):
    image_urls = data['image_urls']
    limit = data['limit']
    model = data['model']
    dataset = data['dataset']

    if len(image_urls) == 0:
        return prepare_response([]), status.HTTP_200_OK

    # Get embeddings for the images
    request_image_embeddings = await fetch_embeddings(
        RequestExploreSimilarImages(
            image_urls=image_urls,
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
    similar_urls = []
    single_limit = limit // len(centroid_embeddings)
    for centroid in centroid_embeddings:
        urls = explore_similar_embeddings(model, [centroid], single_limit, dataset)['urls']
        similar_urls.extend(urls)
    print(f"Len irrelevant urls: {len(similar_urls)}")
    return prepare_response(similar_urls), status.HTTP_200_OK