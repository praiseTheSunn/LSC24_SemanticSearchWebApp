import numpy as np
import pandas as pd

def get_standardized_scores(scores: list[float]) -> list[float]:    
    # Apply log transformation (shift scores to avoid log(0))
    min_score = np.min(scores)
    shifted_scores = [score - min_score + 1 for score in scores]  # shift by (min_score - 1)
    # Log transform the shifted scores
    log_transformed = np.log(shifted_scores)    
    # Rescale to the range [min_target, 100], where min_target is above 0
    min_target = 10
    max_log = np.max(log_transformed)
    min_log = np.min(log_transformed)
    # Scale between [min_target, 100]
    results = [(min_target + (score - min_log) / (max_log - min_log) * (100 - min_target)) for score in log_transformed]
    return results

def get_combine_score(scores) -> float:
    """
    Combine scores with harmonic mean
    """
    return len(scores) / np.sum([1.0 / score for score in scores])

def get_combined_scores(match_results: list[dict], join_type='outer') -> dict:    

    # Remove empty results
    match_results_nonnull_index = []
    for i, result in enumerate(match_results):
        if result and len(result["urls"]) != 0:
            match_results_nonnull_index.append(i)

    # If new_match_results only contains 1, return it
    if len(match_results_nonnull_index) == 1:
        index = match_results_nonnull_index[0]
        return match_results[index]

    # Get max and min scores of each category
    # print()
    # for i in match_results_nonnull_index:
    #     print(f"Category {i + 1}:")
    #     print(f"Max score: {np.max(match_results[i]['scores'])}")
    #     print(f"Min score: {np.min(match_results[i]['scores'])}")

    # Create a dataframe for each category (i dont know how many categories there are)
    dataframes = []
    for i in match_results_nonnull_index:
        dataframes.append(pd.DataFrame({'urls': match_results[i]["urls"], 'scores': match_results[i]["scores"]}))
        dataframes[-1]['scores'] = get_standardized_scores(dataframes[-1]['scores'])
        print(f"Category {i}:")
        print(f"Raw scores: {match_results[i]['scores'][:5]} ... {match_results[i]['scores'][-5:]}")
        print(f"Standardized scores: {dataframes[-1]['scores'][:5].tolist()} ... {dataframes[-1]['scores'][-5:].tolist()}")
    
    # Merge the dataframes
    merged_df = dataframes[0]
    merged_df.rename(columns={'scores': 'scores_0'}, inplace=True)
    for i, df in enumerate(dataframes[1:]):
        merged_df = pd.merge(merged_df, df, on='urls', how=join_type)
        merged_df.rename(columns={'scores': f'scores_{i + 1}'}, inplace=True)
        merged_df.fillna(20.0, inplace=True)

    # Combine scores with harmonic mean (apply a harmonic_mean function on all columns)
    merged_df['combined_scores'] = merged_df.iloc[:, 1:].apply(lambda row: get_combine_score(row), axis=1) 

    # Sort by combined scores
    merged_df.sort_values(by='combined_scores', ascending=False, inplace=True)

    return {
        "urls": merged_df['urls'].tolist(),
        "scores": merged_df["combined_scores"].tolist(),
    }

def get_combined_scores_datetime(match_results: list[dict], datetime_results = []) -> dict:    

    # Remove empty results
    match_results_nonnull_index = []
    for i, result in enumerate(match_results):
        if result and len(result["urls"]) != 0:
            match_results_nonnull_index.append(i)

    # Get max and min scores of each category
    # print()
    # for i in match_results_nonnull_index:
    #     print(f"Category {i + 1}:")
    #     print(f"Max score: {np.max(match_results[i]['scores'])}")
    #     print(f"Min score: {np.min(match_results[i]['scores'])}")

    # Create a dataframe for each category (i dont know how many categories there are)
    dataframes = []
    for i in match_results_nonnull_index:
        dataframes.append(pd.DataFrame({'urls': match_results[i]["urls"], 'scores': match_results[i]["scores"]}))
        dataframes[-1]['scores'] = get_standardized_scores(dataframes[-1]['scores'])
    
    # Merge the dataframes
    merged_df = dataframes[0]
    merged_df.rename(columns={'scores': 'scores_0'}, inplace=True)
    for i, df in enumerate(dataframes[1:]):
        merged_df = pd.merge(merged_df, df, on='urls', how='outer')
        merged_df.rename(columns={'scores': f'scores_{i + 1}'}, inplace=True)
        merged_df.fillna(20.0, inplace=True)

    # Merge with datetime, only keep rows in merged_df that occur in datetime_results
    if len(datetime_results) > 0:
        datetime_df = pd.DataFrame({'urls': datetime_results["urls"], 'scores_dt': datetime_results["scores"]})
        print("df: ", len(merged_df), len(datetime_df))
        merged_df = pd.merge(merged_df, datetime_df, on='urls', how='inner')

    # Combine scores with harmonic mean (apply a harmonic_mean function on all columns)
    merged_df['combined_scores'] = merged_df.iloc[:, 1:].apply(lambda row: get_combine_score(row), axis=1)  

    # Sort by combined scores
    merged_df.sort_values(by='combined_scores', ascending=False, inplace=True)

    return {
        "urls": merged_df['urls'].tolist(),
        "scores": merged_df["combined_scores"].tolist(),
    }