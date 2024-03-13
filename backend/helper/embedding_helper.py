import torch
import open_clip
import settings

# calculate text embedding using CLIP model
def calc_text_embedding(model, text_query: str):
    text_query_tokens = open_clip.tokenize(text_query)
    with torch.no_grad(), torch.cuda.amp.autocast():
        text_embedding = model.encode_text(text_query_tokens)
    return text_embedding

# search in index using text query  and return top n results
def search_text_query(index, keyframe_paths, model, text_query: str):
    text_embedding = calc_text_embedding(model, text_query)
    num_results = 50

    distances, indices = index.search(text_embedding.reshape(1, -1), num_results) #2 represent top n results required
    distances = distances[0]
    indices = indices[0]
    indices_distances = list(zip(indices, distances))
    indices_distances.sort(key=lambda x: x[1], reverse=True) 

    paths = []
    for idx, distance in indices_distances[:num_results]:
        path = keyframe_paths[idx]
        print(path)
        path = path[len(settings.keyframes_path):]
        paths.append(path)

    return paths