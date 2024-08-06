import setup
import numpy as np

MAX_RECORDS = 1000

def prepare_response(urls, scores = None):

    records = []
    rows = setup.metadata_rows
    if scores == None:
        scores = [0] * len(urls)

    for i, path in enumerate(urls):
        record = rows.loc[path].to_dict()
        record['img_link'] = path
        record['score'] = scores[i]

        if np.isnan(record['new_lat']):
            record['new_lat'] = None
            record['new_lng'] = None   

        if not isinstance(record['object_tags'], str):
            record['object_tags'] = None

        records.append(record)  
        if len(records) >= MAX_RECORDS:
            break      
    
    print("Number of records:", len(records))
    return records
