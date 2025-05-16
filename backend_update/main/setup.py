import os
import yaml

# configs
def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

system_config_file = os.getenv('SYSTEM_CONFIG')
system_config = load_config(system_config_file)
available_datasets = system_config.get("available_datasets", [])
available_models = system_config.get("available_models", [])


# SPACY
import spacy
nlp = spacy.load('en_core_web_sm')


# IMAGE DATASET
import sys
sys.path.append("..")

from dataset.dataset_manager import DatasetManager
dataset_manager = DatasetManager()



