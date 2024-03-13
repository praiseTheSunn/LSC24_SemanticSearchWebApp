import open_clip
import settings
import faiss
import glob
import os

def setup():
    # loading CLIP model and its processor
    device = "cpu"
    # model, _, preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained='laion2b_s32b_b79k', cache_dir=global_link.model_dir)
    print("loading model")
    model, _, preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained=settings.clip_model_path)
    
    print("loading keyframes")
    keyframe_paths = sorted(glob.glob(os.path.join(settings.keyframes_path, "*/*/*.jpg")))

    print("loading index")
    index = faiss.read_index(settings.clip_index_path, faiss.IO_FLAG_MMAP|faiss.IO_FLAG_READ_ONLY)

    return device, model, preprocess, keyframe_paths, index