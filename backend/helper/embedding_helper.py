import os
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

    base_url = "http://34.124.236.208:8002"
    endpoint_url = f"{base_url}/embedding/text/"

    try:
        data = {
            'text_query': text_query,
            "model": "blip2",
        }
        # print("Sending request to:", endpoint_url)
        response = requests.post(endpoint_url, json = data)
        # print("Received response")
        
        if response.status_code == 200:
            response_json = response.json()
            text_embedding = torch.tensor(response_json["text_embedding"])
            # embeddings = np.array(response_json["text_embedding"])
            # print("Received text embedding shape:", text_embedding.shape)
            return text_embedding
        else:
            print("Failed to get text embedding. Status code:", response.status_code)
            return response.status_code

    except requests.exceptions.RequestException as e:
        print("Error:", e)
        return None

# def compute_text_embedding_clip(text_query: str):
#     # loading CLIP model and its processor
#     device = "cpu"
#     # model, _, preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained='laion2b_s32b_b79k', cache_dir=global_link.model_dir)
#     model, _, preprocess = open_clip.create_model_and_transforms('ViT-H/14', pretrained=global_link.model_dir)

#     with torch.no_grad(), torch.cuda.amp.autocast():
#         text_embedding = model.encode_text(text_query_tokens)
#     pass

import helper.beit3 as beit3
def compute_text_embedding_beit3(text_query: str):
    
    print("print beit3")
    return beit3.calc_text_embedding(text_query, beit3.tokenizer)
    # pass

import helper.clip as clip
def compute_text_embedding_clip(text_query: str):
    # return clip.calc_text_embedding(text_query)
    base_url = "http://34.124.236.208:8002"
    endpoint_url = f"{base_url}/embedding/text/"

    try:
        data = {
            'text_query': text_query,
            "model": "clip",
        }
        # print("Sending request to:", endpoint_url)
        response = requests.post(endpoint_url, json = data)
        # print("Received response")
        
        if response.status_code == 200:
            response_json = response.json()
            text_embedding = torch.tensor(response_json["text_embedding"])
            # embeddings = np.array(response_json["text_embedding"])
            # print("Received text embedding shape:", text_embedding.shape)
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
            return semantic_similarities[0], indices
        else:
            print("Failed to get search results. Status code:", response.status_code)
            return None, None

    except requests.exceptions.RequestException as e:
        print("Error:", e)
        return None, None
    
# def search_in_blip2_index(query_embedding, num_results):
#     distances, indices = setup.blip2_index.search(query_embedding.cpu().detach().numpy(), num_results)
#     return  distances, indices

def search_in_beit3_index(query_embedding, num_results):
    distances, indices = beit3.index.search(query_embedding.reshape(1, -1), num_results)
    return  distances[0], indices

# search in index using text query  and return top n results
def search_in_clip_index(text_embedding, num_results):
    distances, indices = clip.index.search(text_embedding.reshape(1, -1), num_results) #2 represent top n results required
    distances = distances[0]
    # indices = indices[0]
    # indices_distances = list(zip(indices, distances))
    # indices_distances.sort(key=lambda x: x[1], reverse=True) 

    # paths = []
    # for idx, distance in indices_distances[:num_results]:
    #     path = setup.keyframe_paths[idx]
    #     print(path)
    #     path = path[len(settings.keyframes_path):]
    #     paths.append(path)

    return distances, indices

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
    # print(query)
    doc = setup.nlp(query)

    # Use blob to find words that are nouns
    blob = TextBlob(doc.text)
    all_nouns = [word for word, tag in blob.tags if tag in ['NN', 'NNS']]

    # Extract noun_chunks, then extract the root from each noun_chunk
    all_noun_chunks = [chunk.text for chunk in doc.noun_chunks if str(chunk.root) in all_nouns]
    # print(all_noun_chunks)
    return all_noun_chunks
def parse_objects_and_loccats_from_query(query):

    parsed_objects_from_query = []
    parsed_location_categories_from_query = []
    all_noun_chunks = parse_noun_chunks_from_query(query)
    for noun_chunk in all_noun_chunks:

        embedding = compute_text_embedding_blip2(noun_chunk)        
        _, object_indices = setup.object_blip2_index.search(embedding.cpu().detach().numpy(), max_location_categories_retrieved)
        
        # print("Noun chunk: ", noun_chunk)
        first_match = object_indices[0][0]
        
        if first_match >= setup.OFFSET_OBJECT_START and first_match < setup.OFFSET_OBJECT_END:
            parsed_objects_from_query.append(setup.object_list[first_match - setup.OFFSET_OBJECT_START])
        else:
            for i in object_indices[0]:
                if i >= setup.OFFSET_LOCATION_START and i < setup.OFFSET_LOCATION_END:
                    parsed_location_categories_from_query.append(setup.location_category_list[i - setup.OFFSET_LOCATION_START])     
        # print()
    
    # print("Final objects: ", parsed_objects_from_query)
    # print("Final locations: ", parsed_location_categories_from_query)
    return set(parsed_objects_from_query), set(parsed_location_categories_from_query)

# ------------------------------------------------------------------------------------
# compute object similarities
def compute_object_similarities(parsed_objects_from_query, image_ids):
    object_similarities = []
    for image_id in image_ids:
        try:
            objects_from_image = setup.object_dict[image_id]
            common_objects = objects_from_image & parsed_objects_from_query
            object_similarity = (0.2 + 0.8 * len(common_objects) / len(objects_from_image)) if parsed_objects_from_query else 0.5
        except:
            object_similarity = 0.2
        object_similarities.append(object_similarity)
    object_similarities = np.array(object_similarities, dtype=np.float16)
    return object_similarities
# compute loccat similarities
def compute_loccat_similarities(parsed_location_categories_from_query, image_ids):
    loccat_similarities = []
    for image_id in image_ids:
        loccat_similarity = 0.8
        try:
            location_category = setup.loccat_dict[image_id] 
            if location_category in parsed_location_categories_from_query:
                loccat_similarity = 1
            else:
                location_category = 0.2
        except:
            loccat_similarity = 0.8
        loccat_similarities.append(loccat_similarity)
    loccat_similarities = np.array(loccat_similarities, dtype=np.float16)
    return loccat_similarities


# ------------------------------------------------------------------------------------
# get total score
def get_total_score(s1, s2, s3, s4, s5):
    return 5 / (1 / s1 + 1 / s2 + 1 / s3 + 1 / s4 + 1 / s5)

# compute combined score for each keyframe
def get_scores_sorted(combined_indices, total_scores):
    scores_indices = list(zip(total_scores, combined_indices))
    # df = pd.DataFrame(scores_indices, columns=['score', 'index'])
    # df.to_csv("scores_indices.csv")
    scores_indices.sort(key=lambda x: x[0], reverse=True)
    print("scores_indices: ", scores_indices[:10])
    # sorted(scores_indices, key=lambda x: x[0], reverse=True)
    return scores_indices

# ------------------------------------------------------------------------------------
# search in index using image path and return top n results
def search_by_image_path(keyframe_paths, image_query_path):
    image_query_path = os.path.normpath(image_query_path)
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
def search_by_text_query(keyframe_paths, mode, text_query, test_name, debug = True):
    
    # perform semantic search and compute semantic similarities
    if mode == 'caption':
        query_embedding = compute_text_embedding_transformer(text_query) 
        semantic_index = setup.caption_git_index
        semantic_similarities, indices = semantic_index.search(query_embedding.reshape(1, -1), num_results)  
    elif mode == 'image':
        # query_embedding = compute_text_embedding_blip2(text_query)            
        # semantic_similarities, indices = search_in_blip2_index(query_embedding, num_results) 
        query_embedding = compute_text_embedding_beit3(text_query)            
        semantic_similarities, indices = search_in_beit3_index(query_embedding, num_results) 
        # query_embedding = compute_text_embedding_clip(text_query)
        # semantic_similarities, indices = search_in_clip_index(query_embedding, num_results)
    semantic_similarities = np.array(semantic_similarities, dtype=np.float16)
    semantic_similarities = semantic_similarities / np.max(semantic_similarities)
    indices = np.array(indices[0], dtype=np.int32)

    # if debug:
    #     print("finished semantic search")
    # # parse objects, loccats and location semantic name from query
    # parsed_objects_from_query, parsed_location_categories_from_query = parse_objects_and_loccats_from_query(text_query)
    # location_semantic_name = parse_location_semantic_name_from_query(text_query)

    # if debug:
    #     print("finished parsing objects and loccats")

    # # compute metadata similarities
    # image_ids = [keyframe_paths[idx][-23:] for idx in indices]
    # print("image_ids similarity: ", image_ids[:10])
    # # df = pd.DataFrame([image_ids])
    # # df.to_csv("image_ids_similarity.csv")

    # object_similarities = compute_object_similarities(parsed_objects_from_query, image_ids) 
    # loccat_similarities = compute_loccat_similarities(parsed_location_categories_from_query, image_ids)
    # time_similarities = query_date_time.query_time_date_image(setup.time_dict, text_query, image_ids)
    # if location_semantic_name:
    #     locsem_indices, locsem_similarities = fuzzy_search.fuzzy_search_frame(image_ids, location_semantic_name, setup.searcher, setup.qp, limit=2000)
    # else:
    #     locsem_indices = indices
    #     locsem_similarities = np.ones(len(indices), dtype=np.float16)

    # if debug:
    #     print("finished computing metadata similarities")
   
    # # debug
    # if debug:
    #     print(f"image_ids: length {len(image_ids)}, ", image_ids[:10])
    #     print(f"indices: length {len(indices)}, ", indices[:10])
    #     print(f"semantic_similarities: length {len(semantic_similarities)}, ", semantic_similarities[:10])
    #     print(f"object_similarities: length {len(object_similarities)}, ", object_similarities[:10])
    #     print(f"loccat_similarities: length {len(loccat_similarities)}, ", loccat_similarities[:10])
    #     print(f"time_similarities: length {len(time_similarities)}, ", time_similarities[:10])
    #     print(f"locsem_similarities: length {len(locsem_similarities)}, ", locsem_similarities[:10])



    # # get scores and indices
    # combined_indices = np.unique(np.concatenate((indices, locsem_indices)))
    # dict_1 = dict(zip(indices, semantic_similarities))
    # dict_2 = dict(zip(indices, object_similarities))
    # dict_3 = dict(zip(indices, loccat_similarities))
    # dict_4 = dict(zip(indices, time_similarities))
    # dict_5 = dict(zip(locsem_indices, locsem_similarities))
    
    

    # total_scores = [
    #     get_total_score(dict_1.get(index, 0.2), dict_2.get(index, 0.2), dict_3.get(index, 0.2), dict_4.get(index, 0.2), dict_5.get(index, 0.2))
    #     for index in combined_indices]

    # # sort scores and indices
    # scores_indices = get_scores_sorted(combined_indices, total_scores)

    # df = pd.DataFrame([[x[0] for x in scores_indices], [x[1] for x in scores_indices], list(semantic_similarities), list(object_similarities), list(loccat_similarities), list(time_similarities), list(locsem_similarities)], index=['score', 'index', 'semantic_similarities', 'object_similarities', 'loccat_similarities', 'time_similarities', 'locsem_similarities']).T
    # df.to_csv(f"csv/{test_name}scores_indices.csv")

    # paths = [setup.keyframe_paths[(int)(idx)] for _, idx in scores_indices]
    # print("scores_indices: ", scores_indices[:10])
    # print("paths in embedding_helper: ", paths[:10])
    paths = [setup.keyframe_paths[(int)(idx)] for idx in indices]


    # # filter by location category
    # new_paths = loccat_filter(paths, parsed_location_categories_from_query)   
    # paths = new_paths
    # print("After loccat filter, found: ", len(paths), " results")

    # # filter by time 
    # new_paths = query_date_time.query_time_date_image(setup.time_dict, text_query, paths)
    # paths = new_paths
    # print("After time filter, found: ", len(paths), " results")
    
    # filter by location semantic name
    # location_semantic_name = parse_location_semantic_name_from_query(text_query)
    # if location_semantic_name != None:
    #     new_paths = fuzzy_search.fuzzy_search_frame(paths, location_semantic_name, setup.ix, setup.searcher, setup.qp, limit=1000)
    #     paths = new_paths
    # print("After location filter, found: ", len(paths), " results")

    # for path in paths[:200]:
    #     print(path)

    return paths

