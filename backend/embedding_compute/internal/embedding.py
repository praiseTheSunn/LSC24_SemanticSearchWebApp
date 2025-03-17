import setup
import open_clip
import torch
from models import ModelManager

modelManager = ModelManager()

def compute_image_embedding(image_base64: str, model: str):
    if image_base64 == None or model == None:
        return None

    # Strip data URI prefix if present
    if image_base64.startswith('data:image'):
        image_base64 = image_base64.split(',')[1]

    # Fix the padding of the Base64 string if necessary
    missing_padding = len(image_base64) % 4
    if missing_padding != 0:
        print(f"Padding the Base64 string with {missing_padding} '=' characters.")
        image_base64 += '=' * (4 - missing_padding)
    print(f"Length of base64 string after padding: {len(image_base64)}")

    model_instance = modelManager.get_model(model)
    if model_instance == None:
        return None
    return model_instance.calc_image_embedding(image_base64)

def compute_text_embedding(text_query: str, model: str):
    if text_query == None or model == None:
        return None
    model_instance = modelManager.get_model(model)
    if model_instance == None:
        return None
    return model_instance.calc_text_embedding(text_query)