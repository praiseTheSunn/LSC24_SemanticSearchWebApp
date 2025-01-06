from pydantic import BaseModel
from enum import Enum
from typing import List, Optional


class DatasetOptions(str, Enum):
    option1 = "vbs25_v3c"
    option2 = "vbs25_mvk"
    option3 = "vbs25_lhe"
    option4 = "aic24"
    option5 = "aic24_lesson"
    option6 = "aic24_cooking"

class SearchRequest(BaseModel):
    model: str
    embedding: List[List[float]]
    limit: Optional[int] = 1000
    dataset: Optional[DatasetOptions] = DatasetOptions.option1
    ids: Optional[List[int]] = None

class GetRequest(BaseModel):
    collection_name: str
    ids: List[int]
    dataset: Optional[DatasetOptions] = DatasetOptions.option1
