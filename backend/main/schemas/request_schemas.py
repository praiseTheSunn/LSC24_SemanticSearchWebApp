from pydantic import BaseModel
from typing import Dict
from schemas import options_schemas

class RequestSearchByImageQuery(BaseModel):
    image_base64: str
    model: options_schemas.ModelOptions

class RequestSearchByTextQuery(BaseModel):
    text_query: str
    model: options_schemas.ModelOptions
    mode: options_schemas.ModeOptions
    obj_global_encoding: Dict[str, int]
    obj_local_encoding: str
    color_global_encoding: Dict[str, int]
    color_local_encoding: str

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

    class Config:
        json_schema_extra = {
            "example": {
                    "image_url": "http://34.124.236.208/img_lsc/201903/15/20190315_130858_000.webp",
                    "span": 30
            }
        }