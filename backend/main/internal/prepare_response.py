import setup
import numpy as np
import pandas as pd
import itertools

import sys
sys.path.append('..')
from db.search import search_metadata, search_metadata_by_ids

MAX_RECORDS = 1000
DEFAULT_PATH = "http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp"
dataset_name = setup.dataset_config['dataset_name']
server_ip = setup.system_config['server_ip']


def prepare_response_deprecated(image_names, scores = None):

    records = []
    rows = setup.metadata_rows

    if scores == None:
        scores = [0] * len(image_names)

    for i, image_name in enumerate(image_names):
        image_path = f"http://{server_ip}/AIC_IMAGE/{image_name}"
        try:
            record = rows.loc[image_name].to_dict()
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
        except:
            record = rows.loc[DEFAULT_PATH].to_dict()
        record['img_link'] = image_path
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
    for i in range(min(len(records), 15)):
        print(i, '\t', records[i]['img_link'])
    return records


def mapping_metadata(records, scores=None):
    records_df = pd.DataFrame(records)
    records_df['img_link'] = records_df['name'].apply(lambda x: f"http://{server_ip}/vbs25_image/{x}")
    if scores:
        records_df['video_id'] = records_df['name'].apply(lambda x: x.split('/')[1])
        # records_df['frame_id'] = records_df['name'].apply(lambda x: x.split('/')[2])
        records_df['score'] = scores
        records_df = records_df[['id', 'img_link', 'timestamp', 'video_id', 'score']]
    else:
        records_df = records_df[['id', 'img_link', 'timestamp']]
    records = records_df.to_dict(orient='records')
    return records

def prepare_response(record_ids, scores=None, window_size=3):
    records = []

    if scores == None:
        scores = [0] * len(record_ids)

    records = search_metadata_by_ids(db_name="v3c", table_name="keyframes", id_list=record_ids)
    records = mapping_metadata(records, scores=scores)
    
    neighbor_ids = [list(range(int(record['id']) - window_size, int(record['id']) + window_size + 1)) for record in records]
    neighbor_ids_flat = list(itertools.chain.from_iterable(neighbor_ids))
    neighbor_records = search_metadata_by_ids(db_name="v3c", table_name="keyframes", id_list=neighbor_ids_flat)
    neighbor_records = mapping_metadata(neighbor_records)
    len_neighbors = 2 * window_size + 1

    for i, record in enumerate(records):
        offset = i * len_neighbors
        record['neighbors'] = neighbor_records[offset : offset + len_neighbors]
        offset += len_neighbors

    print(records[0])
    return records

