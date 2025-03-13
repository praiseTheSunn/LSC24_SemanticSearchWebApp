from abc import ABC, abstractmethod
from typing import Any
import setup
import time
import torch
import torch.nn.functional as F
from torch import hub
import open_clip
from transformers import AutoModel, CLIPImageProcessor
from setup import system_config


# Base class with a virtual method
class ModelBase(ABC):
    @abstractmethod
    def calc_text_embedding(self, text_query: str) -> Any:
        """Virtual method to calculate text embedding"""
        pass

    

# XLM-RoBERTa
class XlmRobertaModel(ModelBase):
    def __init__(self):
        print("Loading xlm-roberta model...")
        start_time = time.time()
        self.model, _, self.preprocess = open_clip.create_model_and_transforms('hf-hub:xlm-roberta-large-ViT-H-14', pretrained='frozen_laion5b_s13b_b90k')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        torch.cuda.empty_cache()
        self.model = self.model.to(self.device)
        self.tokenizer = open_clip.get_tokenizer('hf-hub:xlm-roberta-large-ViT-H-14')
        print(f"Done loading xlm-roberta model in {time.time() - start_time} seconds.\n")

    def calc_text_embedding(self, text_query: str) -> Any:
        text_tokenized = self.tokenizer(text_query).to(self.device)
        text_embedding = self.model.encode_text(text_tokenized)            
        return text_embedding
    

# ViTamin
class VitaminModel(ModelBase):
    def __init__(self):
        print("Loading vitamin model...")
        start_time = time.time()
        self.model = AutoModel.from_pretrained('jienengchen/ViTamin-XL-384px', trust_remote_code=True)
        self.image_processor = CLIPImageProcessor.from_pretrained('jienengchen/ViTamin-XL-384px')
        # model, preprocess = create_model_from_pretrained('hf-hub:apple/DFN5B-CLIP-ViT-H-14-384')
        # tokenizer = get_tokenizer('ViT-H-14')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        torch.cuda.empty_cache()
        self.model = self.model.to(self.device)
        self.tokenizer = open_clip.get_tokenizer('laion/CLIP-ViT-L-14-DataComp.XL-s13B-b90K')
        print(f"Done loading vitamin model in {time.time() - start_time} seconds.\n")

    def calc_text_embedding(self, text_query: str) -> Any:
        text_tokenized = self.tokenizer(text_query).to(self.device)
        text_embedding = self.model.encode_text(text_tokenized)  
        return text_embedding



class ModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance.models = {
                # "xlm_roberta": XlmRobertaModel(),
                "vitamin": VitaminModel(),
            }
        return cls._instance

    def get_model(self, model_name: str) -> ModelBase:
        model = self.models.get(model_name)
        if not model:
            print(f"Model '{model_name}' not available.")
            return None
        return model