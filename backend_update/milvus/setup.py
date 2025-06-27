import os
import yaml
import pandas as pd

import sys
sys.path.append("..")


# configs
def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

system_config_file = os.getenv('SYSTEM_CONFIG')
system_config = load_config(system_config_file)
available_datasets = system_config.get("available_datasets", [])
available_models = system_config.get("available_models", [])

# for dataset_name in available_datasets:
#     dataset_config_file = os.getenv('DATASET_CONFIG', f'../configs/{dataset_name}_config.yaml')  # Default config path
#     dataset_config = load_config(dataset_config_file)
#     print(f"Dataset name: {dataset_name}")
#     print(f"Dataset config: {dataset_config}")


# setup Milvus
from pymilvus import MilvusClient, MilvusException
milvus_client = MilvusClient(host="localhost", port="19530")

try:
    collection_names = milvus_client.list_collections() 
    print(f"Collections: {collection_names}") 
    for collection_name in collection_names:        
        stats = milvus_client.get_collection_stats(collection_name=collection_name)
        print(f"Collection name: {collection_name}")
        print(f"Collection stats: {stats}")
        milvus_client.load_collection(collection_name=collection_name)
        print(f"Collection '{collection_name}' loaded successfully.")
            
except MilvusException as e:
    print(e)


# bm25_encoder = {}    
# print(f"Available datasets: {available_datasets}")
# for dataset_name in available_datasets:
#     dataset = DatasetManager.get_dataset(dataset_name)
#     corpus_df = pd.read_csv(dataset.metadata_file_path)
#     corpus_df = corpus_df[dataset.corpus_fields]
#     print(f"Corpus fields: {dataset.corpus_fields}")
#     print(1)
#     corpus = corpus_df.apply(lambda x: ', '.join(x.dropna().astype(str)), axis=1).tolist()
#     print(2)
#     analyzer = build_default_analyzer(language="en")
#     bm25 = BM25EmbeddingFunction(analyzer=analyzer)
#     print(3)
#     bm25.fit(corpus=corpus)
#     print(4)
#     bm25_encoder[dataset_name] = bm25
    
    
    


