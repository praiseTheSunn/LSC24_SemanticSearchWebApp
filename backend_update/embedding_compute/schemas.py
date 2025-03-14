from pydantic import BaseModel
from typing import Literal
from setup import available_models


ModelType = Literal[tuple(available_models)] if available_models else str


class TextEmbeddingRequest(BaseModel):
    text_query: str
    model: ModelType

    class Config:
        schema_extra = {
            "example": {
                "text_query": "This is a sample query",
                "model": "clips"
            }
        }


class ImageEmbeddingRequest(BaseModel):
    image_base64: str
    model: ModelType

    class Config:
        schema_extra = {
            "example": {
                "image_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
                "model": "clips"
            }
        }
