import time
import torch
import open_clip
import os
import yaml

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

system_config_file = os.getenv('SYSTEM_CONFIG', '../configs/system_config.yaml')   # Default to system_config.yaml
system_config = load_config(system_config_file)


# # beit3
# print("Loading beit3 model...")
# start_time = time.time()
# from model.beit3 import beit3
# print(f"Done loading beit3 model in {time.time() - start_time} seconds.\n")

# clip
print("Loading clip model...")
start_time = time.time()
clip_model, _, clip_preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained='laion2b_s32b_b79k')
# clip_model, _, clip_preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained=system_config['models']['clip_model_path'])
print(f"Done loading clip model in {time.time() - start_time} seconds.\n")

# # clip_v32
# print("Loading clip_v32 model...")
# start_time = time.time()
# clip_v32_model, clip_v32_preprocess = clip.load("ViT-B/32")
# print(f"Done loading clip_v32 model in {time.time() - start_time} seconds.\n")

# blip2
from torch import hub
from lavis.models import load_model_and_preprocess
print("Loading blip2 model...")
start_time = time.time()
# hub.set_dir(system_config['models']['blip2_model_path'])
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
blip2_model, blip2_vis_processors, blip2_txt_processors = load_model_and_preprocess(name="blip2_feature_extractor", model_type="pretrain", is_eval=True, device=device)
print(f"Done loading blip2 model in {time.time() - start_time} seconds.\n")

# # sentence_transformers
# print("Loading stfm model...")
# from sentence_transformers import SentenceTransformer
# tfm_model = SentenceTransformer('all-mpnet-base-v2', device=device)
# print(f"Done loading stfm model in {time.time() - start_time} seconds.\n")