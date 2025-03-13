from pydantic import BaseModel
from typing import Literal

class TextEmbeddingRequest(BaseModel):
    text_query: str
    model: Literal["clips"]

class ImageEmbeddingRequest(BaseModel):
    image_base64: str
    model: Literal["clips"]
