import os
import yaml


# configs
def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

system_config_file = os.getenv('SYSTEM_CONFIG')
system_config = load_config(system_config_file)
available_datasets = system_config.get("available_datasets", [])
available_models = system_config.get("available_models", [])

for dataset_name in available_datasets:
    dataset_config_file = os.getenv('DATASET_CONFIG', f'../configs/{dataset_name}_config.yaml')  # Default config path
    dataset_config = load_config(dataset_config_file)
    print(f"Dataset name: {dataset_name}")
    print(f"Dataset config: {dataset_config}")


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

