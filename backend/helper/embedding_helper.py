import torch
import open_clip
import settings
import numpy as np
import pandas as pd
from helper import setup, query_date_time, fuzzy_search
from textblob import TextBlob
import faiss
from PIL import Image
import requests
from PIL import Image
import io
import base64

# OFFSET_OBJECT_START = 0
# OFFSET_OBJECT_END = OFFSET_OBJECT_START + len(object_list)
# OFFSET_LOCATION_START = OFFSET_OBJECT_END
# OFFSET_LOCATION_END = OFFSET_LOCATION_START + len(location_category_list)
num_results = 1000
max_location_categories_retrieved = 5

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
def compute_text_embedding_transformer(text_query: str):
    return setup.tfm_model.encode(text_query)

# compute text embedding using BLIP2 model
def compute_text_embedding_blip2(text_query: str):

    base_url = "http://164.92.122.168:8000"
    endpoint_url = f"{base_url}/compute_text_embedding_blip2/{text_query}"

    try:
        response = requests.get(endpoint_url)
        if response.status_code == 200:
            response_json = response.json()
            text_embedding = torch.tensor(response_json["text_embedding"])
            # embeddings = np.array(response_json["text_embedding"])
            print("Received text embedding shape:", text_embedding.shape)
            return text_embedding
        else:
            print("Failed to get text embedding. Status code:", response.status_code)
            return response.status_code

    except requests.exceptions.RequestException as e:
        print("Error:", e)
        return None

# get image embedding 
def get_image_embedding_blip2(image_order: int):
        
    base_url = "http://164.92.122.168:8000"  
    endpoint_url = f"{base_url}/get_image_embedding_blip2/{str(image_order)}"

    try:
        response = requests.get(endpoint_url)            
        if response.status_code == 200:
            response_json = response.json()
            image_embedding = torch.tensor(response_json["image_embedding"])
            return image_embedding
        else:
            print("Failed to get embeddings. Status code:", response.status_code)   
            return response.status_code

    except Exception as e:
        print("Error:", e)
        return None

# search in BLIP2 index
def search_in_blip2_index(query_embedding, num_results):
    base_url = "http://164.92.122.168:8000"
    endpoint_url = f"{base_url}/search_in_blip2_index"

    try:
        data = {"query_embedding": query_embedding.tolist(), "num_results": int(num_results)}
        response = requests.post(endpoint_url, json=data)
        
        if response.status_code == 200:
            response_json = response.json()
            semantic_similarities = response_json["semantic_similarities"]
            indices = response_json["indices"]
            return semantic_similarities, indices
        else:
            print("Failed to get search results. Status code:", response.status_code)
            return None, None

    except requests.exceptions.RequestException as e:
        print("Error:", e)
        return None, None
# ------------------------------------------------------------------------------------   
# parse location semantic names from query
def parse_location_semantic_name_from_query(query):
    doc = setup.nlp(query)
    # semantic_names = [(ent.text, ent.label_) for ent in doc.ents if ent.label_ in ['GPE', 'LOC', 'FAC', 'ORG']]
    # print(doc.ents)
    # print(semantic_names)
    for ent in doc.ents:
        if ent.label_ in ['GPE', 'LOC', 'FAC', 'ORG']:
            print("Location found: ", ent.text, ent.label_)
            return ent.text
    return None

# parse noun chunks -> objects and location categories from query
def parse_noun_chunks_from_query(query):

    # Process our query
    print(query)
    doc = setup.nlp(query)

    # Use blob to find words that are nouns
    blob = TextBlob(doc.text)
    all_nouns = [word for word, tag in blob.tags if tag in ['NN', 'NNS']]

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
        _, object_indices = setup.object_blip2_index.search(embedding.cpu().detach().numpy(), max_location_categories_retrieved)
        
        print("Noun chunk: ", noun_chunk)
        first_match = object_indices[0][0]
        
        if first_match >= setup.OFFSET_OBJECT_START and first_match < setup.OFFSET_OBJECT_END:
            parsed_objects_from_query.append(setup.object_list[first_match - setup.OFFSET_OBJECT_START])
        else:
            for i in object_indices[0]:
                if i >= setup.OFFSET_LOCATION_START and i < setup.OFFSET_LOCATION_END:
                    parsed_location_categories_from_query.append(setup.location_category_list[i - setup.OFFSET_LOCATION_START])     
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
            object_similarity = (0.2 + 0.8 * len(common_objects) / len(parsed_objects_from_query)) if parsed_objects_from_query else 0.5
        else:
            object_similarity = 0.2
        object_similarities.append(object_similarity)
    object_similarities = np.array(object_similarities, dtype=np.float16)
    return object_similarities

# ------------------------------------------------------------------------------------
# get_harmonic_average
def get_harmonic_average(x, y):
    return 2 * (x * y) / (x + y)

# compute combined score for each keyframe
def get_scores_sorted(indices, semantic_similarities, object_similarities):
    scores_unsorted = get_harmonic_average(semantic_similarities, object_similarities)
    scores_indices = list(zip(scores_unsorted, indices))
    scores_indices.sort(key=lambda x: x[0], reverse=True)
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

# ------------------------------------------------------------------------------------
# search in index using image path and return top n results
def search_by_image_path(keyframe_paths, image_query_path):
    image_order = setup.keyframe_paths_dict[image_query_path]
    query_embedding = get_image_embedding_blip2(image_order)
    semantic_similarities, indices = search_in_blip2_index(query_embedding, num_results)            
    semantic_similarities = np.array(semantic_similarities[0], dtype=np.float16)
    semantic_similarities = semantic_similarities / np.max(semantic_similarities)
    indices = np.array(indices[0], dtype=np.int32)

    paths = []
    for idx in indices:
        paths.append(keyframe_paths[idx])

    return paths

# search in index using text query and return top n results
def search_by_text_query(keyframe_paths, mode, text_query):
    
    # perform semantic search and compute semantic similarities
    if mode == 'caption':
        query_embedding = compute_text_embedding_transformer(text_query) 
        semantic_index = setup.caption_git_index
        semantic_similarities, indices = semantic_index.search(query_embedding.reshape(1, -1), num_results)  
    elif mode == 'image':
        query_embedding = compute_text_embedding_blip2(text_query)            
        semantic_similarities, indices = search_in_blip2_index(query_embedding, num_results) 
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
    print("After loccat filter, found: ", len(paths), " results")

    # filter by time 
    new_paths = query_date_time.query_time_date_image(setup.time_dict, text_query, paths)
    paths = new_paths
    print("After time filter, found: ", len(paths), " results")
    
    # filter by location semantic name
    location_semantic_name = parse_location_semantic_name_from_query(text_query)
    if location_semantic_name != None:
        new_paths = fuzzy_search.fuzzy_search_frame(paths, location_semantic_name, setup.ix, setup.searcher, setup.qp, limit=1000)
        paths = new_paths
    print("After location filter, found: ", len(paths), " results")

    for path in paths[:200]:
        print(path)

    return paths