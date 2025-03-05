import setup
import numpy as np
import pandas as pd
from pprint import pprint


MAX_RECORDS = 1000
DEFAULT_PATH = "http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp"
dataset_name = setup.dataset_config['dataset_name']
image_server_ip = setup.system_config['image_server_ip']
image_server_port = setup.system_config['image_server_port']
metadata_rows = setup.metadata_rows
all_image_names = setup.all_image_names


def retrieve_record(image_name: str, score = 0):
    # path
    if dataset_name == 'lsc24':
        image_path = f"http://{image_server_ip}:{image_server_port}/{image_name}.jpg"
    else:
        image_path = f"http://{image_server_ip}/AIC_IMAGE/{image_name}.jpg"
        
    # get the metadata from csv file
    try:
        record = metadata_rows.loc[image_name].to_dict()
        for key, value in record.items():
            if pd.isna(value):
                record[key] = None
    except:
        record = metadata_rows.loc[DEFAULT_PATH].to_dict()
    record['img_link'] = image_path
    record['score'] = score

    # autofill for lsc24 missing
    if dataset_name == 'lsc24':
        if pd.isna(record['new_lat']):
            record['new_lat'] = None
            record['new_lng'] = None

    return record


def prepare_response(image_names, scores = None):

    records = []
    rows = setup.metadata_rows
    N = len(rows)

    if scores == None:
        scores = [0] * len(image_names)

    for i, (image_name, score) in enumerate(zip(image_names, scores)):
        record = retrieve_record(image_name, score)
        id = record['id']
        left_bound = max(0, id - 3)
        right_bound = min(N, id + 2)
        record_image_names = all_image_names[left_bound:right_bound]

        neighbors = []
        for j, record_image_name in enumerate(record_image_names):
            record_image = retrieve_record(record_image_name)
            neighbors.append(record_image)
        record['neighbors'] = neighbors

        records.append(record)  
        if len(records) >= MAX_RECORDS:
            break
    
    print(f"Number of records: {len(records)}")
    if len(records) > 0:
        pprint(f"First record: {records[0]}")
    return records
