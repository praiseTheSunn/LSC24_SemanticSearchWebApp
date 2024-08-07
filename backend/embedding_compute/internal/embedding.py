import setup
import open_clip
import torch 
from model.beit3 import beit3

def compute_embedding(text_query: str, model: str):
    if text_query == None or model == None:
        return None
    if model == 'clip':
        text_query_tokens = open_clip.tokenize(text_query)
        text_embedding = setup.clip_model.encode_text(text_query_tokens)
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