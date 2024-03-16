import torch
import open_clip
import settings
import numpy as np
import pandas as pd
from helper import setup, query_date_time
from textblob import TextBlob
import faiss
from PIL import Image
import requests
from PIL import Image
import io

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
def compute_text_embedding_blip2(text_query: str):

    base_url = "http://164.92.122.168:8000"
    endpoint_url = f"{base_url}/get_text_embedding_blip2/{text_query}"

    try:
        response = requests.get(endpoint_url)
        if response.status_code == 200:
            response_json = response.json()
            embeddings = np.array(response_json["embeddings"])
            print("Received embeddings:", embeddings)
            return embeddings
        else:
            print("Failed to get embeddings. Status code:", response.status_code)
            return response.status_code

    except requests.exceptions.RequestException as e:
        print("Error:", e)
        return None

# compute image embedding using BLIP2 model
def compute_image_embedding_blip2(image_path: str):
        
    base_url = "http://164.92.122.168:8000"  
    endpoint_url = f"{base_url}/get_image_embedding_blip2"

    try:
        with open(image_path, 'rb') as f:
            image = Image.open(f)
            image_bytes = io.BytesIO()
            image.save(image_bytes, format='JPEG')
            image_bytes = image_bytes.getvalue()
        response = requests.post(endpoint_url, data=image_bytes)        
        if response.status_code == 200:
            response_json = response.json()
            embeddings = np.array(response_json["embeddings"])
            print("Received embeddings:", embeddings)
            return embeddings
        else:
            print("Failed to get embeddings. Status code:", response.status_code)
            return response.status_code

    except Exception as e:
        print("Error:", e)
        return None

# ------------------------------------------------------------------------------------   
# parse noun chunks -> objects and location categories from query
def parse_noun_chunks_from_query(query):

    # Process our query
    print(query)
    doc = setup.nlp(query)

    # Use blob to find words that are nouns
    blob = TextBlob(doc.text)
    all_nouns = [word for word, tag in blob.tags]
    for word, tag in blob.tags:
        print(word, tag)

    # Extract noun_chunks, then extract the root from each noun_chunk
    all_noun_chunks = [chunk.text for chunk in doc.noun_chunks if str(chunk.root) in all_nouns]
    print(all_noun_chunks)
    return all_noun_chunks
def parse_objects_and_loccats_from_query(query):

    parsed_objects_from_query = []
    parsed_location_categories_from_query = []
    all_noun_chunks = parse_noun_chunks_from_query(query)
    for noun_chunk in all_noun_chunks:

        embedding = compute_text_embedding_blip2(noun_chunk)        
        _, object_indices = setup.object_blip2_index.search(embedding.cpu().detach().numpy(), 5)
        
        print("Noun chunk: ", noun_chunk)
        first_match = object_indices[0][0]
        
        if first_match >= setup.OFFSET_OBJECT_START and first_match < setup.OFFSET_OBJECT_END:
            parsed_objects_from_query.append(setup.object_list[first_match - setup.OFFSET_OBJECT_START])
            print("Parsed objects: ", parsed_objects_from_query)
        else:
            for i in object_indices[0]:
                print(noun_chunk, i)
                if i >= setup.OFFSET_LOCATION_START and i < setup.OFFSET_LOCATION_END:
                    parsed_location_categories_from_query.append(setup.location_category_list[i - setup.OFFSET_LOCATION_START])            
            print("Parsed location categories: ", parsed_location_categories_from_query)
        print()
    
    print("Final objects: ", parsed_objects_from_query)
    print("Final locations: ", parsed_location_categories_from_query)
    return set(parsed_objects_from_query), set(parsed_location_categories_from_query)

# ------------------------------------------------------------------------------------
# compute object similarities
def compute_object_similarities(parsed_objects_from_query, indices):
    object_similarities = []
    image_ids = np.array([setup.keyframe_paths[idx][-23:] for idx in indices])
    for image_id in image_ids:
        if image_id in setup.object_dict:
            objects_from_image = setup.object_dict[image_id]
            common_objects = objects_from_image & parsed_objects_from_query
            object_similarity = (0.5 + 0.5 * len(common_objects) / len(parsed_objects_from_query)) if parsed_objects_from_query else 0.5
        else:
            object_similarity = 0.5
        object_similarities.append(object_similarity)
    object_similarities = np.array(object_similarities, dtype=np.float16)

# ------------------------------------------------------------------------------------
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

# ------------------------------------------------------------------------------------
# function to filter by location category
def loccat_filter(paths, parsed_location_categories_from_query):
    new_paths = []
    image_ids = np.array([path[-23:] for path in paths])
    for image_id, path in zip(image_ids, paths):
        try:
            location_category = setup.loccat_dict[image_id]  
        except:
            location_category = None    
        if pd.isna(location_category) or location_category in parsed_location_categories_from_query:
            new_paths.append(path)
    return new_paths

# search in index using text query and return top n results
def search(keyframe_paths, mode, text_query = None, image_query_path = None):
    
    query_embedding = None
    if text_query:
        query_embedding = compute_text_embedding_blip2(text_query)
    elif image_query_path:
        query_embedding = compute_image_embedding_blip2(image_query_path)

    # perform semantic search and compute semantic similarities
    if mode == 'caption':
        semantic_index = setup.git_index
    else:
        semantic_index = setup.blip2_index
    semantic_similarities, indices = semantic_index.search(query_embedding.reshape(1, -1), 1000)             #2 represent top n results required
    semantic_similarities = np.array(semantic_similarities[0], dtype=np.float16)
    semantic_similarities = semantic_similarities / np.max(semantic_similarities)
    indices = np.array(indices[0], dtype=np.int32)

    # parse objects and loccats from query
    parsed_objects_from_query, parsed_location_categories_from_query = parse_objects_and_loccats_from_query(text_query)

    # compute object similarities
    object_similarities = compute_object_similarities(parsed_objects_from_query, indices)    

    # get scores and indices sorted by scores
    scores_indices = get_scores_sorted(indices, semantic_similarities, object_similarities)    
    paths = []
    for _, idx in scores_indices:
        paths.append(keyframe_paths[idx])

    # filter by location category
    new_paths = loccat_filter(paths, parsed_location_categories_from_query)   
    paths = new_paths

    # filter by time 
    new_paths = query_date_time.query_time_date_image(setup.time_dict, text_query, paths)
    paths = new_paths
    return paths