from dotenv import load_dotenv
from pathlib import Path

# Load .env from repo root (or nearest parent)
load_dotenv()

import os
import yaml

def load_yaml(p: Path):
    with p.open("r") as f:
        return yaml.safe_load(f)
    

CONFIG_DIR = Path(os.environ.get("CONFIG_DIR", "./configs")).resolve()
SYSTEM_CONFIG_NAME = os.environ.get("SYSTEM_CONFIG", "system_config.yaml")
SYSTEM_CONFIG_PATH = (CONFIG_DIR / SYSTEM_CONFIG_NAME).resolve()
SYSTEM_CONFIG = load_yaml(SYSTEM_CONFIG_PATH)

available_datasets = SYSTEM_CONFIG.get("available_datasets", [])
available_models = SYSTEM_CONFIG.get("available_models", [])

MILVUS_CONFIG = SYSTEM_CONFIG.get("milvus", {})
MILVUS_HOST = MILVUS_CONFIG.get("host", "")
MILVUS_PORT = MILVUS_CONFIG.get("port", 19530)

ELASTICSEARCH_CONFIG = SYSTEM_CONFIG.get("elasticsearch", {})
ELASTICSEARCH_URL = ELASTICSEARCH_CONFIG.get("url", "")
ELASTICSEARCH_USERNAME = ELASTICSEARCH_CONFIG.get("username", "")
ELASTICSEARCH_PASSWORD = ELASTICSEARCH_CONFIG.get("password", "")
ELASTICSEARCH_CERT = ELASTICSEARCH_CONFIG.get("cert", "")

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
    
    
    


