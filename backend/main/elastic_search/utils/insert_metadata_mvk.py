import os
import json
import yaml
from urllib3.exceptions import InsecureRequestWarning
import urllib3


urllib3.disable_warnings(InsecureRequestWarning)

INDEX_NAME = "vbs25_mvk"

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

system_config_file = os.getenv('SYSTEM_CONFIG', '/home/pc/LSC24_SemanticSearchWebApp/backend/configs/system_config.yaml')   # Default to system_config.yaml
system_config = load_config(system_config_file)

from elasticsearch import Elasticsearch
password_elasticsearch = system_config['elasticsearch']['password_elasticsearch']
es_client = Elasticsearch(f"https://elastic:{password_elasticsearch}@localhost:9200", verify_certs=False)       # else u'll receive a TLS error
es_client.info()


es_client.indices.get_alias(index="*")    # Get all indices


import pandas as pd 
import sqlite3
import sys
sys.path.append('/home/pc/LSC24_SemanticSearchWebApp')
from backend.data.object_encoding.load import load_object_encoding

conn = sqlite3.connect('/home/pc/LSC24_SemanticSearchWebApp/backend/data/object_encoding/MVK.db')
    
# find all tables in the database
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
tables = [table[0] for table in tables]

# load object encoding
table = "object_detect"
cursor.execute(f"SELECT * FROM {table}")
rows = cursor.fetchall()
print(rows[:5])

conn.close()


def standardize_global_object_encoding(json_string):
    python_list = json.loads(json_string)
    concatenated_string = ", ".join(python_list)
    return concatenated_string

# Define column names
columns = ["id", "name", "global_object_encoding"]

# Convert to Pandas DataFrame
df = pd.DataFrame(rows, columns=columns)
df.set_index("id", inplace=True)
df['global_object_encoding'] = df['global_object_encoding'].apply(lambda x: standardize_global_object_encoding(x))

# Display the first few rows
print(df.head())


count = 0
for id, row in df.iterrows():
    body = row.to_dict()
    body = {key: value for key, value in body.items() if pd.notna(value)}
    es_client.index(index=INDEX_NAME, body=body, id=id)
    count += 1
    if count % 100 == 0:
        response = es_client.get(index=INDEX_NAME, id=id)
        print(response)