import torch
import open_clip
import settings
import numpy as np
from helper import setup
from textblob import TextBlob
import faiss

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
    scores_unsorted = get_harmonic_average(semantic_similarities, object_similarities)
    scores_indices = list(zip(scores_unsorted, indices, ))
    scores_indices.sort(key=lambda x: x[1], reverse=True)
    return scores_indices

# search in index using text query and return top n results
def search_text_query(keyframe_paths, model, text_query: str, mode):

    # compute text embedding for text query
    text_query_embedding = compute_text_embedding(model, text_query)

    # perform semantic search and compute semantic similarities
    if mode == 'caption':
        semantic_index = setup.git_index
    else:
        semantic_index = setup.clip_index
    semantic_similarities, indices = semantic_index.search(text_query_embedding.reshape(1, -1), setup.num_results)             #2 represent top n results required
    semantic_similarities = np.array(semantic_similarities[0], dtype=np.float16)
    semantic_similarities = semantic_similarities / np.max(semantic_similarities)
    indices = np.array(indices[0], dtype=np.int32)

    # perform object and location category search
    parsed_objects_from_query = []
    parsed_location_categories_from_query = []
    all_noun_chunks = parse_objects_from_query(text_query)
    for noun_chunk in all_noun_chunks:

        embedding = compute_text_embedding(model, noun_chunk)

        print("embedding dimension: ", embedding.shape)
        print("faiss dimension: ", setup.object_clip_index.d)

        
        _, object_indices = setup.object_clip_index.search(embedding.cpu().detach().numpy(), 5)

        
        print("Noun chunk: ", noun_chunk)
        print("Matches: ")
        first_match = object_indices[0][0]
        if first_match >= setup.OFFSET_OBJECT_START and first_match < setup.OFFSET_OBJECT_END:
            parsed_objects_from_query.append(setup.object_list[first_match - setup.OFFSET_OBJECT_START])
        else:
            parsed_location_categories_from_query.extend([setup.location_category_list[i - setup.OFFSET_LOCATION_START] for i in object_indices[0]])
        print()
    parsed_objects_from_query = set(parsed_objects_from_query)
    parsed_location_categories_from_query = set(parsed_location_categories_from_query)

    # compute object similarities
    object_similarities = []
    for idx in indices:
        ImageID = keyframe_paths[idx]
        object_similarity = 0.01
        object_matches = 0
        objects_from_image = setup.object_df[setup.object_df['ImageID'] == ImageID]['Tags']
        for object in parsed_objects_from_query:
            if object in objects_from_image:
                object_matches += 1
        if len(parsed_objects_from_query) > 0:
            object_similarity = object_matches / len(parsed_objects_from_query)
        object_similarities.append(object_similarity)
    object_similarities = np.array(object_similarities, dtype=np.float16)

    # get scores and indices sorted by scores
    scores_indices = get_scores_sorted(indices, semantic_similarities, object_similarities)    
    paths = []
    for _, idx in scores_indices:
        paths.append(keyframe_paths[idx])

    # TODO: filter by location category
    parsed_location_categories_from_query = list(parsed_location_categories_from_query)
    parsed_location_categories_from_query = " ".join(parsed_location_categories_from_query)
    new_paths = []
    for ImageID in paths:
        location_category = setup.loccat_df[setup.loccat_df['ImageID'] == ImageID]['categories']
        if location_category in parsed_location_categories_from_query:
            new_paths.append(ImageID)
    paths = new_paths

    # TODO: filter by time
    # gia dinh la co paths, time_df
        
        
    return paths