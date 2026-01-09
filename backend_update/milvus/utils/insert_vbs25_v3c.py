from pymilvus import connections, utility, MilvusException, MilvusClient, DataType
import os
import pandas as pd
import numpy as np
from pprint import pprint

from dataset.dataset_manager import DatasetManager


EMBEDDING_DIR = "/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/data/vbs25_v3c/embeddings"
# IMAGE_ID_PATH = "/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/data/lsc24/images.json"
METADATA_PATH = "/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/data/vbs25_v3c/metadata/metadata_v1.csv"


client = MilvusClient("milvus_data/demo.db")


# Load metadata
df = pd.read_csv(METADATA_PATH)
print(len(df))





from pymilvus.model.sparse.bm25.tokenizers import build_default_analyzer
from pymilvus.model.sparse import BM25EmbeddingFunction

analyzer = build_default_analyzer(language="en")
# corpus =  df["activity"].tolist()
corpus = [
    "Artificial intelligence was founded as an academic discipline in 1956.",
    "Alan Turing was the first person to conduct substantial research in AI.",
    "Born in Maida Vale, London, Turing was raised in southern England.",
]

bm25 = BM25EmbeddingFunction(analyzer=analyzer)
bm25.build(corpus=corpus)


import random

def generate_mock_sparse_vector(dim=768, sparsity=0.995):
    """Generate a sparse vector with mostly zeros and a few random non-zero values."""
    num_nonzeros = int((1 - sparsity) * dim)
    indices = random.sample(range(dim), num_nonzeros)
    sparse_vector = {idx: random.uniform(0.1, 1.0) for idx in indices}
    print(f"Sparse vector: {sparse_vector}")
    return sparse_vector

def generate_mock_text_string():
    """Generate a mock text string."""
    text = "".join(random.choices("abcdefghijklmnopqrstuvwxyz", k=10))
    print(f"Text: {text}")
    return text



for i, row in df.iterrows():
    if i >= 100:
        break
    if i % 10 == 0:
        print(f"Processing {i}/{len(df)}")
    record_id = row["id"]
    image_id = row["image_id"]
    
    embedding_path = f"{EMBEDDING_DIR}/{image_id}.npy"
    if not os.path.exists(embedding_path):
        print(f"Embedding file {embedding_path} does not exist. Skipping record.")
        continue
    print(f"Loading embedding for {record_id}, {image_id}")
    vector = np.load(embedding_path)

    data = [{
        "record_id": record_id,
        "image_id": image_id,
        "embedding": vector.tolist(),
        "text_activity": generate_mock_text_string(),
    }]
    pprint(f"Data: {data}")

    client.insert(collection_name=f"vbs25_v3c_clips", data=data)


# # Load subfolders
# npy_prefixes = glob.glob(f"{EMBEDDING_DIR}/*/*.npy")
# npy_prefixes = sorted([_[-13:-4] for _ in npy_prefixes])

# # Check if prefixes match subfolders
# assert prefixes == npy_prefixes, "Prefixes do not match subfolders"

# # Check if the number of image ids with the same prefixes match the number of vectors in the subfolders
# for prefix in prefixes:
#     subfolder = glob.glob(f"{EMBEDDING_DIR}/{prefix}.npy")[0]
#     vectors = np.load(subfolder)
#     if len(vectors) == len(df[df["prefix"] == prefix]):
#         print(f"Number of vectors in {prefix} matches number of image ids")
#     else:
#         print(f"Number of vectors in {prefix} does not match number of image ids. Report error.")

# # Insert vectors into Milvus
# for prefix in prefixes:
#     subfolder = glob.glob(f"{EMBEDDING_DIR}/{prefix}.npy")[0]
#     vectors = np.load(subfolder)
#     image_ids = sorted(df[df["prefix"] == prefix]["image_id"].tolist())
#     data = []
#     for image_id, vector in zip(image_ids, vectors):
#         record_id = DatasetManager.get_dataset("lsc24").image_id_to_record_id[image_id]
#         data.append({
#             "record_id": record_id,
#             "image_id": image_id,
#             "embedding": vector.tolist()
#         })
#         record_id += 1
#     client.insert(collection_name=f"lsc24_clips", data=data)
#     print(f"Inserted {len(data)} vectors of {prefix} into collection lsc24_clips")
