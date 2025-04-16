import setup
import json
import pandas as pd
import itertools
import constants

import sys
sys.path.append('..')
from database.image_database import ImageDatabase

server_ip = setup.system_config['server_ip']
dataset_name = setup.dataset_config['dataset_name']
image_server_url = setup.dataset_config['image_server_url']
image_extension = setup.dataset_config['image_extension']

# with open("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/LHE_video_fps.json") as f:
#     fps = json.load(f)

# from setup import metadata_df


# def prepare_response_deprecated(image_names, scores = None):

#     records = []
#     rows = setup.metadata_rows

#     if scores == None:
#         scores = [0] * len(image_names)

#     for i, image_name in enumerate(image_names):
#         image_path = f"http://{server_ip}/AIC_IMAGE/{image_name}"
#         try:
#             record = rows.loc[image_name].to_dict()
#             for key, value in record.items():
#                 if pd.isna(value):
#                     record[key] = None
#         except:
#             record = rows.loc[DEFAULT_PATH].to_dict()
#         record['img_link'] = image_path
#         record['score'] = scores[i]

#         if dataset_name == 'lsc24':
#             if pd.isna(record['new_lat']):
#                 record['new_lat'] = None
#                 record['new_lng'] = None   

#             if not isinstance(record['object_tags'], str):
#                 record['object_tags'] = None

#         records.append(record)  
#         if len(records) >= MAX_RECORDS:
#             break      
    
#     print("Number of records:", len(records))
#     return records


def json_to_string(json_string):
    if json_string == '[]' or json_string == None:
        return " "
    python_list = json.loads(json_string)
    concatenated_string = ", ".join(python_list)
    return concatenated_string


def remove_scores_that_do_not_appear_in_records(scores: list[float], records_df: pd.DataFrame) -> list[float]:
    # Convert the 'order_id' column to a set for O(1) membership checks
    valid_order_ids = set(records_df['order_id'])
    
    # Use a list comprehension to filter scores
    return [score for i, score in enumerate(scores, start=1) if i in valid_order_ids]


def print_records_sample(records, n=15):        
    for i in range(n):
        record = records[i]
        print(f"{record['record_id']:<10} {record['image_id']:<15} {record['img_link']:<10}")


def mapping_metadata(records, dataset='vbs25_v3c', scores=None, local_image_server=True):
    records_df = pd.DataFrame(records)

    records_df['video_id'] = records_df['name'].apply(lambda x: x.split('/')[1])
    records_df['frame_id'] = records_df['id'].apply(lambda x: str(x))
    records_df['timestamp'] = records_df['timestamp'].apply(lambda x: int(x))

    if 'fish_list' in records_df.columns:
        records_df['object_tags'] = records_df['fish_list'].apply(lambda x: json_to_string(x))
    elif 'object_tags' in records_df.columns:
        records_df['object_tags'] = records_df['object_tags'].apply(lambda x: json_to_string(x))
    
    if scores == None:
        scores = [0] * len(records_df)
    else:
        scores = remove_scores_that_do_not_appear_in_records(scores, records_df)
    records_df['score'] = scores

    if local_image_server:
        if dataset != 'vbs25_lhe':
            records_df['img_link'] = records_df.apply(lambda row: f"http://127.0.0.1:8000/{dataset[-3:].upper()}/{row['video_id']}/{row['timestamp']}.webp", axis=1)
        else:
            records_df['img_link'] = records_df.apply(lambda row: f"http://127.0.0.1:8000/{dataset[-3:].upper()}/{row['video_id']}/{row['timestamp']}.webp", axis=1)
            # records_df['img_link'] = records_df.apply(lambda row: f"http://127.0.0.1:8000/{dataset[-3:].upper()}/{row['video_id']}/{int(row['timestamp'] / 1000 * fps[row['video_id']]['fps'])}.webp", axis=1)
    else:
        records_df['img_link'] = records_df.apply(lambda row: f"http://{server_ip}/vbs25_image/{row['video_id']}/{row['timestamp']}.webp", axis=1)

    records_df.drop(columns=['name', 'id', 'order_id', 'fish_list'], inplace=True, errors='ignore')
    # print(f"Number of records: {len(records_df)}")
    # print(f"Number of columns: {len(records_df.columns)}")
    # print(f"Number of video ids: {len(records_df['video_id'].unique())}")
    # print(f"Number of frame ids: {len(records_df['frame_id'].unique())}")
    # print(f"Number of timestamps: {len(records_df['timestamp'].unique())}")
    # print(f"Number of image links: {len(records_df['img_link'].unique())}")
    # try:
    #     print(f"Number of scores: {len(scores)}")
    # except:
    #     print("No scores provided.")

    records = records_df.to_dict(orient='records')
    return records


def prepare_response(dataset, record_ids=[], scores=None, display_window_size=3, all_neighbor_ids=None):
    dataset = dataset.lower()
    if len(record_ids) == 0:
        return []
    
    # Step 1: 
    # If neighbor IDs is not provided, get all neighbor IDs for the window around each record_id
    # If neighbor IDs is provided, use it to get the actual neighbors
    if all_neighbor_ids is None:    
        all_neighbor_ids = {}
        for record_id in record_ids:
            all_neighbor_ids[record_id] =  list(range(record_id - display_window_size, record_id + display_window_size + 1))
    all_neighbor_ids_flat = list(set(itertools.chain.from_iterable(all_neighbor_ids.values())))

    print(f"Validating record ids for dataset: {dataset}:")
    print(f"Number of record ids: {len(record_ids)}")
    print(f"Number of neighbor ids (unique): {len(all_neighbor_ids_flat)}")

    # Step 2: Retrieve metadata
    db = ImageDatabase(dataset_name=dataset)
    records = db.retrieve_metadata(record_ids=record_ids, fields=['image_id', 'record_id', 'video_id'])
    neighbors = db.retrieve_metadata(record_ids=all_neighbor_ids_flat, fields=['image_id', 'record_id', 'video_id'])
    print(f"Retrieved {len(records)} main records")
    print(f"Retrieved {len(all_neighbor_ids_flat)} neighbor records")

    # Step 2.5: Add img_link to records
    for record in records:
        record['img_link'] = f"{image_server_url}/{record['image_id']}{image_extension}"
    for record in neighbors:
        record['img_link'] = f"{image_server_url}/{record['image_id']}{image_extension}"

    # Step 3: Build a mapping for fast access
    neighbor_metadata = {rec['record_id']: rec for rec in neighbors}

    # Step 4: Build output with actual available neighbors
    result = []
    for i, record in enumerate(records):
        rid = record['record_id']
        actual_neighbors = [neighbor_metadata[nid] for nid in all_neighbor_ids[rid]]
        record['score'] = scores[i] if scores else 0
        record['neighbors'] = actual_neighbors
        result.append(record)

    print_records_sample(result, n=min(10, len(result)))
    return result
    
    # else:
    #     records = []
    #     for i, group in enumerate(record_ids):
    #         # record_ids in temporal query is a list of groups
    #         # each group is a list of record ids
    #         # we also have scores for each group
    #         # so first we search for the records in each group -> group_records
    #         # then we map the metadata for each group -> group_records, with additional scores as the score of the group * len(group)
    #         group_records = search_metadata_by_ids(db_name=db_name, table_name="keyframes", id_list=group)
    #         group_records = mapping_metadata(group_records, dataset=dataset, scores=[scores[i]] * len(group))
    #         records.extend(group_records)

        
        # return records

