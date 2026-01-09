from dotenv import load_dotenv
from pathlib import Path

# Load .env from repo root (or nearest parent)
load_dotenv()

import os
import yaml

def load_yaml(p: Path):
    with p.open("r") as f:
        return yaml.safe_load(f)
    

CONFIG_DIR = Path(os.environ.get("CONFIG_DIR", "./configs")).resolve()
SYSTEM_CONFIG_NAME = os.environ.get("SYSTEM_CONFIG", "system_config.yaml")
SYSTEM_CONFIG_PATH = (CONFIG_DIR / SYSTEM_CONFIG_NAME).resolve()
SYSTEM_CONFIG = load_yaml(SYSTEM_CONFIG_PATH)


# SPACY
import spacy
nlp = spacy.load('en_core_web_sm')


# IMAGE DATASET
from dataset.dataset_manager import DatasetManager
dataset_manager = DatasetManager()



