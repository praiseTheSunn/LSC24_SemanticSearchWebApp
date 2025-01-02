from pydantic import BaseModel
from typing import Dict, Optional
from schemas import options_schemas

class RequestSearchByImageQuery(BaseModel):
    image_base64: str
    model: options_schemas.ModelOptions
    dataset: Optional[options_schemas.DatasetOptions] = options_schemas.DatasetOptions.option1

class RequestSearchByTextQuery(BaseModel):
    text_query: str
    model: options_schemas.ModelOptions
    mode: options_schemas.ModeOptions
    window_size: int = 3
    dataset: Optional[options_schemas.DatasetOptions] = options_schemas.DatasetOptions.option1
    object_global_encoding: Optional[Dict[str, int]] = {}
    object_local_encoding: Optional[str] = ""
    color_global_encoding: Optional[Dict[str, int]] = {}
    color_local_encoding: Optional[str] = ""
    pose_local_encoding: Optional[str] = ""

    class Config:
        json_schema_extra = {
            "example": {
                    "text_query": "a wedding",
                    "model": "clips",
                    "mode": "vec",
                    "window_size": 3,
            }
        }

class RequestExploreSimilarImages(BaseModel):
    image_urls: list[str]
    model: options_schemas.ModelOptions
    dataset: Optional[options_schemas.DatasetOptions] = options_schemas.DatasetOptions.option1

    class Config:
        json_schema_extra = {
            "example": {
                    "image_urls": [
                        "http://34.124.236.208/img_lsc/201903/15/20190315_130858_000.webp",
                        "http://34.124.236.208/img_lsc/202006/02/20200602_101851_000.webp",
                        "http://34.124.236.208/img_lsc/201909/13/20190913_120552_000.webp",
                    ],
                    "model": "stfm"
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
    # text_query: str
    image_urls: list[str]
    prior_scores: list[float]
    limit: int

class RequestFeedbackIrrelevant(BaseModel):
    image_urls: list[str]
    limit: int

class RequestFeedback(BaseModel):
    like: RequestFeedbackRelevant
    dislike: RequestFeedbackIrrelevant
    model: options_schemas.ModelOptions
    dataset: Optional[options_schemas.DatasetOptions] = options_schemas.DatasetOptions.option1