# configs
import os
import time
import yaml

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

dataset_config_file = os.getenv('DATASET_CONFIG', '../configs/aic24_config.yaml')   # Default to aic24_config.yaml
dataset_config = load_config(dataset_config_file)
dataset_name = dataset_config['dataset_name']

print("Dataset name: ", dataset_name)


# milvus setup
from pymilvus import connections, utility, MilvusException, Collection, MilvusClient

CLUSTER_ENDPOINT = "http://localhost:19530"
TOKEN = "root:Milvus"
milvus_client = MilvusClient(uri=CLUSTER_ENDPOINT, token=TOKEN)
connections.connect(host="localhost", port="19530")

try:
    collection_names = utility.list_collections()
    print("List of collections: ", collection_names)
    start_time = time.time()
    print("Start loading collections...")
    for collection_name in collection_names:    
        collection = Collection(collection_name)
        collection.load()
        while True:    
            load_state = utility.load_state(collection_name)
            print(f"Collection_name: {collection_name}, load_state: {load_state}")
            if load_state:
                print(f"Collection {collection_name} loaded successfully after {time.time() - start_time} seconds since start loading all collections.")
                break
            
except MilvusException as e:
    print(e)


