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
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.responses import JSONResponse

import open_clip

import faiss
from settings import keyframes_path
# from helper.embedding_helper import search_text_query

# from helper.setup import setup
from fastapi.middleware.cors import CORSMiddleware


print("setting up!")
from helper import setup
print("setup done!")

app = FastAPI()
# Configure CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow requests from any origin
    allow_credentials=True,
    allow_methods=["GET"],  # Only allow GET requests
    allow_headers=["*"],  # Allow all headers
)


# @app.get("/")
# async def root():
#     return {"message": "Hello World"}

# @app.get("/search")
# async def search(text_query: str):
    
#     paths = search_text_query(index, keyframe_paths, model, text_query)

#     return {"paths": paths}
    
# return an image file from url
@app.get("/image/{file_url:path}")
async def get_image(file_url: str):
    # file_url = file_url.replace("file://", "")
    print(file_url)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    
    return FileResponse(file_url, media_type='image/jpeg', headers=header)

# return image paths of images that are results from a text query
@app.get("/query/{query_text}")
async def get_matched_image_paths(query_text: str):
    # file_url = file_url.replace("file://", "")
    print(query_text)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    
    image_folder = keyframes_path + '\\201901\\01'
    image_files = glob.glob(image_folder + '/*.jpg')[:1000]  # Get the first 1000 jpg files in the folder
    
    return JSONResponse(content={"image_files": image_files}, headers=header)

# @app.get("/images")
# async def get_images():
#     header = {
#         'Access-Control-Allow-Origin': '*'
#     }
#     print("get_images")
#     image_folder = 'E:\\LSCDATA\\keyframes\\201901\\01'
#     image_files = glob.glob(image_folder + '/*.jpg')[:10]
#     print(image_files)
#     # return [FileResponse(file, media_type='image/jpeg', headers=header) for file in image_files]
#     async def image_generator():
#         for file in image_files:
#             with open(file, "rb") as image_file:
#                 # Determine the content type based on file extension
#                 # content_type, _ = mimetypes.guess_type(file)
#                 yield {
#                     "content": image_file.read(),
#                     "content_type": "image/jpeg",
#                 }

#     return StreamingResponse(image_generator(), headers=header, media_type="multipart/form-data")
