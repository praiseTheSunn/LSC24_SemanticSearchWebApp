import time
import torch
import open_clip
import os
import yaml
import sys
sys.path.append("..")

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

system_config_file = os.getenv('SYSTEM_CONFIG', '../configs/system_config.yaml')   # Default to system_config.yaml
system_config = load_config(system_config_file)


# # beit3
# print("Loading beit3 model...")
# start_time = time.time()
# from data.model import beit3
# print(f"Done loading beit3 model in {time.time() - start_time} seconds.\n")



# # xlm-roberta
# print("Loading xlm-roberta model...")
# start_time = time.time()
# xlm_model, _, xlm_preprocess = open_clip.create_model_and_transforms('xlm-roberta-large-ViT-H-14', pretrained='frozen_laion5b_s13b_b90k')
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# torch.cuda.empty_cache()
# xlm_model = xlm_model.to(device)
# xlm_tokenizer = open_clip.get_tokenizer('xlm-roberta-large-ViT-H-14')
# print(f"Done loading xlm-roberta model in {time.time() - start_time} seconds.\n")
