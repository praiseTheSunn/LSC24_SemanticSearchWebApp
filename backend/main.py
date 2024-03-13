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
from datetime import datetime

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
# device, model, preprocess, keyframe_paths, index = setup()
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
    
@app.get("/image/{file_url:path}")
async def get_image(file_url: str):
    # file_url = file_url.replace("file://", "")
    print(file_url)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    
    return FileResponse(file_url, media_type='image/jpeg', headers=header)

@app.get("/query/{query_text}")
async def get_images(query_text: str):
    # file_url = file_url.replace("file://", "")
    print(query_text)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    image_folder = keyframes_path + '\\201901\\01'
    image_files = glob.glob(image_folder + '/*.jpg')[:1000]  # Get the first 1000 jpg files in the folder
    
    return JSONResponse(content={"image_files": image_files}, headers=header)

@app.get("/similars/{file_url:path}")
def get_similars(file_url: str):
    # DUMMY CODE
    print(file_url)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    image_folder = keyframes_path + '\\201901\\01'
    image_files = glob.glob(image_folder + '/*.jpg')[:1000]  # Get the first 1000 jpg files in the folder
    
    return JSONResponse(content={"image_files": image_files}, headers=header)

@app.get("/neighbors/{file_url:path}")
def get_neighbors(file_url: str):
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    num_images = 200

    # List all files in the folder
    folder_path = os.path.dirname(file_url)
    all_image_files = glob.glob(os.path.join(folder_path, '*.jpg'))

    # Filter and sort image files by timestamp
    image_files_with_timestamp = []
    for image_file in all_image_files:
        filename = os.path.basename(image_file)
        try:
            timestamp_str = filename.split('_')[0] + filename.split('_')[1]
            file_timestamp = datetime.strptime(timestamp_str, '%Y%m%d%H%M%S')
            image_files_with_timestamp.append((file_timestamp, image_file))
        except ValueError:
            continue  # Skip files without valid timestamps

    image_files_with_timestamp.sort(key=lambda x: x[0])  # Sort by timestamp

    # Find index of given image path
    index = None
    norm_file_url = os.path.normpath(file_url)
    for i, (_, file_path) in enumerate(image_files_with_timestamp):
        print(os.path.normpath(file_path))
        if os.path.normpath(file_path) == norm_file_url:
            index = i
            break

    if index is None:
        # print(all_image_files)
        print(f"File {file_url} not found in the folder")
        return JSONResponse(content={"image_files": []}, headers=header)

    # Get 30 images before and after the given image
    start_index = max(0, index - num_images)
    end_index = min(len(image_files_with_timestamp), index + num_images + 1)

    images_around = [file_path for _, file_path in image_files_with_timestamp[start_index:end_index]]
    # print('images_around', images_around)

    return JSONResponse(content={"image_files": images_around}, headers=header)