from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import csv
import os
import pandas as pd
from typing import List, Dict

import logging

router = APIRouter(
    prefix='/evaluate',
    tags=['evaluate'],
)

# Define request schema
class EvaluationRequest(BaseModel):
    query_id: str
    user_id: str
    image_id: str

# Path to the local CSV file
CSV_FILE_PATH = '/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/main/routers/thesis_query.csv'  # Adjust path as needed

def load_evaluation_data(csv_path: str) -> Dict[str, List[str]]:
    """
    Load the CSV and return a mapping from query_id to a list of image_ids.
    """
    data = {}
    df = pd.read_csv(csv_path)
    groups = df.groupby('Question')['Answer'].apply(list)
    for query_id, image_ids in groups.items():
        data[query_id] = image_ids

    print(f"Query IDs: {list(data.keys())}")
    return data

@router.post("")
async def evaluate(payload: EvaluationRequest):
    logging.info(f"Received evaluation feedback: {payload.model_dump()}")

    # Load evaluation data from CSV
    eval_data = load_evaluation_data(CSV_FILE_PATH)

    if payload.query_id not in eval_data:
        return JSONResponse(
            content={"status": status.HTTP_404_NOT_FOUND, "message": "Error: Query ID not found."},
            status_code=status.HTTP_404_NOT_FOUND,
            headers={'Access-Control-Allow-Origin': '*'}
        )

    if payload.image_id in eval_data[payload.query_id]:
        return JSONResponse(
            content={"status": status.HTTP_200_OK, "message": "CORRECT"},
            status_code=status.HTTP_200_OK,
            headers={'Access-Control-Allow-Origin': '*'}
        )
    else:
        return JSONResponse(
            content={"status": status.HTTP_200_OK, "message": "INCORRECT"},
            status_code=status.HTTP_200_OK,
            headers={'Access-Control-Allow-Origin': '*'}
        )
