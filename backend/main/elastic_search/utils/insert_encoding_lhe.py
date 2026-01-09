import os
import json
import pandas as pd 
import yaml
from urllib3.exceptions import InsecureRequestWarning
import urllib3
import math

urllib3.disable_warnings(InsecureRequestWarning)

INDEX_NAME = "vbs25_lhe"
METADATA_DIR = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/object_encoding/LHE_brush"
ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/lhe/keyframes.csv"

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

system_config_file = os.getenv('SYSTEM_CONFIG', '/home/pc/LSC24_SemanticSearchWebApp/backend/configs/system_config.yaml')   # Default to system_config.yaml
system_config = load_config(system_config_file)

from elasticsearch import Elasticsearch
password_elasticsearch = system_config['elasticsearch']['password_elasticsearch']
es_client = Elasticsearch(f"https://elastic:{password_elasticsearch}@localhost:9200", verify_certs=False)       # else u'll receive a TLS error

id_mapping = pd.read_csv(ID_MAPPING, index_col=0)

# read metadata from json files in METADATA_DIR
rows = []
count = 0
for filename in sorted(os.listdir(METADATA_DIR)):
    if filename.endswith(".json"):
        video_order = filename.split('.')[0]
        with open(os.path.join(METADATA_DIR, filename), 'r') as f:
            data = json.load(f)
            keys = list(data.keys())
            keys = sorted([int(key[:-4]) for key in keys])
            for keyframe_order, key in enumerate(keys, start=1):
                print(key)
                context_order = math.ceil(keyframe_order / 16)
                name = f"LHE/{video_order}/{context_order:05d}/{keyframe_order:05d}"
                id = id_mapping.loc[name, 'keyframe_id']
                print(name)
                print(id)
                print()
                body = {
                    "local_object_encoding": data[f"{int(key)}.png"]["object_encoding"]["local"],
                    "global_object_encoding": data[f"{int(key)}.png"]["object_encoding"]["global"],
                    "local_color_encoding": data[f"{int(key)}.png"]["color_encoding"]["local"],
                    "global_color_encoding": data[f"{int(key)}.png"]["color_encoding"]["global"]
                }
                # es_client.index(index=INDEX_NAME, body=body, id=id)
                count += 1
                if count % 100 == 0:
                    response = es_client.get(index=INDEX_NAME, id=id)
                    print(response['_id'])
    else:
        continue
