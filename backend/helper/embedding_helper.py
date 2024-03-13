import torch
import open_clip
import settings
import numpy as np
import pandas as pd
from helper import setup
from textblob import TextBlob
import faiss
from PIL import Image
from query_date_time import *

# OFFSET_OBJECT_START = 0
# OFFSET_OBJECT_END = OFFSET_OBJECT_START + len(object_list)
# OFFSET_LOCATION_START = OFFSET_OBJECT_END
# OFFSET_LOCATION_END = OFFSET_LOCATION_START + len(location_category_list)
# num_results = 10000

# compute text embedding using CLIP model
def compute_text_embedding(model, text_query: str):
    text_query_tokens = open_clip.tokenize(text_query)
    with torch.no_grad(), torch.cuda.amp.autocast():
        text_embedding = model.encode_text(text_query_tokens)
    return text_embedding

# compute image embedding using CLIP model
def compute_image_embedding(model, image_path: str):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    raw_image = Image.open(image_path)
    image = setup.preprocess(raw_image).unsqueeze(0).to(device)
    with torch.no_grad(), torch.cuda.amp.autocast():
        image_features = model.encode_image(image)
    return image_features

# ------------------------------------------------------------------------------------
# compute text embedding using BLIP2 model
def compute_text_embedding_blip2(model, text_query: str):
    txt = setup.txt_processors["eval"](text_query)
    text_sample = {"image":  [], "text_input": [txt]}
    text_embedding = model.extract_features(text_sample, mode="text").text_embeds[:, 0, :]
    return text_embedding

# compute image embedding using BLIP2 model
def compute_image_embedding_blip2(model, image_path: str):
    raw_image = Image.open(image_path).convert("RGB")
    image = setup.vis_processors["eval"](raw_image)
    sample = {"image": [image], "text_input": []}
    features_image = model.extract_features(sample, mode="image").image_embeds[:, 0, :]
    return features_image

# parse objects and location categories from query
def parse_objects_from_query(query):

    # Process our query
    print(query)
    doc = setup.nlp(query)

    # Use blob to find words that are nouns
    blob = TextBlob(doc.text)
    all_nouns = [word for word, tag in blob.tags if tag == 'NN' or tag == 'NNS']

    # Extract noun_chunks, then extract the root from each noun_chunk
    all_noun_chunks = [chunk.text for chunk in doc.noun_chunks if str(chunk.root) in all_nouns]
    print(all_noun_chunks)
    return all_noun_chunks

# get_harmonic_average
def get_harmonic_average(x, y):
    return 2 * (x * y) / (x + y)

# compute combined score for each keyframe
def get_scores_sorted(indices, semantic_similarities, object_similarities):
    print(semantic_similarities.shape, object_similarities.shape, indices.shape)
    print(indices[:10])
    scores_unsorted = get_harmonic_average(semantic_similarities, object_similarities)
    scores_indices = list(zip(scores_unsorted, indices))
    scores_indices.sort(key=lambda x: x[0], reverse=True)
    print(scores_indices[:10])
    return scores_indices

# search in index using text query and return top n results
def search(keyframe_paths, model, mode, text_query: None, image_query_path: None):
    
    query_embedding = None
    if text_query:
        query_embedding = compute_text_embedding_blip2(model, text_query)
    elif image_query_path:
        query_embedding = compute_image_embedding_blip2(model, image_query_path)

    # perform semantic search and compute semantic similarities
    if mode == 'caption':
        semantic_index = setup.git_index
    else:
        semantic_index = setup.blip2_index
    semantic_similarities, indices = semantic_index.search(query_embedding.reshape(1, -1), 1000)             #2 represent top n results required
    semantic_similarities = np.array(semantic_similarities[0], dtype=np.float16)
    semantic_similarities = semantic_similarities / np.max(semantic_similarities)
    indices = np.array(indices[0], dtype=np.int32)

    # perform object and location category search
    parsed_objects_from_query = []
    parsed_location_categories_from_query = []
    all_noun_chunks = parse_objects_from_query(text_query)
    for noun_chunk in all_noun_chunks:

        embedding = compute_text_embedding_blip2(model, noun_chunk)        
        _, object_indices = setup.object_blip2_index.search(embedding.cpu().detach().numpy(), 5)
        
        print("Noun chunk: ", noun_chunk)
        first_match = object_indices[0][0]
        
        if first_match >= setup.OFFSET_OBJECT_START and first_match < setup.OFFSET_OBJECT_END:
            parsed_objects_from_query.append(setup.object_list[first_match - setup.OFFSET_OBJECT_START])
            print("Parsed objects: ", parsed_objects_from_query)
        else:
            for i in object_indices[0]:
                if i >= setup.OFFSET_LOCATION_START and i < setup.OFFSET_LOCATION_END:
                    parsed_location_categories_from_query.append(setup.location_category_list[i - setup.OFFSET_LOCATION_START])            
            print("Parsed location categories: ", parsed_location_categories_from_query)
        print()

    parsed_objects_from_query = set(parsed_objects_from_query)
    parsed_location_categories_from_query = set(parsed_location_categories_from_query)
    print("Final objects: ", parsed_objects_from_query)
    print("Final locations: ", parsed_location_categories_from_query)

    # compute object similarities
    object_similarities = []
    image_ids = np.array([keyframe_paths[idx][-23:] for idx in indices])
    for image_id in image_ids:
        if image_id in setup.object_dict:
            objects_from_image = setup.object_dict[image_id]
            common_objects = objects_from_image & parsed_objects_from_query
            object_similarity = (0.5 + 0.5 * len(common_objects) / len(parsed_objects_from_query)) if parsed_objects_from_query else 0.5
            # object_similarity = 0.5
        else:
            object_similarity = 0.5
        object_similarities.append(object_similarity)

        # if i % 100 == 0:
            # print("Objects from image: ", objects_from_image)
            # print("Parsed objects from query: ", parsed_objects_from_query)
            # print("Object similarity: ", object_similarity)

    object_similarities = np.array(object_similarities, dtype=np.float16)

    # get scores and indices sorted by scores
    scores_indices = get_scores_sorted(indices, semantic_similarities, object_similarities)    
    paths = []
    for _, idx in scores_indices:
        paths.append(keyframe_paths[idx])

    # filter by location category
    new_paths = []
    image_ids = np.array([path[-23:] for path in paths])
    for image_id, path in zip(image_ids, paths):
        try:
            location_category = setup.loccat_dict[image_id]  
        except:
            location_category = None    
        if pd.isna(location_category) or location_category in parsed_location_categories_from_query:
            new_paths.append(path)
            
    paths = new_paths

    # TODO: filter by time
    # gia dinh la co paths, time_df
    
        
    new_new_paths = query_time_date_image(setup.time_df, text_query, paths)
    paths = new_new_paths
    return paths