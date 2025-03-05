from abc import ABC, abstractmethod
from typing import Any
import setup
import time
import torch
import torch.nn.functional as F
import open_clip
from torch import hub
# from lavis.models import load_model_and_preprocess
from transformers import AutoModel, CLIPImageProcessor
from setup import system_config


# Base class with a virtual method
class ModelBase(ABC):
    @abstractmethod
    def calc_text_embedding(self, text_query: str) -> Any:
        """Virtual method to calculate text embedding"""
        pass


# # OpenCLIP
# class ClipModel(ModelBase):
#     def __init__(self):
#         print("Loading clip model...")
#         start_time = time.time()
#         self.model, _, self.preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained='laion2b_s32b_b79k')
#         # model, _, preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained=system_config['models']['clip_model_path'])
#         print(f"Done loading clip model in {time.time() - start_time} seconds.\n")        

#     def calc_text_embedding(self, text_query: str) -> Any:
#         text_query_tokens = open_clip.tokenize(text_query).to(self.device)
#         text_embedding = self.model.encode_text(text_query_tokens)
#         return text_embedding


# # BLIP-2
# class Blip2Model(ModelBase):
#     def __init__(self):
#         print("Loading blip2 model...")
#         start_time = time.time()
#         hub.set_dir(system_config['models']['blip2_model_path'])
#         self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
#         self.model, self.vis_processors, self.txt_processors = load_model_and_preprocess(name="blip2_feature_extractor", model_type="pretrain", is_eval=True, device=self.device)
#         print(f"Done loading blip2 model in {time.time() - start_time} seconds.\n")

#     def calc_text_embedding(self, text_query: str) -> Any:
#         txt = self.txt_processors["eval"](text_query)
#         text_sample = {"image":  [], "text_input": [txt]}
#         text_embedding = self.model.extract_features(text_sample, mode="text").text_embeds[:, 0, :]
#         return text_embedding
    

# XLM-RoBERTa
class XlmRobertaModel(ModelBase):
    def __init__(self):
        print("Loading xlm-roberta model...")
        start_time = time.time()
        self.model, _, self.preprocess = open_clip.create_model_and_transforms('xlm-roberta-large-ViT-H-14', pretrained='frozen_laion5b_s13b_b90k')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        torch.cuda.empty_cache()
        self.model = self.model.to(self.device)
        self.tokenizer = open_clip.get_tokenizer('xlm-roberta-large-ViT-H-14')
        print(f"Done loading xlm-roberta model in {time.time() - start_time} seconds.\n")

    def calc_text_embedding(self, text_query: str) -> Any:
        text_tokenized = self.tokenizer(text_query, context_length=self.model.context_length).to(self.device)
        text_embedding = self.model.encode_text(text_tokenized)
        return text_embedding
    

# ViTamin
class VitaminModel(ModelBase):
    def __init__(self):
        print("Loading vitamin model...")
        start_time = time.time()
        self.model = AutoModel.from_pretrained('jienengchen/ViTamin-XL-384px', trust_remote_code=True)
        self.image_processor = CLIPImageProcessor.from_pretrained('jienengchen/ViTamin-XL-384px')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        torch.cuda.empty_cache()
        self.model = self.model.to(self.device)
        self.tokenizer = open_clip.get_tokenizer('hf-hub:laion/CLIP-ViT-L-14-DataComp.XL-s13B-b90K')
        print(f"Done loading vitamin model in {time.time() - start_time} seconds.\n")

    def calc_text_embedding(self, text_query: str) -> Any:
        text_tokenized = self.tokenizer(text_query, context_length=self.model.context_length).to(self.device)
        text_embedding = self.model.encode_text(text_tokenized)
        return text_embedding
    

# AppleCLIP
class AppleClipModel(ModelBase):
    def __init__(self):
        print("Loading appleclip model...")
        start_time = time.time()
        self.model, self.preprocess = open_clip.create_model_from_pretrained('hf-hub:apple/DFN5B-CLIP-ViT-H-14-384')
        self.tokenizer = open_clip.get_tokenizer('ViT-H-14')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        torch.cuda.empty_cache()
        self.model = self.model.to(self.device)
        print(f"Done loading appleclip model in {time.time() - start_time} seconds.\n")

    def calc_text_embedding(self, text_query: str) -> Any:        
        text_query_tokens = self.tokenizer(text_query, context_length=self.model.context_length).to(self.device)
        text_embedding = self.model.encode_text(text_query_tokens)
        return text_embedding
    

# CLIPS
class ClipSModel(ModelBase):
    def __init__(self):
        print("Loading CLIPS model...")
        start_time = time.time()
        self.model, self.preprocess = open_clip.create_model_from_pretrained('hf-hub:UCSC-VLAA/ViT-L-14-CLIPS-Recap-DataComp-1B')
        self.tokenizer = open_clip.get_tokenizer('hf-hub:UCSC-VLAA/ViT-L-14-CLIPS-Recap-DataComp-1B')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        torch.cuda.empty_cache()
        self.model = self.model.to(self.device)
        print(f"Done loading CLIPS model in {time.time() - start_time} seconds.\n")

    def calc_text_embedding(self, text_query: str) -> Any:
        text_query_tokens = self.tokenizer(text_query, context_length=self.model.context_length).to(self.device)
        text_embedding = self.model.encode_text(text_query_tokens)
        text_embedding = F.normalize(text_embedding, dim=-1)
        return text_embedding
    






class ModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance.models = {
                # "clip": ClipModel(),
                # "blip2": Blip2Model(),
                # "xlm_roberta": XlmRobertaModel(),
                # "vitamin": VitaminModel(),
                # "appleclip": AppleClipModel(),
                "clips": ClipSModel()
            }
        return cls._instance

    def get_model(self, model_name: str) -> ModelBase:
        model = self.models.get(model_name)
        if not model:
            print(f"Model '{model_name}' not available.")
            return None
        return model