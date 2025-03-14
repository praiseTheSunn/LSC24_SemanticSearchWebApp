from pydantic import BaseModel
from typing import List, Literal, Tuple
from setup import available_models, available_datasets


ModelType = Literal[tuple(available_models)] if available_models else str
DatasetType = Literal[tuple(available_datasets)] if available_datasets else str


class SearchRequest(BaseModel):
    dataset: DatasetType
    model: ModelType
    embedding: List[float]
    limit: int
    ids: List[str] = []

    class Config:
        schema_extra = {
            "example": {
                "dataset": "lsc24",
                "model": "clips",
                "embedding": [0.1, 0.2, 0.3],
                "limit": 5,
                "ids": [1, 2, 3]
            }
        }


class FetchRequest(BaseModel):
    collection_name: str
    ids: List[str] = []

    class Config:
        schema_extra = {
            "example": {
                "collection_name": "lsc24_clips",
                "ids": [1, 2, 3]
            }
        }
