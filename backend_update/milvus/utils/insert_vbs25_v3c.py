from pymilvus import connections, utility, MilvusException, MilvusClient, DataType
import os
import pandas as pd
import numpy as np
import glob

import sys
sys.path.append("..")
from dataset.dataset_manager import DatasetManager


EMBEDDING_DIR = "/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/data/vbs25_v3c/embeddings"
# IMAGE_ID_PATH = "/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/data/lsc24/images.json"
METADATA_PATH = "/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/data/vbs25_v3c/metadata/metadata_v1.csv"


client = MilvusClient("milvus_data/demo.db")


# Load metadata
df = pd.read_csv(METADATA_PATH)
for i, row in df.iterrows():
    record_id = row["id"]
    image_id = row["image_id"]
    
    embedding_path = f"{EMBEDDING_DIR}/{image_id}.npy"
    if not os.path.exists(embedding_path):
        print(f"Embedding file {embedding_path} does not exist. Skipping record.")
        continue
    print(f"Loading embedding for {record_id}, {image_id}")
    vector = np.load(embedding_path)

    client.insert(collection_name=f"vbs25_v3c_clips", data=[{
        "record_id": record_id,
        "image_id": image_id,
        "embedding": vector.tolist()
    }])


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
