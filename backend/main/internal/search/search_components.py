import setup
from setup import dataset_config, image_names
import pandas as pd
import requests
import itertools
from internal.search.parser import all_parsers
from internal.search.scorer import combine_score
from internal.prepare_response import prepare_response
from functools import reduce

import sys
sys.path.append('..')
from db.search import search_video_ids_by_ids

# dataset_name = dataset_config['dataset_name']
# metadata_index_name = dataset_name
# encoding_index_name = dataset_name + "_encoding"


MAX_TEMPORAL_CONTEXT = 5


def temporal_aggregate(clause_record_ids: list[list[str]], clause_scores: list[list[float]]):
    # normalize scores
    for i in range(len(clause_scores)):
        clause_scores[i] = combine_score.get_standardized_scores(clause_scores[i])

    # convert into DataFrame
    rows = []
    for i, record_ids in enumerate(clause_record_ids):
        context_ids_coarse = setup.metadata_rows_context_id_coarse.loc[record_ids].tolist()
        for j, record_id in enumerate(record_ids):
            rows.append([record_id, clause_scores[i][j], context_ids_coarse[j], i])
    raw_results_df = pd.DataFrame(rows, columns=['record_id', 'score', 'context_id_coarse', 'clause_id'])

    # drop context_id_coarse = None
    raw_results_df = raw_results_df.dropna(subset=['context_id_coarse'])

    # Initialize new columns for combined_score, max_score_0, max_score_1, and keep
    raw_results_df['combined_score'] = 0.0
    raw_results_df['max_score_0'] = 0.0
    raw_results_df['max_score_1'] = 0.0
    raw_results_df['keep'] = False

    # Precompute max scores for clause_id == 0 and clause_id == 1 in a single step
    clause_0_scores = raw_results_df[raw_results_df['clause_id'] == 0].groupby('context_id_coarse')['score'].max().fillna(10)
    clause_1_scores = raw_results_df[raw_results_df['clause_id'] == 1].groupby('context_id_coarse')['score'].max().fillna(10)
    scores_df = pd.DataFrame({'clause_0_scores': clause_0_scores, 'clause_1_scores': clause_1_scores})
    scores_df['combined_scores'] = scores_df.apply(
        lambda row: combine_score.get_combine_score([row['clause_0_scores'], row['clause_1_scores']]), axis=1
    )    

    # Sort descending and keep only 50 in combined_scores
    combined_scores = scores_df['combined_scores'].nlargest(100)
    context_ids_coarse_with_max_scores = combined_scores.index.tolist()

    # Now, iterate over each context_id_coarse group
    for context_id_coarse, group in raw_results_df.groupby('context_id_coarse'):
        
        if context_id_coarse not in context_ids_coarse_with_max_scores:
            continue
        
        # Calculate the combined score
        combined_score = combined_scores.loc[context_id_coarse]
        
        # Update the group in the DataFrame
        raw_results_df.loc[group.index, 'combined_score'] = combined_score
        
        # Mark top 2 scores in each clause_id group as 'keep'
        top_2_clause_0 = group[group['clause_id'] == 0].nlargest(2, 'score')
        top_2_clause_1 = group[group['clause_id'] == 1].nlargest(2, 'score')
        
        raw_results_df.loc[top_2_clause_0.index, 'keep'] = True
        raw_results_df.loc[top_2_clause_1.index, 'keep'] = True

        # drop rows where combined_score = NaN
        raw_results_df = raw_results_df.dropna(subset=['combined_score'])

    
    # sort by combined score, then by record_id -> remove duplicates by 'record_id' -> filter those with 'keep' = True
    raw_results_df.sort_values(by=['combined_score', 'record_id'], ascending=[False, True], inplace=True)
    raw_results_df.drop_duplicates(subset='record_id', keep='first', inplace=True)
    raw_results_df = raw_results_df[raw_results_df['keep'] == True]

    return raw_results_df


def search_semantic_temporal(dataset: str, model: str, text_embeddings: list[str]):
    temporal_ids = []
    final_record_ids = []
    final_video_ids = []
    final_scores = []

    for text_embedding in text_embeddings:
        data = {
            "model": model,
            "embedding": text_embedding,
            "dataset": dataset,
            "ids": temporal_ids
        }
        response = requests.post("http://localhost:8003/search_milvus", json=data, headers={
            "Content-Type": "application/json"
        })
        raw_results = response.json()
        record_ids = [entity['id'] for entity in raw_results['response'][0]]
        scores = [entity['distance'] for entity in raw_results['response'][0]]
        final_record_ids.append(record_ids)
        final_video_ids.append(search_video_ids_by_ids(dataset, "keyframes", record_ids))
        final_scores.append(scores)

        neighbor_ids = [list(range(int(record_id), int(record_id) + MAX_TEMPORAL_CONTEXT + 1)) for record_id in record_ids]
        neighbor_ids_flat = list(itertools.chain.from_iterable(neighbor_ids))
        temporal_ids = neighbor_ids_flat

    if len(text_embeddings) == 1:
        print(f"Search semantic found {len(final_record_ids[0])} results")
        return {
            "record_ids": final_record_ids[0],
            "scores": final_scores[0],
        }
    
    # Temporal query
    else:    
        # zip each of the 3-tuple into a df
        dfs = []
        for i in range(len(final_record_ids)):
            df = pd.DataFrame({
                'record_id': final_record_ids[i],
                'video_id': final_video_ids[i],
                'score': final_scores[i],
            })
        dfs.append(df)

        # Get the highest score for each video_id in each DataFrame
        highest_scores_dfs = []
        for df in dfs:
            highest_scores_df = df.groupby('video_id').apply(
                lambda x: pd.Series({
                    'score': x['score'].max(),  # Highest score
                    'all_record_ids': list(x['record_id'])  # List of all record IDs for the video_id
                })
            ).reset_index()
            highest_scores_dfs.append(highest_scores_df)

        # Merge all DataFrames in highest_scores_dfs by video_id
        merged_df = reduce(
            lambda left, right: pd.merge(left, right, on='video_id', how='outer', suffixes=('', '_y')),
            highest_scores_dfs
        )

        # Fill missing scores with 0 and `all_record_ids` with empty lists
        merged_df['score'] = merged_df['score'].fillna(0)
        merged_df['all_record_ids'] = merged_df['all_record_ids'].apply(lambda x: x if isinstance(x, list) else [])

        # Combine scores and record_ids
        merged_df = merged_df.groupby('video_id').agg(
            combined_score=('score', 'sum'),  # Sum scores across all DataFrames
            combined_record_ids=('all_record_ids', lambda x: sorted(set(sum(x, []))))  # Flatten, convert to set, and sort
        ).reset_index()

        # Sort the DataFrame by video_id in descending order
        merged_df = merged_df.sort_values(by='combined_score', ascending=False)

        print(f"Merged DataFrame shape: {merged_df.shape}")
        print(f"Merged DataFrame: \n{merged_df.head(20)}")

        # Create the final lists
        final_grouped_record_ids = []
        final_scores = []

        for _, row in merged_df.iterrows():
            record_ids = row['combined_record_ids']
            score = row['combined_score']
            
            # Extend the final lists with record_ids and corresponding scores
            final_grouped_record_ids.append(record_ids)
            final_scores.append(score)

        return {
            "record_ids": final_grouped_record_ids,
            "scores": final_scores,
        }


        


def search_semantic_temporal_deprecated(dataset: str, model: str, text_embeddings: list[str]):
    clause_record_ids = []
    clause_scores = []
    
    for text_embedding in text_embeddings:
        data = {
            "model": model,
            "embedding": text_embedding,
            "dataset": dataset,
        }
        response = requests.post("http://localhost:8003/search_milvus", json=data, headers={
            "Content-Type": "application/json"
        })
        raw_results = response.json()
        record_ids = [entity['id'] for entity in raw_results['response'][0]]
        scores = [entity['distance'] for entity in raw_results['response'][0]]
        clause_record_ids.append(record_ids)
        clause_scores.append(scores)

    # Single query
    if len(text_embeddings) == 1:  
        print(f"Search semantic found {len(clause_record_ids[0])} results")
        return {
            "record_ids": clause_record_ids[0],
            "scores": clause_scores[0],
        }
    # Temporal query
    else:
        raw_results_df = temporal_aggregate(clause_record_ids, clause_scores)
        print(f"Search semantic found {len(raw_results_df)} results\n")

        return {
            "record_ids": raw_results_df['record_id'].tolist(),
            "scores": raw_results_df["combined_score"].tolist(),
        }


def search_objects(dataset: str, object_local_encoding, color_local_encoding, pose_local_encoding, subset: list[str] = []) -> list[dict]: 
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
                    },
                    {
                        "match": {
                            "pose_local_encoding": {
                                "query": pose_local_encoding,
                            }
                        }
                    },
                ],
            },
        }
    }  

    if subset != []:
        subset = list(set(subset) & set(image_names))
        body["query"]["bool"]["must"] = {
            "terms": {
                "_id": subset,
            }
        }

    # encoding_index_name = dataset + "_encoding"
    encoding_index_name = "aic24_encoding"
    response = setup.es_client.search(
        index=encoding_index_name,
        size=1000,
        body=body
    )
    response = response["hits"]["hits"]
    record_ids = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    print(f"Search objects found {len(record_ids)} results")
    return {
        "record_ids": record_ids,
        "scores": scores,
    }


def search_keywords(dataset: str, clause: str, subset: list[str] = []) -> list[dict]:  
    body = {
        "query": {
            "bool": {
                "should": []
            }
        }        
    }
    if dataset == "aic24_lesson" or dataset == "aic24_cooking":
        body["query"]["bool"]["should"].append({
            "match": {
                "context_vi": {
                    "query": clause,
                    "fuzziness": "AUTO",
                }                              
            }
        })
    else:
        body["query"]["bool"]["should"].extend([
            {
                "match": {
                    "caption": {
                        "query": clause,
                        "fuzziness": "AUTO",
                    }                              
                }
            }, 
            {
                "match": {
                    "context_en_keywords": {
                        "query": clause,
                        "fuzziness": "AUTO",
                    }                              
                }
            }
        ])
      
    parsed_ocr = all_parsers.parse_ocr(clause)
    if parsed_ocr:
        print(f"parsed_ocr: {parsed_ocr}")
        body["query"]["bool"]["should"].append({
            "match": {
                "ocr": {
                    "query": parsed_ocr,
                    "fuzziness": "AUTO",
                }                              
            }
        })

    if subset != []:
        subset = list(set(subset) & set(image_names))
        body["query"]["bool"]["must"] = {
            "terms": {
                "_id": subset,
            }
        }

    metadata_index_name = dataset
    response = setup.es_client.search(
        index=metadata_index_name,
        size=1000,
        body=body
    )
    response = response["hits"]["hits"]
    record_ids = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]

    print(f"Search keyword found {len(record_ids)} results")
    return {
        "record_ids": record_ids,
        "scores": scores,
    }


def search_keywords_temporal(dataset: str, text_query: str, subset: list[str] = []) -> list[dict]:
    clause_record_ids = []
    clause_scores = []

    if "|" in text_query:
        print("Temporal query detected. Splitting...\n")
        clauses = text_query.split("|")[:2]
        for clause in clauses:
            print(f"Searching for keyword: {clause}")
            clause_results = search_keywords(dataset, clause, subset)
            clause_record_ids.append(clause_results["record_ids"])
            clause_scores.append(clause_results["scores"])
        raw_results_df = temporal_aggregate(clause_record_ids, clause_scores)
        print(f"Search keyword found {len(raw_results_df)} results")
        return {
            "record_ids": raw_results_df['record_id'].tolist(),
            "scores": raw_results_df["combined_score"].tolist(),
        }
    
    else:
        print("Single query detected.\n")
        print(f"Searching for keyword: {text_query}\n")
        clause_results = search_keywords(dataset, text_query)
        return {
            "record_ids": clause_results["record_ids"],
            "scores": clause_results["scores"],
        }



# def search_match_object_tags(text_query: str) -> list[dict]: 
#     parsed_object_tags = all_parsers.parse_object_tags(text_query)
#     if parsed_object_tags is None:
#         return None
#     response = setup.es_client.search(
#         index=metadata_index_name,
#         size=5000,
#         query={
#             "match": {
#                 "object_tags": {
#                     "query": parsed_object_tags,
#                     "fuzziness": "AUTO",
#                 }   
#             }
#         },
#     )
#     response = response["hits"]["hits"]
#     urls = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "urls": urls,
#         "scores": scores,
#     }

# def search_match_location(text_query: str) -> list[dict]:
#     parsed_location = all_parsers.parse_location(text_query)
#     if parsed_location is None:
#         return None
#     response = setup.es_client.search(
#         index=metadata_index_name,
#         size=5000,
#         query={
#             "match": {
#                 "location": {
#                     "query": parsed_location,
#                     "fuzziness": "AUTO",
#                 }   
#             }
#         },
#     )
#     response = response["hits"]["hits"]
#     urls = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "urls": urls,
#         "scores": scores,
#     }

# def search_match_caption(text_query: str) -> list[dict]:
#     response = setup.es_client.search(
#         index=metadata_index_name,
#         size=5000,
#         query={
#             "match": {
#                 "caption": {
#                     "query": text_query,
#                     "fuzziness": "AUTO",
#                 }   
#             }
#         },
#     )
#     response = response["hits"]["hits"]
#     urls = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "urls": urls,
#         "scores": scores,
#     }

# def search_datetime(text_query: str) -> list[dict]:
#     date1, time1, date2, time2 = all_parsers.parse_date_time(text_query)        
#     if date1 == -1 and time1 == -1:
#         return []
#     date1, time1, date2, time2 = time_helpers.fill_date_time(date1, time1, date2, time2)
#     response = setup.es_client.search(
#         index=metadata_index_name,
#         size=10000,
#         query={
#             "bool": {
#                 "must": [
#                     {
#                         "range": {
#                             "local_date": {
#                                 "gte": date1,
#                                 "lte": date2,
#                             }
#                         }
#                     },
#                     {
#                         "range": {
#                             "local_time": {
#                                 "gte": time1,
#                                 "lte": time2,
#                             }
#                         }
#                     }
#                 ]
#             }
#         }
#     )
#     response = response["hits"]["hits"]
#     urls = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "urls": urls,
#         "scores": scores,
#     }

# def search_multimatch(text_query: str):
#     response = setup.es_client.search(
#         index=metadata_index_name,
#         size=10000,
#         query={
#             "multi_match": {
#                 "query" : text_query,
#                 "fields": ["object_tags", "location", "caption", "ocr"],
#                 "fuzziness": "AUTO"
#             }
#         }
#     )
#     response = response["hits"]["hits"]
#     urls = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "urls": urls,
#         "scores": scores,
#     }

# def search_multimatch_datetime(text_query: str):
#     # parse datetime
#     # boosts are the weight of datetime in the whole ElasticSearch query (set to 0.1 if date or time is blank)
#     date1, time1, date2, time2 = all_parsers.parse_date_time(text_query)
#     date1, time1, date2, time2, date_boost, time_boost = time_helpers.fill_date_time(date1, time1, date2, time2)

#     response = setup.es_client.search(
#         index=metadata_index_name,
#         size=10000,
#         query={
#             "bool": {
#                 "should": [
#                     {
#                         "range": {
#                             "local_date": {                                
#                                 "gte": date1,
#                                 "lte": date2,
#                                 "boost": date_boost,
#                             },
#                         }
#                     },
#                     {
#                         "range": {
#                             "local_time": {                                
#                                 "gte": time1,
#                                 "lte": time2,
#                                 "boost": time_boost,
#                             },
#                         }
#                     },
#                     {
#                         "multi_match": {
#                             "query" : text_query,
#                             "fields": ["object_tags", "location", "caption", "ocr"],
#                             "fuzziness": "AUTO"
#                         }
#                     }
#                 ]
#             }
#         }
#     )
#     response = response["hits"]["hits"]
#     urls = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "urls": urls,
#         "scores": scores,
#     }

# def search_3match_datetime(text_query: str):

#     # parse datetime
#     # boosts are the weight of datetime in the whole ElasticSearch query (set to 0.1 if date or time is blank)
#     date1, time1, date2, time2 = all_parsers.parse_date_time(text_query)
#     date1, time1, date2, time2, date_boost, time_boost = time_helpers.fill_date_time(date1, time1, date2, time2)

#     # parse other metadata
#     parsed_object_tags = all_parsers.parse_object_tags(text_query)
#     parsed_location = all_parsers.parse_location(text_query)
#     parsed_ocr = all_parsers.parse_ocr(text_query)
#     print(f"parsed_object_tags: {parsed_object_tags}")
#     print(f"parsed_location: {parsed_location}")
#     print(f"parsed_ocr: {parsed_ocr}")

#     response = setup.es_client.search(
#         index=metadata_index_name,
#         size=10000,
#         query={
#             "bool": {
#                 "should": [
#                     {
#                         "range": {
#                             "local_date": {                                
#                                 "gte": date1,
#                                 "lte": date2,
#                                 "boost": date_boost,
#                             }
#                         }
#                     },
#                     {
#                         "range": {
#                             "local_time": {                                
#                                 "gte": time1,
#                                 "lte": time2,
#                                 "boost": time_boost,
#                             }
#                         }
#                     },
#                     {
#                         "match": {
#                             "object_tags": {
#                                 "query": parsed_object_tags,
#                                 "fuzziness": "AUTO",
#                             }                              
#                         }
#                     },
#                     {
#                         "match": {
#                             "location": {
#                                 "query": parsed_location,
#                                 "fuzziness": "AUTO",
#                             }                              
#                         }
#                     },
#                     {
#                         "match": {
#                             "caption": {
#                                 "query": text_query,
#                                 "fuzziness": "AUTO",
#                             }                              
#                         }
#                     },
#                     {
#                         "match": {
#                             "ocr": {
#                                 "query": parsed_ocr,
#                                 "fuzziness": "AUTO",
#                             }                              
#                         }
#                     },
#                 ]
#             }
#         }
#     )
#     response = response["hits"]["hits"]
#     urls = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "urls": urls,
#         "scores": scores,
#     }


