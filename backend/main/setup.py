import os
import yaml

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

dataset_config_file = os.getenv('DATASET_CONFIG', '../configs/aic24_config.yaml')   # Default to aic24_config.yaml
dataset_config = load_config(dataset_config_file)
system_config_file = os.getenv('SYSTEM_CONFIG', '../configs/system_config.yaml')   # Default to system_config.yaml
system_config = load_config(system_config_file)


# ELASTICSEARCH
import urllib3
urllib3.disable_warnings()

from elasticsearch import Elasticsearch
password_elasticsearch = system_config['elasticsearch']['password_elasticsearch']
es_client = Elasticsearch(f"https://elastic:{password_elasticsearch}@localhost:9200", verify_certs=False)       # else u'll receive a TLS error
es_client.info()


# SPACY
import spacy
# nlp = spacy.load(config.NLP_MODEL_PATH)
nlp = spacy.load('en_core_web_sm')


# PARSER
from internal.search.parser import constants
from internal.search.parser import time_helpers
from internal.search.parser import all_parsers


# EXPLORE: list of image urls
import pandas as pd
print("Waiting to count total number of metadata records...")

# metadata_caption = pd.read_csv(dataset_config['metadata_caption_file_path'])
# image_urls = sorted(metadata_caption['id'].tolist())
# print(f"Length of image_urls: {len(image_urls)}")

# metadata_rows = pd.read_csv(dataset_config['metadata_file_path'])
# metadata_rows = pd.DataFrame(columns=['image_link', 'caption'])
# metadata_rows = metadata_rows[['video_id', 'frame_id', 'video_url', 'timestamp', 'image_link']]
# metadata_rows.set_index('image_link', inplace=True)
# metadata_rows_context_id_coarse = metadata_rows['context_id_coarse']
# image_names = sorted(metadata_rows.index.tolist())
# print(f"Length of metadata_rows: {len(metadata_rows)}")

# Database
import sys
sys.path.append('..')
from db.search import V3C_CONNECTION

image_names = None