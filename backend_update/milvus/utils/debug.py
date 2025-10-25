from pymilvus import (
    MilvusClient, 
    DataType,
    Function,
    FunctionType,
)
from pprint import pprint
import pandas as pd
import numpy as np

COLLECTION_NAME = "lsc24_clips"

client = MilvusClient(host="localhost", port="19530")  

collections = client.list_collections()
print(f"List of collection names: {collections}")

r = client.get_collection_stats(COLLECTION_NAME)
print(f"{COLLECTION_NAME} stats: {r}")

# client.drop_collection("aic25_clips")

# describe collection
description = client.describe_collection(COLLECTION_NAME)
print(f"{COLLECTION_NAME} description: {description}")

# describe indexes
indexes = client.list_indexes(COLLECTION_NAME)
print(f"{COLLECTION_NAME} indexes: {indexes}")

r = client.get(
    collection_name=COLLECTION_NAME,
    ids=[346132],
    output_fields=None
)
for hit in r:
    print(hit.get("record_id"))
    print(hit.get("image_id"))
    print(hit.get("time"))
    print(hit.get("text_activity"))