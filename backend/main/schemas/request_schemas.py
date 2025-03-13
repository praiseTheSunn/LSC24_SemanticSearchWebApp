from pydantic import BaseModel
from typing import Dict, Optional
from schemas import options_schemas

class RequestSearchByImageQuery(BaseModel):
    image_base64: str
    model: options_schemas.ModelOptions
    dataset: Optional[options_schemas.DatasetOptions] = options_schemas.DatasetOptions.option1

class RequestSearchByTextQuery(BaseModel):
    user_id: str
    text_query: str
    model: options_schemas.ModelOptions
    mode: options_schemas.ModeOptions
    dataset: Optional[options_schemas.DatasetOptions] = options_schemas.DatasetOptions.option1
    object_global_encoding: Optional[Dict[str, int]] = {}
    object_local_encoding: Optional[str] = ""
    color_global_encoding: Optional[Dict[str, int]] = {}
    color_local_encoding: Optional[str] = ""
    pose_local_encoding: Optional[str] = ""

    class Config:
        json_schema_extra = {
            "example": {
                    "text_query": "Lots of colourful mugs for sale in Bangkok. Yellow, red, green, blue, orange cups.",
                    "model": "stfm",
                    "mode": "smt-3m-dtin"
            }
        }

class RequestExploreSimilarImages(BaseModel):
    image_urls: list[str]
    model: options_schemas.ModelOptions
    dataset: Optional[options_schemas.DatasetOptions] = options_schemas.DatasetOptions.option4

    class Config:
        json_schema_extra = {
            "example": {
                    "image_urls": [
                        "201903/15/20190315_130858_000",
                        "202006/02/20200602_101851_000",
                        "201909/13/20190913_120552_000",
                    ],
                    "model": "clips"
            }
        }

class RequestExploreNeighborImages(BaseModel):
    image_url: str
    span: int
    dataset: Optional[options_schemas.DatasetOptions] = options_schemas.DatasetOptions.option1

    class Config:
        json_schema_extra = {
            "example": {
                    "image_url": "http://34.124.236.208/img_lsc/201903/15/20190315_130858_000.webp",
                    "span": 30
            }
        }

class RequestFeedbackRelevant(BaseModel):
    ids: list[str]
    prior_scores: list[float]
    limit: int

class RequestFeedbackIrrelevant(BaseModel):
    ids: list[str]
    limit: int

class RequestFeedback(BaseModel):
    like: RequestFeedbackRelevant
    dislike: RequestFeedbackIrrelevant
    model: options_schemas.ModelOptions
    dataset: Optional[options_schemas.DatasetOptions] = options_schemas.DatasetOptions.option4

    class Config:
        json_schema_extra = {
            "example": {
                "like": {
                    "ids": [
                    "201902/01/20190201_081133_000", "201902/01/20190201_081621_000"
                    ],
                    "prior_scores": [
                    0.1, 0.05
                    ],
                    "limit": 10
                },
                "dislike": {
                    "ids": [
                    
                    ],
                    "limit": 10
                },
                "model": "clips",
                "dataset": "lsc24"
            }
        }