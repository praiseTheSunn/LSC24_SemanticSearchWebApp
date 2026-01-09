import numpy as np
import json
import pandas as pd
import itertools
from pprint import pprint
import httpx
import os
from typing import List, Dict, Any, Optional

# Use environment variable or default
MAIN_SERVICE_URL = os.getenv("MAIN_SERVICE_URL", "http://localhost:8000")


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
    
    # Limit record_ids to top_k if needed
    record_ids = record_ids[:top_k]
    if scores:
        scores = scores[:top_k]
    
    print(f"[prepare_response] Fetching metadata for {len(record_ids)} records from {dataset_name}")
    
    try:
        # Call main service to get metadata
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "dataset": dataset_name,
                "model": model,
                "record_ids": record_ids,
                "display_window_size": display_window_size
            }
            
            response = await client.post(
                f"{MAIN_SERVICE_URL}/metadata/batch",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            
            # Add scores to the result
            if scores and len(scores) == len(result):
                for i, record in enumerate(result):
                    record['score'] = scores[i]
            
            print(f"[prepare_response] Successfully fetched {len(result)} records")
            return result
            
    except httpx.HTTPError as e:
        print(f"[prepare_response] HTTP error fetching metadata: {e}")
        # Fallback: return minimal structure
        return [
            {
                "record_id": rid,
                "score": scores[i] if scores and i < len(scores) else 0.0,
                "img_link": f"{MAIN_SERVICE_URL}/image/{dataset_name}/{rid}",
            }
            for i, rid in enumerate(record_ids)
        ]
    except Exception as e:
        print(f"[prepare_response] Error preparing response: {e}")
        return []
