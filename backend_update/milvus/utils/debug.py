from pymilvus import (
    MilvusClient, 
    DataType,
    Function,
    FunctionType,
)
from pprint import pprint
import pandas as pd
import numpy as np

client = MilvusClient(host="localhost", port="19530")  

collections = client.list_collections()
print(f"Collections: {collections}")

r = client.get_collection_stats("lsc24_clips")
print(r)

r = client.get(
    collection_name="lsc24_clips",
    ids=[346132],
    output_fields=None
)
for hit in r:
    print(hit.get("record_id"))
    print(hit.get("image_id"))
    print(hit.get("time"))
    print(hit.get("text_activity"))