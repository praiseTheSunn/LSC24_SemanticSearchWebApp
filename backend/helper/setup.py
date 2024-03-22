import open_clip
import settings
import faiss
import glob
import os
import spacy
import pandas as pd
from helper import loader
from tqdm import tqdm
import time
from whoosh.qparser import QueryParser
from whoosh.qparser.plugins import FuzzyTermPlugin
import concurrent.futures

device = "cpu"
num_results = 10000

start_time = time.time()
print("loading keyframe paths")
keyframe_paths = sorted(glob.glob(os.path.join(settings.keyframes_path, "*/*/*.jpg")))
keyframe_paths_dict = {path: order for order, path in enumerate(keyframe_paths)}
all_image_ids_dict = {path[-23:]: order for order, path in enumerate(keyframe_paths)}
print(f"Done loading keyframe paths in {time.time() - start_time} seconds.\n")

# print("loading clip model")
# model, _, preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained=settings.clip_model_path) 
# print(f"Done loading clip model in {time.time() - start_time} seconds.\n")

# print("loading clip index")
# clip_index = faiss.read_index(settings.clip_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)
# print(f"Done loading clip index in {time.time() - start_time} seconds.\n")

# print("loading git index")
# git_index = faiss.read_index(settings.git_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)
# print(f"Done loading git index in {time.time() - start_time} seconds.\n")

# print("loading object clip index")
# object_clip_index = faiss.read_index(settings.object_clip_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)
# print(f"Done loading clip model in {time.time() - start_time} seconds.\n")

# print("loading blip2 model")
# from torch import hub
# hub.set_dir(settings.blip2_model_path)
# import torch
# from lavis.models import load_model_and_preprocess
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# model, vis_processors, txt_processors = load_model_and_preprocess(name="blip2_feature_extractor", model_type="pretrain", is_eval=True, device=device)
# print(f"Done loading blip2 model in {time.time() - start_time} seconds.\n")

# print("loading blip2 index")
# blip2_index = faiss.read_index(settings.blip2_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)
# print(f"Done loading blip2 index in {time.time() - start_time} seconds.\n")

print("loading sentence-transformers model")
from sentence_transformers import SentenceTransformer
tfm_model = SentenceTransformer('all-mpnet-base-v2', device=device)
print(f"Done loading sentence-transformers model in {time.time() - start_time} seconds.\n")

print("loading caption git index")
caption_git_index = faiss.read_index(settings.git_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)
print(f"Done loading caption git index in {time.time() - start_time} seconds.\n")

print("loading object blip2 index")
object_blip2_index = faiss.read_index(settings.object_blip2_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)
print(f"Done loading object blip2 index in {time.time() - start_time} seconds.\n")




print("loading nlp parser")
nlp = spacy.load("en_core_web_sm")
print(f"Done loading nlp parser in {time.time() - start_time} seconds.\n")

print("loading object list and location category list")
object_list = loader.load_object_list()
location_category_list = loader.load_location_category_list()  
print(f"Done loading object and location category list in {time.time() - start_time} seconds.\n")

print("loading metadata for object and location category")
# Read CSVs in parallel
with concurrent.futures.ThreadPoolExecutor() as executor:
    object_df_future = executor.submit(pd.read_csv, settings.metadata_object_path)
    loccat_df_future = executor.submit(pd.read_csv, settings.metadata_categories_path)
    time_df_future = executor.submit(pd.read_csv, settings.metadata_time_path)
# Get results
object_df = object_df_future.result()
loccat_df = loccat_df_future.result()
time_df = time_df_future.result()
# Create lists
object_dict = {row['ImageID']: set(row['object'].split(',')) for _, row in object_df.iterrows() if not pd.isna(row['object'])}
loccat_dict = {row['ImageID']: row['categories'] for _, row in loccat_df.iterrows() if not pd.isna(row['categories'])}
time_dict = {row['ImageID']: [row['local_date'], row['local_time']] for _, row in time_df.iterrows()}
# Print completion message
print(f"Done loading metadata in {time.time() - start_time} seconds.\n")


print("loading fuzzy index for location search")
from whoosh.index import open_dir   
ix = open_dir(settings.fuzzy_index_path)
searcher = ix.searcher()   
qp = QueryParser("place", schema=ix.schema)
qp.add_plugin(FuzzyTermPlugin())
print(f"Done loading fuzzy index in {time.time() - start_time} seconds.\n")

OFFSET_OBJECT_START = 0
OFFSET_OBJECT_END = OFFSET_OBJECT_START + len(object_list)
OFFSET_LOCATION_START = OFFSET_OBJECT_END
OFFSET_LOCATION_END = OFFSET_LOCATION_START + len(location_category_list)

# def setup():
#     device = "cpu"
#     # model, _, preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained='laion2b_s32b_b79k', cache_dir=global_link.model_dir)
#     print("loading model")
#     model, _, preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained=settings.clip_model_path)

#     print("loading nlp parser")
#     global nlp
#     nlp = spacy.load("en_core_web_sm")
    
#     print("loading keyframes")
#     keyframe_paths = sorted(glob.glob(os.path.join(settings.keyframes_path, "*/*/*.jpg")))

#     print("loading clip index")
#     global clip_index
#     clip_index = faiss.read_index(settings.clip_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)

#     print("loading git index")
#     global git_index
#     git_index = faiss.read_index(settings.git_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)

#     print("loading object clip index")
#     global object_clip_index   
#     object_clip_index = faiss.read_index(settings.object_clip_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)

#     print("loading object list")
#     global object_list, location_category_list
#     object_list = loader.load_object_list()
#     location_category_list = loader.load_location_category_list()  

#     print("loading metadata")
#     global object_df, loccat_df
#     metadata_df = pd.read_csv(settings.metadata_path)
#     object_df = metadata_df[['ImageID', 'Tags']]                # fix: change name of object column
#     loccat_df = metadata_df[['ImageID', 'categories']]          
#     # time_df = metadata_df[['ImageID', 'time']]                # fix: add time column to metadata


#     return device, model, preprocess, keyframe_paths