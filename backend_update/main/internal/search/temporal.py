
import itertools
import numpy as np
import pandas as pd
from fastapi import status, HTTPException
from internal.search.scorer import get_combine_score, get_standardized_scores
from internal.api_handler import fetch_embeddings, compute_text_embedding
from schemas.request_schemas import QueryClause
import time

from dataset.dataset_manager import DatasetManager


async def expand_temporal(prev_result, next_clause: QueryClause, dataset: str, temporal_window_size: int, threshold: float):
    result = {
        "record_ids": [],
        "scores": [],
    }

    RECORD_IDS_CUTOFF_1 = 100
    RECORD_IDS_CUTOFF_2 = 300

    record_ids = prev_result["record_ids"]
    record_scores = prev_result["scores"]
    all_next_record_ids = {}

    for i, record_id in enumerate(record_ids):
        if i < RECORD_IDS_CUTOFF_1:
            neighbors = list(range(int(record_id) + 1, int(record_id) + int(temporal_window_size + 1)))
        elif i < RECORD_IDS_CUTOFF_2:
            neighbors = list(range(int(record_id) + 1, int(record_id) + int(temporal_window_size / 2 + 1)))
        else:
            neighbors = list(range(int(record_id) + 1, int(record_id) + int(temporal_window_size / 3 + 1)))
        all_next_record_ids[record_id] = neighbors

    all_next_flat = list(itertools.chain.from_iterable(all_next_record_ids.values()))
    all_next_flat = list(set(all_next_flat))
    print(f"Total next record IDs to fetch: {len(all_next_flat)}")

    # Fetch embeddings (ordered list)
    start_time = time.time()
    all_next_embeddings_list = await fetch_embeddings(
        record_ids=all_next_flat,
        dataset=dataset,
        model="clips"
    )
    print(f"Fetched embeddings for {len(all_next_flat)} records in {time.time() - start_time:.2f} seconds")

    # Convert to NumPy matrix
    embeddings_matrix = np.vstack(all_next_embeddings_list)  # shape: (N, D)
    print(f"Embeddings matrix shape: {embeddings_matrix.shape}")

    # Normalize next clause embedding
    next_clause_embedding = await compute_text_embedding(next_clause.text, model="clips")
    next_clause_embedding = np.array(next_clause_embedding).reshape(1, -1)  # shape: (1, D)
    print(f"Next clause embedding shape: {next_clause_embedding.shape}")

    # Compute all similarities in one go    
    start_time = time.time()
    similarities = embeddings_matrix @ next_clause_embedding.T  # shape: (N,)
    print(f"Similarities shape: {similarities.shape}")
    print(f"Computed similarities in {time.time() - start_time:.2f} seconds")

    # Map similarities back to record IDs
    id_to_score = dict(zip(all_next_flat, similarities))
    print(f"ID to score mapping: {len(id_to_score)} entries")

    start_time = time.time()
    for record_id, record_score in zip(record_ids, record_scores):
        next_ids = all_next_record_ids[record_id]
        scored_neighbors = [(nid, id_to_score.get(nid, -1)) for nid in next_ids]

        # Pick best match
        best_next_id, best_score = max(scored_neighbors, key=lambda x: x[1])
        best_score = float(best_score)

        if best_score >= threshold:
            mid_record_id = int((int(record_id) + int(best_next_id)) / 2)
            combined_score = get_combine_score([record_score, best_score])
            result["record_ids"].append(mid_record_id)
            result["scores"].append(combined_score)
    print(f"Processed {len(result['record_ids'])} records in {time.time() - start_time:.2f} seconds")

    # sort results by score
    if result["scores"]:
        sorted_indices = np.argsort(result["scores"])[::-1]
        result["record_ids"] = [result["record_ids"][i] for i in sorted_indices]
        result["scores"] = [result["scores"][i] for i in sorted_indices]

    return result



def aggregate_temporal(partial_results: list[dict], dataset: str, top_k: int):
    for i in range(len(partial_results)):
        partial_results[i]["scores"] = get_standardized_scores(partial_results[i]["scores"])

    # Build list of rows
    rows = []
    dm = DatasetManager.get_dataset(dataset)
    for i, partial_result in enumerate(partial_results):
        record_ids = partial_result["record_ids"]
        scores = partial_result["scores"]
        unifying_ids = dm.get_unifying_category_ids(record_ids)
        for rid, score, ucid in zip(record_ids, scores, unifying_ids):
            if ucid is not None:
                rows.append((rid, score, ucid, i))

    df = pd.DataFrame(rows, columns=['record_id', 'score', 'unifying_category_id', 'clause_id'])

    # Precompute max scores per clause
    max_scores = df.groupby(['unifying_category_id', 'clause_id'])['score'].max().unstack(fill_value=10)
    max_scores['combined_score'] = max_scores.apply(lambda row: get_combine_score([row.get(0, 10), row.get(1, 10)]), axis=1)

    # Keep top N combined scores
    top_ids = max_scores['combined_score'].nlargest(top_k).index.tolist()
    top_combined_scores = max_scores.loc[top_ids]['combined_score'].to_dict()

    # Filter df to only those unifying_category_ids
    df = df[df['unifying_category_id'].isin([uid for uid, _ in top_combined_scores.items()])].copy()

    # Map combined scores back
    df['combined_score'] = df['unifying_category_id'].map(top_combined_scores)

    # Keep flags for top 1 per clause within group
    df['rank_within_clause'] = df.groupby(['unifying_category_id', 'clause_id'])['score'].rank(method='first', ascending=False)
    df['keep'] = df['rank_within_clause'] <= 1

    # Final dedup and sort
    df = df[df['keep']]
    df.sort_values(by=['combined_score', 'record_id'], ascending=[False, True], inplace=True)
    df.drop_duplicates(subset='record_id', inplace=True)

    # Group and reduce: mean record_id and max score
    # summary_df = df.groupby('unifying_category_id').agg({
    #     'record_id': 'mean',
    #     'combined_score': 'max'
    # }).astype({'record_id': int})
    summary_df = df.copy()

    # Sort by combined_score descending
    summary_df.sort_values(by='combined_score', ascending=False, inplace=True)
    print(f"Summary DataFrame:\n{summary_df}")

    # Build final result using the sorted summary
    result = {
        "record_ids": summary_df['record_id'].tolist(),
        "scores": summary_df['combined_score'].tolist(),
        # "all_neighbor_ids": {
        #     int(group['record_id'].mean()): sorted(group['record_id'].tolist())
        #     for unifying_category_id in summary_df.index
        #     for _, group in [df[df['unifying_category_id'] == unifying_category_id]]
        # }
    }

    return result
