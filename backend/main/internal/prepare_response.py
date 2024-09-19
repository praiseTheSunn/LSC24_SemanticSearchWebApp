import setup
import numpy as np
import pandas as pd


MAX_RECORDS = 1000
DEFAULT_PATH = "http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp"
dataset_name = setup.dataset_config['dataset_name']


def prepare_response(urls, scores = None):

    records = []
    rows = setup.metadata_rows
    if scores == None:
        scores = [0] * len(urls)

    for i, path in enumerate(urls):
        try:
            record = rows.loc[path].to_dict()
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
        except:
            record = rows.loc[DEFAULT_PATH].to_dict()
        record['img_link'] = path
        record['score'] = scores[i]

        if dataset_name == 'lsc24':
            if pd.isna(record['new_lat']):
                record['new_lat'] = None
                record['new_lng'] = None   

            if not isinstance(record['object_tags'], str):
                record['object_tags'] = None

        records.append(record)  
        if len(records) >= MAX_RECORDS:
            break      
    
    print("Number of records:", len(records))
    return records
