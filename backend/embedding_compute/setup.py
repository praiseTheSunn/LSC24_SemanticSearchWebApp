import time
import torch
import open_clip
import os
import yaml
from models import ModelManager

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

system_config_file = os.getenv('SYSTEM_CONFIG', '../configs/system_config.yaml')   # Default to system_config.yaml
system_config = load_config(system_config_file)

clips_model = ModelManager().get_model('clips')
