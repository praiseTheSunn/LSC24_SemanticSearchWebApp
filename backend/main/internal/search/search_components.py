import setup
from setup import dataset_config, image_names
import numpy as np
import pandas as pd
import requests
from internal.search.parser import all_parsers, time_helpers
from internal.search.scorer import combine_score


index_name = dataset_config['dataset_name']


def search_semantic(model: str, text_embeddings: list[str]):

    clause_urls = []
    clause_scores = []
    
    for text_embedding in text_embeddings:
        data = {
            "model": model,
            "embedding": text_embedding,
        }
        response = requests.post("http://localhost:8004/search_milvus", json=data, headers={
            "Content-Type": "application/json"
        })
        raw_results = response.json()
        urls = [entity['id'] for entity in raw_results['response'][0]]
        scores = [entity['distance'] for entity in raw_results['response'][0]]
        clause_urls.append(urls)
        clause_scores.append(scores)

    # Single query
    if len(text_embeddings) == 1:  
        print(f"Search semantic found {len(clause_urls[0])} results")
        return {
            "urls": clause_urls[0],
            "scores": clause_scores[0],
        }
    # Temporal query
    else:
        # normalize scores
        for i in range(len(clause_scores)):
            clause_scores[i] = combine_score.get_standardized_scores(clause_scores[i])

        # convert into DataFrame
        raw_results_df = pd.DataFrame(columns=['url', 'score', 'context_id', 'clause_id'])
        for i, urls in enumerate(clause_urls):
            for j, url in enumerate(urls):
                raw_results_df = raw_results_df.append({
                    'url': url,
                    'score': clause_scores[i][j],
                    'context_id': setup.metadata_rows.loc[url, 'context_id'],
                    'clause_id': i,
                }, ignore_index=True)

        # drop context_id = None
        raw_results_df = raw_results_df.dropna(subset=['context_id'])

        # group by context_id (a for loop), then in which group, calculate the combined score
        for context_id, group in raw_results_df.groupby('context_id'):
            max_score_0 = group[group['clause_id'] == 0]['score'].max() if not group[group['clause_id'] == 0].empty else 10
            max_score_1 = group[group['clause_id'] == 1]['score'].max() if not group[group['clause_id'] == 1].empty else 10
            combined_score = combine_score.get_combine_score([max_score_0, max_score_1])
            raw_results_df.loc[group.index, 'combined_score'] = combined_score
        
        # sort by combined score, then by url
        raw_results_df.sort_values(by=['combined_score', 'url'], ascending=[False, True], inplace=True)
        
        print(f"Search semantic found {len(raw_results_df)} results")
        return {
            "urls": raw_results_df['url'].tolist(),
            "scores": raw_results_df["combined_score"].tolist(),
        }


def search_objects(object_local_encoding, color_local_encoding, subset: list[str]) -> list[dict]: 
    body = {
        "query": {
            "bool": {
                "should": [
                    {
                        "match": {
                            "object_local_encoding": {
                                "query": object_local_encoding,
                            }                              
                        }
                    },
                    {
                        "match": {
                            "color_local_encoding": {
                                "query": color_local_encoding,
                            }
                        }
                    }
                ],
            },
        }
    }  
    if subset != []:
        body["query"]["bool"]["must"] = {
            "terms": {
                "_id": subset,
            }
        }
    response = setup.es_client.search(
        index=index_name,
        size=1000,
        body=body
    )
    response = response["hits"]["hits"]
    urls = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    print(f"Search objects found {len(urls)} results")
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
    print(f"Search keyword found {len(urls)} results")
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


