from pymilvus import connections, utility, MilvusException, MilvusClient, DataType
import json
import pandas as pd
import numpy as np
import glob


EMBEDDING_DIR = "/home/hlmquan/LSC24_SemanticSearchWebApp/backend/data/lsc24/embeddings"
IMAGE_ID_PATH = "/home/hlmquan/LSC24_SemanticSearchWebApp/backend/data/lsc24/images.json"


client = MilvusClient("milvus_data/demo.db")


# Load image ids and prefixes
with open(IMAGE_ID_PATH, "r") as f:
    data = json.load(f)
    image_ids = sorted(data["data"]["image_ids"])
    
    df = pd.DataFrame(image_ids, columns=["image_id"])
    df["prefix"] = df["image_id"].apply(lambda x: x[:9])
    prefixes = df["prefix"].unique().tolist()

# Load subfolders
npy_prefixes = glob.glob(f"{EMBEDDING_DIR}/*/*.npy")
npy_prefixes = sorted([_[-13:-4] for _ in npy_prefixes])

# Check if prefixes match subfolders
assert prefixes == npy_prefixes, "Prefixes do not match subfolders"

# Check if the number of image ids with the same prefixes match the number of vectors in the subfolders
for prefix in prefixes:
    subfolder = glob.glob(f"{EMBEDDING_DIR}/{prefix}.npy")[0]
    vectors = np.load(subfolder)
    if len(vectors) == len(df[df["prefix"] == prefix]):
        print(f"Number of vectors in {prefix} matches number of image ids")
    else:
        print(f"Number of vectors in {prefix} does not match number of image ids. Report error.")

# Insert vectors into Milvus
for prefix in prefixes:
    subfolder = glob.glob(f"{EMBEDDING_DIR}/{prefix}.npy")[0]
    vectors = np.load(subfolder)
    image_ids = sorted(df[df["prefix"] == prefix]["image_id"].tolist())
    data = [{
        "url": image_id,
        "embedding": vector.tolist()
    } for image_id, vector in zip(image_ids, vectors)]
    client.insert(collection_name=f"lsc24_clips", data=data)
    print(f"Inserted {len(data)} vectors of {prefix} into collection lsc24_clips")
