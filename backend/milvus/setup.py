# configs
import os
import yaml

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

dataset_config_file = os.getenv('DATASET_CONFIG', '../configs/lsc24_config.yaml')   # Default to lsc24_config.yaml
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
    for collection_name in collection_names:        
        collection = Collection(collection_name)
        print(collection_name, collection.num_entities)

        load_state = milvus_client.get_load_state(collection_name)
        if collection_name.startswith(dataset_name):
            milvus_client.load_collection(collection_name)
            print("Loaded collection: ", collection_name)
        elif not collection_name.startswith(dataset_name):
            milvus_client.release_collection(collection_name)
            print("Released collection: ", collection_name)
            
except MilvusException as e:
    print(e)


