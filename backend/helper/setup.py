import open_clip
import settings
import faiss
import glob
import os
import spacy
import pandas as pd
import loader

def setup():
    # loading CLIP model and its processor
    device = "cpu"
    # model, _, preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained='laion2b_s32b_b79k', cache_dir=global_link.model_dir)
    print("loading model")
    model, _, preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained=settings.clip_model_path)

    print("loading nlp parser")
    global nlp
    nlp = spacy.load("en_core_web_sm")
    
    print("loading keyframes")
    keyframe_paths = sorted(glob.glob(os.path.join(settings.keyframes_path, "*/*/*.jpg")))

    print("loading clip index")
    global clip_index
    clip_index = faiss.read_index(settings.clip_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)

    print("loading git index")
    global git_index
    git_index = faiss.read_index(settings.git_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)

    print("loading object clip index")
    global object_clip_index   
    object_clip_index = faiss.read_index(settings.object_clip_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)

    print("loading objects from metadata")
    global object_df
    object_df = pd.read_csv(settings.metadata_path)['objects']

    print("loading object list")
    global object_list, location_category_list
    object_list = loader.load_object_list()
    location_category_list = loader.load_location_category_list()   

    return device, model, preprocess, keyframe_paths