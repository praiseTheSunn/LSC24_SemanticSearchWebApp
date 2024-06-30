import config

# # MILVUS
# from pymilvus import connections, utility, MilvusException, Collection
# connections.connect(host="localhost", port="19530")

# try:
#     collection_names = utility.list_collections()
#     print("List of collections: ", collection_names)
#     for collection_name in collection_names:
        
#         collection = Collection(collection_name)
#         print("collection.num_entities", collection.num_entities)
#         break
#     #     collection.load()
#     #     print("Collection info: ", collection)
# except MilvusException as e:
#     print(e)

# from pymilvus import MilvusClient, DataType
# CLUSTER_ENDPOINT = "http://localhost:19530"
# TOKEN = "root:Milvus"
# milvus_client = MilvusClient(uri=CLUSTER_ENDPOINT, token=TOKEN)

# ELASTICSEARCH
import urllib3
urllib3.disable_warnings()

from elasticsearch import Elasticsearch
es_client = Elasticsearch(f"https://elastic:{config.PASSWORD_ELASTICSEARCH}@localhost:9200", verify_certs=False)       # else u'll receive a TLS error
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
print("Waiting to count total number of images...")

metadata_caption = pd.read_csv(config.METADATA_CAPTION_PATH)
image_urls = sorted(metadata_caption['id'].tolist())
print(f"Length of image_urls: {len(image_urls)}")

metadata_rows = pd.read_csv(config.METADATA_PATH)
metadata_rows.set_index('image_link', inplace=True)
print(f"Length of metadata_rows: {len(metadata_rows)}")