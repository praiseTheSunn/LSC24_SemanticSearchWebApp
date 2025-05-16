import numpy as np
from sklearn.cluster import KMeans
from internal.api_handler import search_milvus


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


async def search_by_embedding(mean_embedding: list[float], dataset: str, model: str, limit: int = 10, subset_record_ids: list[str] = []):
    if mean_embedding is None:
        return None
    else:
        result = await search_milvus(
            embedding=[mean_embedding], 
            dataset=dataset,
            filters={},
            model=model, 
            limit=limit, 
            subset_record_ids=subset_record_ids)
        print(f"Search result: {result}")
        if result is None:
            return None
        else:
            return result
