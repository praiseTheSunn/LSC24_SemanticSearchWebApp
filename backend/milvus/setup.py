# configs
import os
import yaml

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

dataset_config_file = os.getenv('DATASET_CONFIG', '../configs/lsc24_config.yaml')   # Default to aic24_config.yaml
dataset_config = load_config(dataset_config_file)
dataset_name = dataset_config['dataset_name']
print("Dataset name: ", dataset_name)


# setup Milvus
from pymilvus import MilvusClient, MilvusException, Collection, utility
client = MilvusClient("milvus_data/demo.db")


try:
    collection_names = client.list_collections() 
    print(f"Collections: {collection_names}") 
    for collection_name in collection_names:        
        stats = client.get_collection_stats(collection_name=collection_name)
        print(stats)
            
except MilvusException as e:
    print(e)


