import setup
from setup import dataset_config, all_image_names
import numpy as np
import pandas as pd
import requests
from abc import ABC, abstractmethod
from internal.search.parser import all_parsers, time_helpers
from internal.search.scorer import combine_score



# dataset_name = dataset_config['dataset_name']
# metadata_index_name = dataset_name
# encoding_index_name = dataset_name + "_encoding"


class SearchModule(ABC):
    def __init__(self, dataset):
        self.dataset = dataset

    @abstractmethod
    def search_keywords(self, query: str):
        pass    


class SearchModuleAIC24(SearchModule):
    def __init__(self):
        super().__init__("aic24")

    @staticmethod
    def search_keywords(dataset_variant: str, clause: str, fields: list[str], subset: list[str] = []) -> list[dict]:
        field_items = {}
        for key in fields:
            field_items[key] = clause

        parsed_ocr = all_parsers.parse_ocr(clause)
        if "ocr" in fields and parsed_ocr:
            field_items["ocr"] = parsed_ocr

        body = {
            "query": {
                "bool": {
                    "should": []
                }
            }
        }

        for key, value in field_items.items():
            body["query"]["bool"]["should"].append({
                "match": {
                    key: {
                        "query": value,
                        "fuzziness": "AUTO",
                    }
                }
            })

        # body = {
        #     "query": {
        #         "bool": {
        #             "should": [
        #                 {
        #                     "match": {
        #                         "caption": {
        #                             "query": clause,
        #                             "fuzziness": "AUTO",
        #                         }                              
        #                     }
        #                 }, 
        #                 {
        #                     "match": {
        #                         "context_en_keywords": {
        #                             "query": clause,
        #                             "fuzziness": "AUTO",
        #                         }                              
        #                     }
        #                 }
        #             ]
        #         }
        #     }        
        # }

        # parsed_ocr = all_parsers.parse_ocr(clause)
        # if parsed_ocr:
        #     print(f"parsed_ocr: {parsed_ocr}")
        #     body["query"]["bool"]["should"].append({
        #         "match": {
        #             "ocr": {
        #                 "query": parsed_ocr,
        #                 "fuzziness": "AUTO",
        #             }                              
        #         }
        #     })

        if subset != []:
            subset = list(set(subset) & set(all_image_names))
            body["query"]["bool"]["must"] = {
                "terms": {
                    "_id": subset,
                }
            }

        metadata_index_name = dataset_variant
        response = setup.es_client.search(
            index=metadata_index_name,
            size=1000,
            body=body
        )
        response = response["hits"]["hits"]
        ids = [hit["_id"] for hit in response]
        scores = [hit["_score"] for hit in response]
        print(f"Search keyword found {len(ids)} results")
        return {
            "ids": ids,
            "scores": scores,
        }


class SearchModuleLSC24(SearchModule):
    def __init__(self):
        super().__init__("lsc24")

    @staticmethod
    def search_keywords(dataset_variant: str, clause: str, fields: list[str], subset: list[str] = []) -> list[dict]:
        field_items = {}
        for key in fields:
            field_items[key] = clause

        parsed_ocr = all_parsers.parse_ocr(clause)
        if "ocr" in fields and parsed_ocr:
            field_items["ocr"] = parsed_ocr

        date1, time1, date2, time2 = all_parsers.parse_date_time(clause)
        date1, time1, date2, time2, date_boost, time_boost = time_helpers.fill_date_time(date1, time1, date2, time2)

        body = {
            "query": {
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
                        }
                    ]
                }
            }
        }

        for key, value in field_items.items():
            body["query"]["bool"]["should"].append({
                "match": {
                    key: {
                        "query": value,
                        "fuzziness": "AUTO",
                    }
                }
            })

        if subset != []:
            subset = list(set(subset) & set(all_image_names))
            body["query"]["bool"]["must"] = {
                "terms": {
                    "_id": subset,
                }
            }

        metadata_index_name = dataset_variant
        response = setup.es_client.search(
            index=metadata_index_name,
            size=1000,
            body=body
        )
        response = response["hits"]["hits"]
        ids = [hit["_id"] for hit in response]
        scores = [hit["_score"] for hit in response]
        print(f"Search keyword found {len(ids)} results")

        # add date time to field_items for logging
        field_items["date"] = f"{date1}-{date2}"
        field_items["time"] = f"{time1}-{time2}"
        return {
            "ids": ids,
            "scores": scores,
        }, field_items


class SearchModuleManager:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(SearchModuleManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, "search_modules"):
            self.search_modules = {
                'aic24': SearchModuleAIC24(),
                'lsc24': SearchModuleLSC24()
            }

    def register_search_module(self, dataset, search_module):
        if dataset not in self.search_modules.keys():
            self.search_modules[dataset] = search_module

    def get_search_module(self, dataset):
        search_module = self.search_modules.get(dataset)
        if not search_module:
            raise ValueError(f"Search module wasn't registered for dataset: {dataset}")
        return search_module   


def temporal_aggregate(clause_ids: list[list[str]], clause_scores: list[list[float]]):
    # normalize scores
    for i in range(len(clause_scores)):
        clause_scores[i] = combine_score.get_standardized_scores(clause_scores[i])

    # # convert into DataFrame
    # raw_results_df = pd.DataFrame(columns=['url', 'score', 'context_id_coarse', 'clause_id'])
    # for i, ids in enumerate(clause_ids):
    #     for j, url in enumerate(ids):
    #         raw_results_df.loc[len(raw_results_df)] = [url, clause_scores[i][j], setup.metadata_rows.loc[url, 'context_id_coarse'], i]

    # convert into DataFrame
    rows = []
    for i, ids in enumerate(clause_ids):
        context_ids_coarse = setup.metadata_rows_context_id_coarse.loc[ids].tolist()
        for j, url in enumerate(ids):
            rows.append([url, clause_scores[i][j], context_ids_coarse[j], i])
            # print(context_ids_coarse[j])
    raw_results_df = pd.DataFrame(rows, columns=['url', 'score', 'context_id_coarse', 'clause_id'])


    # drop context_id_coarse = None
    raw_results_df = raw_results_df.dropna(subset=['context_id_coarse'])

    # # group by context_id_coarse (a for loop), then in which group, calculate the combined score
    # for context_id_coarse, group in raw_results_df.groupby('context_id_coarse'):
    #     max_score_0 = group[group['clause_id'] == 0]['score'].max() if not group[group['clause_id'] == 0].empty else 10
    #     max_score_1 = group[group['clause_id'] == 1]['score'].max() if not group[group['clause_id'] == 1].empty else 10
    #     combined_score = combine_score.get_combine_score([max_score_0, max_score_1])
    #     raw_results_df.loc[group.index, 'combined_score'] = combined_score
    #     raw_results_df.loc[group.index, 'max_score_0'] = max_score_0
    #     raw_results_df.loc[group.index, 'max_score_1'] = max_score_1
    #     # for clause_id = 0, only keep 2 highest scores, the same to clause_id = 1
    #     for clause_id, clause_group in group.groupby('clause_id'):
    #         if clause_id == 0:
    #             raw_results_df.loc[clause_group.nlargest(2, 'score').index, 'keep'] = True
    #         else:
    #             raw_results_df.loc[clause_group.nlargest(2, 'score').index, 'keep'] = True


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

        # # Get max scores for both clause_id 0 and 1 (precomputed)
        # max_score_0 = clause_0_scores.get(context_id_coarse, 10)
        # max_score_1 = clause_1_scores.get(context_id_coarse, 10)
        
        # Calculate the combined score
        # combined_score = combine_score.get_combine_score([max_score_0, max_score_1])
        combined_score = combined_scores.loc[context_id_coarse]
        
        # Update the group in the DataFrame
        raw_results_df.loc[group.index, 'combined_score'] = combined_score
        # raw_results_df.loc[group.index, 'max_score_0'] = max_score_0
        # raw_results_df.loc[group.index, 'max_score_1'] = max_score_1
        
        # Mark top 2 scores in each clause_id group as 'keep'
        top_2_clause_0 = group[group['clause_id'] == 0].nlargest(2, 'score')
        top_2_clause_1 = group[group['clause_id'] == 1].nlargest(2, 'score')
        
        raw_results_df.loc[top_2_clause_0.index, 'keep'] = True
        raw_results_df.loc[top_2_clause_1.index, 'keep'] = True

        # drop rows where combined_score = NaN
        raw_results_df = raw_results_df.dropna(subset=['combined_score'])

    
    # sort by combined score, then by url -> remove duplicates by 'url' -> filter those with 'keep' = True
    raw_results_df.sort_values(by=['combined_score', 'url'], ascending=[False, True], inplace=True)
    raw_results_df.drop_duplicates(subset='url', keep='first', inplace=True)
    raw_results_df = raw_results_df[raw_results_df['keep'] == True]

    return raw_results_df


def search_semantic_temporal(dataset: str, model: str, text_embeddings: list[str]):
    clause_ids = []
    clause_scores = []
    
    for text_embedding in text_embeddings:
        data = {
            "model": model,
            "embedding": text_embedding,
            "dataset": dataset,
        }
        response = requests.post("http://localhost:8004/search_milvus", json=data, headers={
            "Content-Type": "application/json"
        })
        raw_results = response.json()
        ids = [entity['id'] for entity in raw_results['response'][0]]
        scores = [entity['distance'] for entity in raw_results['response'][0]]
        clause_ids.append(ids)
        clause_scores.append(scores)

    # Single query
    if len(text_embeddings) == 1:  
        print(f"Search semantic found {len(clause_ids[0])} results")
        for i in range(20):
            print(i, clause_ids[0][i], clause_scores[0][i])
        return {
            "ids": clause_ids[0],
            "scores": clause_scores[0],
        }
    # Temporal query
    else:
        # # normalize scores
        # for i in range(len(clause_scores)):
        #     clause_scores[i] = combine_score.get_standardized_scores(clause_scores[i])

        # # convert into DataFrame
        # raw_results_df = pd.DataFrame(columns=['url', 'score', 'context_id', 'clause_id'])
        # for i, ids in enumerate(clause_ids):
        #     for j, url in enumerate(ids):
        #         raw_results_df.loc[len(raw_results_df)] = [url, clause_scores[i][j], setup.metadata_rows.loc[url, 'context_id'], i]

        # # drop context_id = None
        # raw_results_df = raw_results_df.dropna(subset=['context_id'])

        # # group by context_id (a for loop), then in which group, calculate the combined score
        # for context_id, group in raw_results_df.groupby('context_id'):
        #     max_score_0 = group[group['clause_id'] == 0]['score'].max() if not group[group['clause_id'] == 0].empty else 10
        #     max_score_1 = group[group['clause_id'] == 1]['score'].max() if not group[group['clause_id'] == 1].empty else 10
        #     combined_score = combine_score.get_combine_score([max_score_0, max_score_1])
        #     raw_results_df.loc[group.index, 'combined_score'] = combined_score
        #     raw_results_df.loc[group.index, 'max_score_0'] = max_score_0
        #     raw_results_df.loc[group.index, 'max_score_1'] = max_score_1
        #     # for clause_id = 0, only keep 2 highest scores, the same to clause_id = 1
        #     for clause_id, clause_group in group.groupby('clause_id'):
        #         if clause_id == 0:
        #             raw_results_df.loc[clause_group.nlargest(2, 'score').index, 'keep'] = True
        #         else:
        #             raw_results_df.loc[clause_group.nlargest(2, 'score').index, 'keep'] = True

        
        # # sort by combined score, then by url
        # # remove duplicates by 'url'
        # # filter those with 'keep' = True
        # raw_results_df.sort_values(by=['combined_score', 'url'], ascending=[False, True], inplace=True)
        # raw_results_df.drop_duplicates(subset='url', keep='first', inplace=True)
        # raw_results_df = raw_results_df[raw_results_df['keep'] == True]
        raw_results_df = temporal_aggregate(clause_ids, clause_scores)
        print(f"Search semantic found {len(raw_results_df)} results\n")

        return {
            "ids": raw_results_df['url'].tolist(),
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
        subset = list(set(subset) & set(all_image_names))
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
    ids = [hit["_id"] for hit in response]
    scores = [hit["_score"] for hit in response]
    print(f"Search objects found {len(ids)} results")
    return {
        "ids": ids,
        "scores": scores,
    }


# def search_keywords(dataset: str, clause: str, subset: list[str] = []) -> list[dict]:  
#     body = {
#         "query": {
#             "bool": {
#                 "should": []
#             }
#         }        
#     }
#     if dataset == "aic24_lesson" or dataset == "aic24_cooking":
#         body["query"]["bool"]["should"].append({
#             "match": {
#                 "context_vi": {
#                     "query": clause,
#                     "fuzziness": "AUTO",
#                 }                              
#             }
#         })
#     else:
#         body["query"]["bool"]["should"].extend([
#             {
#                 "match": {
#                     "caption": {
#                         "query": clause,
#                         "fuzziness": "AUTO",
#                     }                              
#                 }
#             }, 
#             {
#                 "match": {
#                     "context_en_keywords": {
#                         "query": clause,
#                         "fuzziness": "AUTO",
#                     }                              
#                 }
#             }
#         ])
      
#     parsed_ocr = all_parsers.parse_ocr(clause)
#     if parsed_ocr:
#         print(f"parsed_ocr: {parsed_ocr}")
#         body["query"]["bool"]["should"].append({
#             "match": {
#                 "ocr": {
#                     "query": parsed_ocr,
#                     "fuzziness": "AUTO",
#                 }                              
#             }
#         })

#     if subset != []:
#         subset = list(set(subset) & set(all_image_names))
#         body["query"]["bool"]["must"] = {
#             "terms": {
#                 "_id": subset,
#             }
#         }

#     metadata_index_name = dataset
#     response = setup.es_client.search(
#         index=metadata_index_name,
#         size=1000,
#         body=body
#     )
#     response = response["hits"]["hits"]
#     ids = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     print(f"Search keyword found {len(ids)} results")
#     return {
#         "ids": ids,
#         "scores": scores,
#     }

# def search_keyword_lsc(text_query: str, subset: list[str]) -> list[dict]:    
#     parsed_ocr = all_parsers.parse_ocr(text_query)
#     date1, time1, date2, time2 = all_parsers.parse_date_time(text_query)
#     date1, time1, date2, time2, date_boost, time_boost = time_helpers.fill_date_time(date1, time1, date2, time2)

#     body = {
#         "query": {
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
#                         "match": {
#                             "caption": {
#                                 "query": text_query,
#                                 "fuzziness": "AUTO",
#                             }                              
#                         }
#                     },
#                     {
#                         "match": {
#                             "location": {
#                                 "query": text_query,
#                                 "fuzziness": "AUTO",
#                             }                              
#                         }
#                     },
#                     {
#                         "match": {
#                             "object_tags": {
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
#                     }
#                 ]
#             }
#         }
#     }
#     if parsed_ocr:
#         print(f"parsed_ocr: {parsed_ocr}")
#         body["query"]["bool"]["should"].append({
#             "match": {
#                 "ocr": {
#                     "query": parsed_ocr,
#                     "fuzziness": "AUTO",
#                 }                              
#             }
#         })
#     if subset != []:
#         body["query"]["bool"]["must"] = {
#             "terms": {
#                 "_id": subset,
#             }
#         }
#     response = setup.es_client.search(
#         index=index_name,
#         size=1000,
#         body=body
#     )
#     response = response["hits"]["hits"]
#     ids = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]

# def search_match_object_tags(text_query: str) -> list[dict]: 
#     parsed_object_tags = all_parsers.parse_object_tags(text_query)
#     if parsed_object_tags is None:
#         return None
#     response = setup.es_client.search(
#         index=index_name,
#         size=1000,
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
#     ids = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "ids": ids,
#         "scores": scores,
#     }


def search_keywords_temporal(dataset: str, text_query: str, subset: list[str] = []) -> list[dict]:
    clause_ids = []
    clause_scores = []
    dataset_variant = dataset
    dataset = dataset.split("_")[0]
    if dataset_variant in ["aic24_cooking", "aic24_lesson"]:
            fields = ["context_vi", "ocr"]
    elif dataset_variant in ["aic24"]:
        fields = ["caption", "context_en_keywords", "ocr"]
    else:
        fields = ["caption", "location", "object_tags", "ocr"]

    if "|" in text_query:
        print("Temporal query detected. Splitting...\n")
        clauses = text_query.split("|")[:2]
        for clause in clauses:
            print(f"Searching for keyword: {clause}")
            clause_results, field_items = SearchModuleManager().get_search_module(dataset).search_keywords(dataset_variant, text_query, fields, subset)
            clause_ids.append(clause_results["ids"])
            clause_scores.append(clause_results["scores"])
        raw_results_df = temporal_aggregate(clause_ids, clause_scores)
        print(f"Search keyword found {len(raw_results_df)} results")
        return {
            "ids": raw_results_df['url'].tolist(),
            "scores": raw_results_df["combined_score"].tolist(),
        }, field_items
    
    else:
        print("Single query detected.\n")
        print(f"Searching for keyword: {text_query}\n")
        
        clause_results, field_items = SearchModuleManager().get_search_module(dataset).search_keywords(dataset_variant, text_query, fields, subset)
        return {
            "ids": clause_results["ids"],
            "scores": clause_results["scores"],
        }, field_items



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
#     ids = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "ids": ids,
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
#     ids = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "ids": ids,
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
#     ids = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "ids": ids,
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
#     ids = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "ids": ids,
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
#     ids = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "ids": ids,
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
#     ids = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "ids": ids,
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
#     ids = [hit["_id"] for hit in response]
#     scores = [hit["_score"] for hit in response]
#     return {
#         "ids": ids,
#         "scores": scores,
#     }


