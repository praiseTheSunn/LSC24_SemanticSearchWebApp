import setup

def search_milvus(data):
    collection_name = dataset + "_" + data.model
    text_embedding = data.embedding
    limit = data.limit
    ids = data.ids

    if len(ids) > 0:
        response = setup.milvus_client.search(
            collection_name=collection_name,
            data=text_embedding,
            filter=f"""keyframe_id in {ids}""",
            limit=limit
        )
    else:
        response = setup.milvus_client.search(
            collection_name=collection_name,
            data=text_embedding,
            limit=limit
        )
    
    return response
