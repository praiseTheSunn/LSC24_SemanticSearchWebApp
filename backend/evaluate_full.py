from evaluate_helper import load_tests, load_tests_ntcir, load_tests_lsc23, search_in_remote
# import models
import settings
from evaluate_helper import calculate_r_at_n
import pandas as pd

# from helper import embedding_helper
import time

import os

# tests = load_tests(settings.test_file_lsc22)
# tests = load_tests_ntcir(settings.test_file_ntcir, settings.ntcir_file_answer_path)
# tests = load_tests_lsc23(settings.test_file_lsc23)

version_name = "milvus_ver4_test_smt"

# if (os.path.exists(f"/{version_name}") == False):
#     os.makedirs(f"/{version_name}")

if (os.path.exists(f"{version_name}/results") == False):
    os.makedirs(f"{version_name}/results")

if (os.path.exists(f"{version_name}/csv") == False):
    os.makedirs(f"{version_name}/csv")

timeCur = time.time()
tests = {
    # 'lsc22': load_tests(settings.test_file_lsc22),
    'lsc23': load_tests_lsc23(settings.test_file_lsc23),
    # 'ntcir': load_tests_ntcir(settings.test_file_ntcir, settings.ntcir_file_answer_path),
    # 'lsc22_Thanh': load_tests(settings.test_file_lsc22_Thanh),
}

model_names = ["beit3", "blip2", "clip", "stfm"]
modes = [
    # "smt-mm-dtin", 
    # "smt-3m-dtin", 
    "smt"]

for test_dataset_name, tests in tests.items():
    print(f"evaluate: Evaluating {test_dataset_name} dataset\n")
    for mode in modes:
        print(f"evaluate: Evaluating {mode} mode\n")
        for model_name in model_names:
            # check if result for this model and mode already exists
            if (os.path.exists(f'{version_name}/csv/{test_dataset_name}_{model_name}_{mode}_result.csv')):
                print(f"evaluate: {model_name} model {mode} mode already exists. Skipping...\n")
                continue
            print(f"evaluate: Evaluating {model_name} model\n")
            # Create an empty dataframe
            df_recall = pd.DataFrame(columns=['R@1', 'R@5', 'R@10', 'R@20', 'R@50', 'R@100'])
            df_text = pd.DataFrame(columns=['query text'])
            for test_name, test_value in tests.items():
                # print("test name: ", test_name)
                query_texts = test_value["query_text"]
                expected_result = test_value["expected_result"]

                for i, query_text in enumerate(query_texts):

                    # image_paths = model.search_text_query(query_text)
                    # start_time = time.time()
                    # image_files = embedding_helper.search_by_text_query(setup.keyframe_paths, 'image', query_text, str(test_name + '_' + str(i)), False)
                    image_urls = search_in_remote(query_text, model_name, mode)
                    # print(f"evaluate: Done searching for text query in {time.time() - start_time} seconds.\n")
                    # print(f"evaluate: Query: {query_text}")
                    # print(f"evaluate: Result: {image_urls[:10]}")
                    # print(f"evaluate: Expected: {expected_result[:10]}")

                    if (os.path.exists(f"{version_name}/results/{model_name}") == False):
                        os.makedirs(f"{version_name}/results/{model_name}")
                    result_file = f"{version_name}/results/{model_name}/{test_name}_{mode}_H{i}.txt"
                    with open(result_file, "w") as f:
                        f.write(f"Query: {query_text}\n")
                        f.write(f"Result: {image_urls}\n")

                    recall_values = []
                    for j, n in enumerate([1, 5, 10, 20, 50, 100]):
                        r_at_n = calculate_r_at_n(image_urls, expected_result, n)
                        recall_values.append(r_at_n)

                        # df.loc[f"{test_name} H{i}", f"R@{n}"] = r_at_n
                        # print(f"R@{n}: {r_at_n}")

                    df_recall.loc[f"{test_name} H{i}"] = recall_values
                    df_text.loc[f"{test_name} H{i}"] = query_text

            df_recall.loc['Average'] = df_recall.mean()
            df_text.loc['Average'] = "Average"
            result = pd.concat([df_text, df_recall], axis=1)
            # df.loc['Average'] = df.mean()
            result.to_csv(f'{version_name}/csv/{test_dataset_name}_{model_name}_{mode}_result.csv')
            
            timePassed = time.time() - timeCur
            timeCur = time.time()
            print(f"evaluate: Done evaluating {model_name} in {timePassed} seconds.\n")
        
        timePassed = time.time() - timeCur
        timeCur = time.time()
        print(f"evaluate: Done evaluating {mode} in {timePassed} seconds.\n")
    
    # Create a Pandas Excel writer using XlsxWriter as the engine
    with pd.ExcelWriter(f'{version_name}/{test_dataset_name}.xlsx', engine='xlsxwriter') as writer:
        # Write each dataframe to a separate worksheet
        for mode in modes:
            for model_name in model_names:
                df = pd.read_csv(f'{version_name}/csv/{test_dataset_name}_{model_name}_{mode}_result.csv')
                df.to_excel(writer, sheet_name=f'{model_name}_{mode}', index=False)
        # df.to_excel(writer, sheet_name='Sheet1', index=False)
        # result.to_excel(writer, sheet_name='Sheet2', index=False)
                # model.delete()



# for test_name, test_value in tests.items():
#     print("test name: ", test_name)
#     query_texts = test_value["query_text"]
#     expected_result = test_value["expected_result"]

#     for i, query_text in enumerate(query_texts):

#         # image_paths = model.search_text_query(query_text)
#         start_time = time.time()
#         image_files = embedding_helper.search_by_text_query(setup.keyframe_paths, 'image', query_text, str(test_name + '_' + str(i)), False)
#         image_urls = search_in_remote(query_text, model_name, mode)
#         print(f"evaluate: Done searching for text query in {time.time() - start_time} seconds.\n")
#         print(f"evaluate: Query: {query_text}")
#         print(f"evaluate: Result: {image_files[:10]}")
#         print(f"evaluate: Expected: {expected_result[:10]}")

#         # result_file = f"results/{model_name}/{test_name}_{i}_results.txt"
#         # with open(result_file, "w") as f:
#         #     f.write(f"Query: {query_text}\n")
#         #     f.write(f"Result: {image_files}\n")

#         for j, n in enumerate([1, 5, 10, 20, 50, 100]):
#             r_at_n = calculate_r_at_n(image_files, expected_result, n)
#             print(f"R@{n}: {r_at_n}")

#             # row_name = f"{test_name} Q{i}"
#             # # df[row_name][model_names[model]][n] = r_at_n
#             # df.loc[row_name, 'BLIP2', (i - 1) * 3 + j] = r_at_n

#             row_name = f"{test_name} Q{i}"
#             # df[row_name][model_names[model]][n] = r_at_n
#             column_name = f"R@{n}"  # Define column name for clarity
#             df.loc[row_name, column_name] = r_at_n  # Corrected line

                
#     # model.delete()

# Calculate the average of all the numbers in each column

# df.to_csv(f'{test_dataset_name}_{model_name}_nofilter_result.csv', index=False)

# df.loc['Average'] = df.mean()
# df.to_csv(f'{test_dataset_name}_{model_name}_nofilter_result_mean2.csv', index=False)


        