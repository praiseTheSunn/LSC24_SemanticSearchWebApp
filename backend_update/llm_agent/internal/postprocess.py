import numpy as np
import json
import pandas as pd
import itertools
import httpx
import os
from typing import List, Dict, Any, Optional
from dataset.dataset_manager import DatasetManager

# Use environment variable or default
MAIN_SERVICE_URL = os.getenv("MAIN_SERVICE_URL", "http://localhost:8000")


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
    print(f"Masked out record ids: {record_ids}")

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



async def prepare_response(
    dataset: str,
    model: str,
    record_ids: List[int] = [],
    scores: Optional[List[float]] = None,
    display_window_size: int = 3,
    top_k: int = 100
) -> List[Dict[str, Any]]:
    """
    Prepare formatted response with metadata for the given record IDs.
    Makes an API call to the main service to fetch metadata.
    
    Args:
        dataset: Dataset name (e.g., 'lsc24', 'vbs25_v3c')
        model: Model name
        record_ids: List of record IDs to fetch
        scores: Optional list of scores corresponding to record_ids
        display_window_size: Window size for neighbors
        top_k: Maximum number of results to return
        
    Returns:
        List of records with metadata, image links, and neighbors
    """
    if not record_ids:
        return []
    
    dataset_name = dataset.lower()
    dataset = DatasetManager.get_dataset(dataset_name)
    image_server_url = dataset.get_image_server_url()
    image_extension = dataset.get_image_extension()
    
    # Limit record_ids to top_k if needed
    record_ids = record_ids[:top_k]
    if scores:
        scores = scores[:top_k]
    
    all_neighbor_ids = {}
    for record_id in record_ids:
        all_neighbor_ids[record_id] =  list(range(max(0, record_id - display_window_size), min(record_id + display_window_size + 1, len(dataset.df))))
    all_neighbor_ids_flat = list(set(itertools.chain.from_iterable(all_neighbor_ids.values())))
    

    print(f"[prepare_response] Validating record ids for dataset: {dataset_name}")
    print(f"[prepare_response] Number of record ids: {len(record_ids)}")
    print(f"[prepare_response] Number of neighbor ids (unique): {len(all_neighbor_ids_flat)}")
    print(f"[prepare_response] List of record ids: {record_ids}")
    print(f"Model: {model}")


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
    print(f"[prepare_response] Record IDs before mapping: {record_ids[:10]}")
    print(f"[prepare_response] Record IDs after mapping: {[rec['record_id'] for rec in records[:10]]}")
    for rec in records[:10]:
        print(f"Record ID: {rec['record_id']}, Image ID: {rec['image_id']}, Time: {rec['time']}")
    
    
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

    return result
