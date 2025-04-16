import setup

def search_milvus(collection_name: str, text_embedding: list, limit: int, subset_record_ids: list):
    if len(subset_record_ids) > 0:
        results = setup.milvus_client.search(
            collection_name=collection_name,
            data=text_embedding,
            filter=f"""id in {subset_record_ids}""",
            limit=limit
        )
    else:
        results = setup.milvus_client.search(
            collection_name=collection_name,
            data=text_embedding,
            limit=limit
        )    
    return results
