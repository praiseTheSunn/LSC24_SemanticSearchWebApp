import time
import torch
import open_clip
import config

# beit3
print("Loading beit3 model...")
start_time = time.time()
from model.beit3 import beit3
print(f"Done loading beit3 model in {time.time() - start_time} seconds.\n")

# clip
print("Loading clip model...")
start_time = time.time()
clip_model, _, clip_preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained=config.clip_model_path)
print(f"Done loading clip model in {time.time() - start_time} seconds.\n")

# blip2
from torch import hub
from lavis.models import load_model_and_preprocess
print("Loading blip2 model...")
start_time = time.time()
hub.set_dir(config.blip2_model_path)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
blip2_model, blip2_vis_processors, blip2_txt_processors = load_model_and_preprocess(name="blip2_feature_extractor", model_type="pretrain", is_eval=True, device=device)
print(f"Done loading blip2 model in {time.time() - start_time} seconds.\n")

# sentence_transformers
print("Loading stfm model...")
from sentence_transformers import SentenceTransformer
tfm_model = SentenceTransformer('all-mpnet-base-v2', device=device)
print(f"Done loading stfm model in {time.time() - start_time} seconds.\n")