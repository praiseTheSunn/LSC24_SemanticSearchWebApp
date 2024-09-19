import setup
from setup import dataset_config
import numpy as np
import requests
from internal.search.parser import all_parsers, time_helpers


index_name = dataset_config['dataset_name']


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
    urls = [entity['id'] for entity in raw_results['response'][0]]
    scores = [entity['distance'] for entity in raw_results['response'][0]]
    print(f"URLs: {urls[:5]}")
    print(f"Scores: {scores[:5]}")
    return {
        "urls": urls,
        "scores": scores,
    }

def search_objects(text_query) -> list[dict]:
    # object_global_encoding = data["object_global_encoding"]
    # object_local_encoding = data["object_local_encoding"]
    # color_global_encoding = data["color_global_encoding"]
    # color_local_encoding = data["color_local_encoding"]
    parsed_ocr = all_parsers.parse_ocr(text_query)
    
    response = setup.es_client.search(
        index=index_name,
        size=1000,
        body={
            "query": {
                "bool": {
                    "must": [
                        {
                            "match": {
                                "context_en_keywords": {
                                    "query": parsed_ocr,
                                    "fuzziness": "AUTO",
                                }                              
                            }
                        },
                        # {
                        #     "match": {
                        #         "object_tags": {
                        #             "query": text_query,
                        #             "fuzziness": "AUTO",
                        #         }
                        #     }
                        # },
                    ]
                }
            }
        }
    )
    response = response["hits"]["hits"]
    urls = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    print(f"URLs: {urls[:5]}")
    print(f"Scores: {scores[:5]}")
    return {
        "urls": urls,
        "scores": scores,
    }

def search_keyword(text_query: str) -> list[dict]:    
    parsed_ocr = all_parsers.parse_ocr(text_query)
    
    response = setup.es_client.search(
        index=index_name,
        size=2000,
        body={
            "bool": {
                "should": [
                    {
                        "match": {
                            "ocr": {
                                "query": parsed_ocr,
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
                            "context_en_keywords": {
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

def search_match_object_tags(text_query: str) -> list[dict]: 
    parsed_object_tags = all_parsers.parse_object_tags(text_query)
    if parsed_object_tags is None:
        return None
    response = setup.es_client.search(
        index=index_name,
        size=5000,
        query={
            "match": {
                "object_tags": {
                    "query": parsed_object_tags,
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

def search_match_location(text_query: str) -> list[dict]:
    parsed_location = all_parsers.parse_location(text_query)
    if parsed_location is None:
        return None
    response = setup.es_client.search(
        index=index_name,
        size=5000,
        query={
            "match": {
                "location": {
                    "query": parsed_location,
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
        index=index_name,
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
        index=index_name,
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
        index=index_name,
        size=10000,
        query={
            "multi_match": {
                "query" : text_query,
                "fields": ["object_tags", "location", "caption", "ocr"],
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
        index=index_name,
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
                            "fields": ["object_tags", "location", "caption", "ocr"],
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
    parsed_object_tags = all_parsers.parse_object_tags(text_query)
    parsed_location = all_parsers.parse_location(text_query)
    parsed_ocr = all_parsers.parse_ocr(text_query)
    print(f"parsed_object_tags: {parsed_object_tags}")
    print(f"parsed_location: {parsed_location}")
    print(f"parsed_ocr: {parsed_ocr}")

    response = setup.es_client.search(
        index=index_name,
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
                            "object_tags": {
                                "query": parsed_object_tags,
                                "fuzziness": "AUTO",
                            }                              
                        }
                    },
                    {
                        "match": {
                            "location": {
                                "query": parsed_location,
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
                                "query": parsed_ocr,
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


