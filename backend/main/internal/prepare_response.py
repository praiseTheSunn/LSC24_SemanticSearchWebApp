import setup
import numpy as np
import pandas as pd

import sys
sys.path.append('..')
from db.search import V3C_CONNECTION, search_metadata

MAX_RECORDS = 1000
NEIGHBOR_WINDOW = 5
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


def prepare_response(record_ids, scores=None):
    records = []

    if scores == None:
        scores = [0] * len(record_ids)

    records = search_metadata(V3C_CONNECTION, "keyframes", {"id": record_ids})
    records_df = pd.DataFrame(records)
    records_df.set_index("id", inplace=True)
    records_df['img_link'] = records_df['name'].apply(lambda x: f"http://{server_ip}/vbs25_image/{x}")
    records_df['video_id'] = records_df['name'].apply(lambda x: x.split('/')[1])
    records_df['frame_id'] = records_df['name'].apply(lambda x: x.split('/')[2])
    records_df['score'] = scores

    return records_df.to_dict(orient='records')

