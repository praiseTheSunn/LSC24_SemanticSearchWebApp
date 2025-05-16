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

r = client.get(
    collection_name="lsc24_clips",
    ids=[35128],
    output_fields=None
)

for hit in r:
    print(hit.get("record_id"))
    print(hit.get("image_id"))
    print(hit.get("time"))

