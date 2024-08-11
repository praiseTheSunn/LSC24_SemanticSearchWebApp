import setup
import numpy as np
import requests
from internal.search.parser import all_parsers, time_helpers

def search_semantic(model: str, text_embedding):
    # milvus_client = setup.milvus_client
    # milvus_collection = model + "_embeddings"
    # try:
    #     print("Searching in Milvus collection:", milvus_collection, milvus_collection in utility.list_collections(), utility.has_collection(milvus_collection), "with text embedding:", len(text_embedding))
    #     raw_result = milvus_client.search(collection_name=milvus_collection, data=text_embedding, limit=1000)
    #     print("Raw result:", raw_result)
    # except Exception as e:
    #     with open("error_log.txt", "w") as file:
    #         file.write(str(e))
    #     return None
    # convert text_embedding to float32 but keep type list
    
    data = {
        "model": model,
        "embedding": text_embedding,
    }
    headers = {
        "Content-Type": "application/json"
    }
    response = requests.post("http://localhost:8004/search_milvus", json=data, headers=headers)
    raw_results = response.json()
    urls = [entity['id'] for entity in raw_results['response'][0][-1:0:-1]]
    scores = [entity['distance'] for entity in raw_results['response'][0][-1:0:-1]]
    print("Scores: ", scores)
    return {
        "urls": urls,
        "scores": scores,
    }

def search_match_objects_tags(text_query: str) -> list[dict]: 
    parsed_objects_tags = all_parsers.parse_objects_tags(text_query)
    if parsed_objects_tags is None:
        return None
    response = setup.es_client.search(
        index="lsc24",
        size=5000,
        query={
            "match": {
                "objects_tags": {
                    "query": parsed_objects_tags,
                    "fuzziness": "AUTO",
                }   
            }
        },
    )
    response = response["hits"]["hits"]
    urls = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    return {
        "urls": urls,
        "scores": scores,
    }

def search_match_place(text_query: str) -> list[dict]:
    parsed_place = all_parsers.parse_place(text_query)
    if parsed_place is None:
        return None
    response = setup.es_client.search(
        index="lsc24",
        size=5000,
        query={
            "match": {
                "place": {
                    "query": parsed_place,
                    "fuzziness": "AUTO",
                }   
            }
        },
    )
    response = response["hits"]["hits"]
    urls = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    return {
        "urls": urls,
        "scores": scores,
    }

def search_match_caption(text_query: str) -> list[dict]:
    response = setup.es_client.search(
        index="lsc24",
        size=5000,
        query={
            "match": {
                "caption": {
                    "query": text_query,
                    "fuzziness": "AUTO",
                }   
            }
        },
    )
    response = response["hits"]["hits"]
    urls = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    return {
        "urls": urls,
        "scores": scores,
    }

def search_datetime(text_query: str) -> list[dict]:
    date1, time1, date2, time2 = all_parsers.parse_date_time(text_query)        
    if date1 == -1 and time1 == -1:
        return []
    date1, time1, date2, time2 = time_helpers.fill_date_time(date1, time1, date2, time2)
    response = setup.es_client.search(
        index="lsc24",
        size=10000,
        query={
            "bool": {
                "must": [
                    {
                        "range": {
                            "local_date": {
                                "gte": date1,
                                "lte": date2,
                            }
                        }
                    },
                    {
                        "range": {
                            "local_time": {
                                "gte": time1,
                                "lte": time2,
                            }
                        }
                    }
                ]
            }
        }
    )
    response = response["hits"]["hits"]
    urls = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    return {
        "urls": urls,
        "scores": scores,
    }

def search_multimatch(text_query: str):
    response = setup.es_client.search(
        index="lsc24",
        size=10000,
        query={
            "multi_match": {
                "query" : text_query,
                "fields": ["objects_tags", "place", "caption"],
                "fuzziness": "AUTO"
            }
        }
    )
    response = response["hits"]["hits"]
    urls = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    return {
        "urls": urls,
        "scores": scores,
    }

def search_multimatch_datetime(text_query: str):
    # parse datetime
    # boosts are the weight of datetime in the whole ElasticSearch query (set to 0.1 if date or time is blank)
    date1, time1, date2, time2 = all_parsers.parse_date_time(text_query)
    date1, time1, date2, time2, date_boost, time_boost = time_helpers.fill_date_time(date1, time1, date2, time2)

    response = setup.es_client.search(
        index="lsc24",
        size=10000,
        query={
            "bool": {
                "should": [
                    {
                        "range": {
                            "local_date": {                                
                                "gte": date1,
                                "lte": date2,
                                "boost": date_boost,
                            },
                        }
                    },
                    {
                        "range": {
                            "local_time": {                                
                                "gte": time1,
                                "lte": time2,
                                "boost": time_boost,
                            },
                        }
                    },
                    {
                        "multi_match": {
                            "query" : text_query,
                            "fields": ["objects_tags", "place", "caption", "ocr"],
                            "fuzziness": "AUTO"
                        }
                    }
                ]
            }
        }
    )
    response = response["hits"]["hits"]
    urls = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    return {
        "urls": urls,
        "scores": scores,
    }

def search_3match_datetime(text_query: str):

    # parse datetime
    # boosts are the weight of datetime in the whole ElasticSearch query (set to 0.1 if date or time is blank)
    date1, time1, date2, time2 = all_parsers.parse_date_time(text_query)
    date1, time1, date2, time2, date_boost, time_boost = time_helpers.fill_date_time(date1, time1, date2, time2)

    # parse other metadata
    parsed_objects_tags = all_parsers.parse_objects_tags(text_query)
    parsed_place = all_parsers.parse_place(text_query)

    response = setup.es_client.search(
        index="lsc24",
        size=10000,
        query={
            "bool": {
                "should": [
                    {
                        "range": {
                            "local_date": {                                
                                "gte": date1,
                                "lte": date2,
                                "boost": date_boost,
                            }
                        }
                    },
                    {
                        "range": {
                            "local_time": {                                
                                "gte": time1,
                                "lte": time2,
                                "boost": time_boost,
                            }
                        }
                    },
                    {
                        "match": {
                            "objects_tags": {
                                "query": parsed_objects_tags,
                                "fuzziness": "AUTO",
                            }                              
                        }
                    },
                    {
                        "match": {
                            "place": {
                                "query": parsed_place,
                                "fuzziness": "AUTO",
                            }                              
                        }
                    },
                    {
                        "match": {
                            "caption": {
                                "query": text_query,
                                "fuzziness": "AUTO",
                            }                              
                        }
                    },
                    {
                        "match": {
                            "ocr": {
                                "query": text_query,
                                "fuzziness": "AUTO",
                            }                              
                        }
                    },
                ]
            }
        }
    )
    response = response["hits"]["hits"]
    urls = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    return {
        "urls": urls,
        "scores": scores,
    }


