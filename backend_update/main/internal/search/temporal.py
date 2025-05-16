import pandas as pd
from fastapi import status, HTTPException
from internal.search.scorer import get_combine_score, get_standardized_scores

import sys
sys.path.append('..')
from dataset.dataset_manager import DatasetManager



def expand_temporal(prev_result, next_clause, dataset, temporal_window_size):
    # image_dataset = dataset_manager.get_dataset(dataset)
    
    result = {
        "record_ids": [],
        "scores": [],
    }

    record_ids = prev_result["record_ids"]
    record_scores = prev_result["scores"]
    for record_id, record_score in zip(record_ids, record_scores):
        next_record_ids = list(range(int(record_id) + 1, int(record_id) + temporal_window_size + 1))
        for next_record_id in next_record_ids:
            highest_score = 0
            next_clause_match = record_id
            # TODO
            # score = calculate_score(next_record_id, next_clause, dataset)
            score = 100
            if score > highest_score:
                highest_score = score
                next_clause_match = next_record_id

        # TODO: validate the score match
        # combined_score = combine_score(record_score, highest_score)
        combined_score = record_score

        result["record_ids"].append(int((record_id + next_clause_match) / 2))
        result["scores"].append(combined_score)

    return result



def aggregate_temporal(partial_results: list[dict], dataset):
    for i in range(len(partial_results)):
        partial_scores = partial_results[i]["scores"]
        partial_results[i]["scores"] = get_standardized_scores(partial_scores)

    # convert into DataFrame
    rows = []
    for i, partial_result in enumerate(partial_results):
        partial_record_ids = partial_result["record_ids"]
        partial_scores = partial_result["scores"]
        # TODO
        # unifying_category_ids = setup.metadata_rows_context_id_coarse.loc[partial_record_ids].tolist()
        unifying_category_ids = DatasetManager.get_dataset(dataset).get_unifying_category_ids(partial_record_ids)
        for j, (record_id, score) in enumerate(zip(partial_record_ids, partial_scores)):
            if unifying_category_ids[j] == None:
                print(f"{record_id} has no unifying category id")
            rows.append([record_id, score, unifying_category_ids[j], i])
    raw_results_df = pd.DataFrame(rows, columns=['record_id', 'score', 'unifying_category_id', 'clause_id'])

    # drop unifying_category_id = None
    raw_results_df = raw_results_df.dropna(subset=['unifying_category_id'])

    # Initialize new columns for combined_score, max_score_0, max_score_1, and keep
    raw_results_df['combined_score'] = 0.0
    raw_results_df['max_score_0'] = 0.0
    raw_results_df['max_score_1'] = 0.0
    raw_results_df['keep'] = False

    # Precompute max scores for clause_id == 0 and clause_id == 1 in a single step
    clause_0_scores = raw_results_df[raw_results_df['clause_id'] == 0].groupby('unifying_category_id')['score'].max()
    clause_1_scores = raw_results_df[raw_results_df['clause_id'] == 1].groupby('unifying_category_id')['score'].max()
    scores_df = pd.DataFrame({'clause_0_scores': clause_0_scores, 'clause_1_scores': clause_1_scores})
    scores_df.fillna(10, inplace=True)
    scores_df['combined_scores'] = scores_df.apply(
        lambda row: get_combine_score([row['clause_0_scores'], row['clause_1_scores']]), axis=1
    )

    # Sort descending and keep only 50 in combined_scores
    combined_scores = scores_df['combined_scores'].nlargest(50)
    unifying_category_ids_with_max_scores = combined_scores.index.tolist()

    # Now, iterate over each context_id_coarse group
    for unifying_category_id, group in raw_results_df.groupby('unifying_category_id'):
        
        if unifying_category_id not in unifying_category_ids_with_max_scores:
            continue
        
        # Calculate the combined score
        combined_score = combined_scores.loc[unifying_category_id]
        
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
    print("Final temporal results after aggregation:")
    print(raw_results_df.head(12))
    
    result = {
        "record_ids": [],
        "scores": [],
        "all_neighbor_ids": {}
    }
    raw_results_df_grouped = raw_results_df.groupby('unifying_category_id', sort=False)
    for unifying_category_id, group in raw_results_df_grouped:
        record_id = int(group['record_id'].mean())
        result["record_ids"].append(record_id)
        result["scores"].append(group['combined_score'].max())
        result["all_neighbor_ids"][record_id] = sorted(group['record_id'].tolist())
    return result