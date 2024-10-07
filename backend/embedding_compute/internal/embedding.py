import setup
import open_clip
import torch
import base64
import io
# from model.beit3 import beit3
from PIL import Image

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

    if model == 'clip':
        image_bytes = base64.b64decode(image_base64)           # bytes
        image_stream = io.BytesIO(image_bytes)                 # stream
        raw_image = Image.open(image_stream)                    
        image = setup.clip_preprocess(raw_image).unsqueeze(0)
        with torch.no_grad(), torch.cuda.amp.autocast():
            image_embedding = setup.clip_model.encode_image(image)
        return image_embedding
    return None

def compute_text_embedding(text_query: str, model: str):
    if text_query == None or model == None:
        return None
    if model == 'clip':
        text_query_tokens = open_clip.tokenize(text_query)
        text_embedding = setup.clip_model.encode_text(text_query_tokens)
        # with open('text_embedding.txt', 'w') as f:
        #     for row in text_embedding:
        #         for element in row:
        #             f.write(f"{str(element.item())},\n")
        return text_embedding
    if model == 'blip2':
        txt = setup.blip2_txt_processors["eval"](text_query)
        text_sample = {"image":  [], "text_input": [txt]}
        text_embedding = setup.blip2_model.extract_features(text_sample, mode="text").text_embeds[:, 0, :]
        return text_embedding
    if model == 'beit3':
        text_embedding = beit3.calc_text_embedding(text_query, beit3.tokenizer)
        return text_embedding
    if model == 'stfm':
        text_embedding = setup.tfm_model.encode(text_query)
        return text_embedding
    return None    