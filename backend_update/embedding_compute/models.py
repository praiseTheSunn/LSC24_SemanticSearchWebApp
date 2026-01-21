from abc import ABC, abstractmethod
from typing import Any
import os
import time
import torch
import torch.nn.functional as F
from torch import hub
import open_clip
from transformers import AutoModel, CLIPImageProcessor
from dotenv import load_dotenv

load_dotenv()

# Base class with a virtual method
class ModelBase(ABC):
    @abstractmethod
    def calc_text_embedding(self, text_query: str) -> Any:
        """Virtual method to calculate text embedding"""
        pass


# CLIPS
class ClipSModel(ModelBase):
    def __init__(self):
        print("Loading CLIPS model...")
        start_time = time.time()
        self.model, self.preprocess = open_clip.create_model_from_pretrained('hf-hub:UCSC-VLAA/ViT-L-14-CLIPS-Recap-DataComp-1B', cache_dir=os.environ.get("CHECKPOINT_DIR", None))
        self.tokenizer = open_clip.get_tokenizer('hf-hub:UCSC-VLAA/ViT-L-14-CLIPS-Recap-DataComp-1B', cache_dir=os.environ.get("CHECKPOINT_DIR", None))
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        torch.cuda.empty_cache()
        self.model = self.model.to(self.device)
        print(f"Done loading CLIPS model in {time.time() - start_time} seconds.\n")

    def calc_text_embedding(self, text_query: str) -> Any:
        text_query_tokens = self.tokenizer(text_query, context_length=self.model.context_length).to(self.device)
        text_embedding = self.model.encode_text(text_query_tokens)
        text_embedding = F.normalize(text_embedding, dim=-1)
        return text_embedding
    
    def calc_image_embedding(self, raw_image: torch.Tensor):
        # Get model device + dtype automatically
        param = next(self.model.parameters())
        model_device = param.device
        model_dtype = param.dtype

        # Move + cast image to match model
        image = self.preprocess(raw_image).unsqueeze(0).to(device=model_device, dtype=model_dtype)

        # Use autocast only if model is in half precision
        use_amp = model_dtype in (torch.float16, torch.bfloat16)

        with torch.no_grad():
            if use_amp:
                with torch.amp.autocast(device_type=model_device.type, dtype=model_dtype):
                    image_embedding = self.model.encode_image(image)
            else:
                image_embedding = self.model.encode_image(image)

            image_embedding = F.normalize(image_embedding, dim=-1)

        return image_embedding
    

class ModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance.models = {
                "clips": ClipSModel(),
            }       
        return cls._instance

    def get_model(self, model_name: str) -> ModelBase:
        model = self.models.get(model_name)
        if not model:
            print(f"Model '{model_name}' not available.")
            return None
        return model

print("Loading models...")
model_manager = ModelManager()