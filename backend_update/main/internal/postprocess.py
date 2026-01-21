import numpy as np
import json
import pandas as pd
import itertools
from pprint import pprint
from setup import SYSTEM_CONFIG
from dataset.dataset_manager import DatasetManager


server_ip = SYSTEM_CONFIG['server_ip']

# # For explore_neighbor in the activity-filted case
# # This is a temporary solution to get the metadata from the CSV file
# # and not from the Milvus database
# df = pd.read_csv(DatasetManager.get_dataset("lsc24").get_metadata_file_path())
# df.rename(columns=DatasetManager.get_dataset("lsc24").get_column_mapping(), inplace=True)
# df = df[DatasetManager.get_dataset("lsc24").get_column_mapping().values()]
# df.set_index("record_id", inplace=True)
# print(f"Temporarily loading the metadata from the CSV file for the lsc24 dataset: Done.")

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


def print_records_sample(records, n=5):        
    for i in range(n):
        record = records[i]
        pprint(record)
        print()


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


async def prepare_response(dataset, model, record_ids=[], scores=None, display_window_size=3, all_neighbor_ids=None, top_k=100):
    dataset_name = dataset.lower()
    dataset = DatasetManager.get_dataset(dataset_name)
    image_server_url = dataset.get_image_server_url()
    image_extension = dataset.get_image_extension()

    if len(record_ids) == 0:
        return []
    
    # remove invalid numbers from record_ids
    print(f"Before masking: {len(record_ids)} record ids")
    record_ids = [rid for rid in record_ids if rid >= 0 and rid < len(dataset.df)]

    # Step 1:
    # If neighbor IDs is not provided, get all neighbor IDs for the window around each record_id
    # If neighbor IDs is provided (due to using independent temporal queries in the temporal search), use it to get the actual neighbors
    # if all_neighbor_ids is None:    
    #     all_neighbor_ids = {}
    #     for record_id in record_ids:
    #         all_neighbor_ids[record_id] =  list(range(record_id - display_window_size, record_id + display_window_size + 1))
    #         print(f"Record ID {record_id} has number of neighbors: {len(all_neighbor_ids[record_id])}")
    # all_neighbor_ids_flat = list(set(itertools.chain.from_iterable(all_neighbor_ids.values())))

    # New version: just do the same for both cases
    
    all_neighbor_ids = {}
    for record_id in record_ids:
        all_neighbor_ids[record_id] =  list(range(max(0, record_id - display_window_size), min(record_id + display_window_size + 1, len(dataset.df))))
    all_neighbor_ids_flat = list(set(itertools.chain.from_iterable(all_neighbor_ids.values())))
    

    print(f"Validating record ids for dataset: {dataset_name}")
    print(f"Number of record ids: {len(record_ids)}")
    print(f"Number of neighbor ids (unique): {len(all_neighbor_ids_flat)}")
    print(f"List of record ids: {record_ids[:20]}...")
    print(f"Model: {model}")

    # Step 2: Retrieve metadata

    # # Activity-only case: split between search and explore
    # if model != "default":
    #     records = await fetch_metadata(record_ids=record_ids, dataset=dataset, model=model)
    #     neighbors = await fetch_metadata(record_ids=all_neighbor_ids_flat, dataset=dataset, model=model)
    # else:
    #     # For records
    #     records_df = df.loc[record_ids].copy()
    #     records_df['record_id'] = records_df.index
    #     records_df = records_df.replace([np.inf, -np.inf], np.nan).dropna()
    #     records = records_df.to_dict(orient='records')

    #     # For neighbors
    #     neighbors_df = df.loc[all_neighbor_ids_flat].copy()
    #     neighbors_df['record_id'] = neighbors_df.index
    #     neighbors_df = neighbors_df.replace([np.inf, -np.inf], np.nan).dropna()
    #     neighbors = neighbors_df.to_dict(orient='records')

    # Activity and non-activity both
    # Temporary use of CSV file for metadata
    records_df = dataset.df.loc[record_ids].copy()
    records_df['record_id'] = records_df.index
    records_df = records_df.replace([np.inf, -np.inf], np.nan).dropna()   
    records = records_df.to_dict(orient='records')

    # For neighbors
    neighbors_df = dataset.df.loc[all_neighbor_ids_flat].copy()
    neighbors_df['record_id'] = neighbors_df.index
    neighbors_df = neighbors_df.replace([np.inf, -np.inf], np.nan).dropna()
    neighbors = neighbors_df.to_dict(orient='records')

    # DEBUG
    print(f"Record IDs before mapping: {record_ids[:10]}")
    print(f"Record IDs after mapping: {[rec['record_id'] for rec in records[:10]]}")
    for rec in records[:10]:
        print(f"Record ID: {rec['record_id']}, Image ID: {rec['image_id']}, Time: {rec['time']}")



    # print(f"Prepare response - Retrieving metadata for {dataset} dataset:")
    # print(f"Retrieved {len(records)} main records")
    # print(f"Retrieved {len(all_neighbor_ids_flat)} neighbor records")

    # Step 2.5: Add img_link to records
    def add_img_link(dataset_name: str, record):
        if "vbs25" in dataset_name:
            return f"{image_server_url}/{dataset_name.split('_')[1].upper()}/{record['image_id']}{image_extension}"
        else:
            return f"{image_server_url}/{record['image_id']}{image_extension}"
        
    for record in records:
        record['img_link'] = add_img_link(dataset_name, record)
    for record in neighbors:
        record['img_link'] = add_img_link(dataset_name, record)

    # Step 3: Build a mapping for fast access
    neighbor_metadata = {rec['record_id']: rec for rec in neighbors}

    # Step 4: Build output with actual available neighbors
    result = []
    for i, record in enumerate(records):
        rid = record['record_id']
        record['score'] = scores[i] if scores else 0
        if neighbors:
            neighbors_for_this_rid = []
            for nid in all_neighbor_ids[rid]:
                if nid in neighbor_metadata:
                    neighbors_for_this_rid.append(neighbor_metadata[nid])
            record['neighbors'] = neighbors_for_this_rid
        result.append(record)

        if len(result) >= top_k:
            break

    # DEBUG
    # N = 5
    # print(f"First {N} records:")
    # print_records_sample(result, n=min(N, len(result)))
    return result
