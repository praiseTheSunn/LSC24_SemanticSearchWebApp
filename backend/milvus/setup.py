# milvus setup
from pymilvus import connections, utility, MilvusException, Collection
connections.connect(host="localhost", port="19530")

try:
    collection_names = utility.list_collections()
    print("List of collections: ", collection_names)
    for collection_name in collection_names:
        
        collection = Collection(collection_name)
        print(collection_name, collection.num_entities)

except MilvusException as e:
    print(e)

from pymilvus import MilvusClient, DataType
CLUSTER_ENDPOINT = "http://localhost:19530"
TOKEN = "root:Milvus"
milvus_client = MilvusClient(uri=CLUSTER_ENDPOINT, token=TOKEN)


# configs
import os
import yaml

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

dataset_config_file = os.getenv('DATASET_CONFIG', '../configs/lsc24_config.yaml')   # Default to lsc24_config.yaml
dataset_config = load_config(dataset_config_file)