from fastapi import FastAPI #import class FastAPI() từ thư viện fastapi

import os
from PIL import Image
import PIL
# import matplotlib.pyplot as plt
from tqdm import tqdm
import numpy as np
import pandas as pd
import pickle
import glob

import torch
# from datasets import Dataset, Image
from torch.utils.data import DataLoader

from typing import List, Union, Tuple

import open_clip

import faiss
from helper.embedding_helper import search_text_query

from helper.setup import setup

print("setting up!")
device, model, preprocess, keyframe_paths, index = setup()
print("setup done!")

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/search")
async def search(text_query: str):
    
    paths = search_text_query(index, keyframe_paths, model, text_query)

    return {"paths": paths}
    

