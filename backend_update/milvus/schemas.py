from pydantic import BaseModel
from enum import Enum
from typing import List, Literal, Tuple, Dict
from setup import available_models, available_datasets


class DatasetOptions(str, Enum):
    option1 = "vbs25_v3c"
    option2 = "vbs25_mvk"
    option3 = "vbs25_lhe"
    option4 = "aic24"
    option5 = "aic24_lesson"
    option6 = "aic24_cooking"
    option7 = "lsc24"
    option8 = "lsc24a"


class ModelOptions(str, Enum):
    option1 = "clips"
    option2 = "appleclip"


class SearchRequest(BaseModel):
    dataset: DatasetOptions
    model: ModelOptions
    embedding: List[List[float]]
    filters: Dict[str, str] = {}
    limit: int
    subset_record_ids: List[int] = []

    class Config:
        schema_extra = {
            "example": {
                "dataset": "lsc24",
                "model": "clips",
                "embedding": [[0.1, 0.2, 0.3]],
                "filters": {"location": "kitchen", "activity": "preparing some food"},
                "limit": 5,
                "subset_record_ids": [1, 2, 3]
            }
        }


class FetchMetadataRequest(BaseModel):
    dataset: DatasetOptions
    model: ModelOptions
    record_ids: List[int]


class FetchRequest(BaseModel):
    collection_name: str
    record_ids: List[int] = []

    class Config:
        schema_extra = {
            "example": {
                "collection_name": "lsc24_clips",
                "record_ids": [1, 2, 3]
            }
        }
