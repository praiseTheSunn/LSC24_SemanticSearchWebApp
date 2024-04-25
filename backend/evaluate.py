from evaluate_helper import load_tests, load_tests_ntcir, load_tests_lsc23, search_in_remote
# import models
import settings
from evaluate_helper import calculate_r_at_n
import pandas as pd

from helper import embedding_helper
import time

# clip_model = models.clip.ClipModel()
# blip_model = models.blip.BlipModel()
# beit3_model = models.beit3.Beit3Model()

# models = [clip_model, blip_model, beit3_model]

# tests = load_tests(settings.test_file_lsc22)
# tests = load_tests_ntcir(settings.test_file_ntcir, settings.ntcir_file_answer_path)
tests = load_tests_lsc23(settings.test_file_lsc23)


# Create an empty dataframe
df = pd.DataFrame()

test_dataset_name = "lsc23"
model_name = "beit3"
mode = "no-filter"

# for i, model in enumerate(models):
#     model.load()

# print("setting up!")
# from helper import setup
# print("setup done!")

for test_name, test_value in tests.items():
    print("test name: ", test_name)
    query_texts = test_value["query_text"]
    expected_result = test_value["expected_result"]

    for i, query_text in enumerate(query_texts):

        # image_paths = model.search_text_query(query_text)
        start_time = time.time()
        image_files = embedding_helper.search_by_text_query(setup.keyframe_paths, 'image', query_text, str(test_name + '_' + str(i)), False)
        image_urls = search_in_remote(query_text, model_name, mode)
        print(f"evaluate: Done searching for text query in {time.time() - start_time} seconds.\n")
        print(f"evaluate: Query: {query_text}")
        print(f"evaluate: Result: {image_files[:10]}")
        print(f"evaluate: Expected: {expected_result[:10]}")

        # result_file = f"results/{model_name}/{test_name}_{i}_results.txt"
        # with open(result_file, "w") as f:
        #     f.write(f"Query: {query_text}\n")
        #     f.write(f"Result: {image_files}\n")

        for j, n in enumerate([1, 5, 10, 20, 50, 100]):
            r_at_n = calculate_r_at_n(image_files, expected_result, n)
            print(f"R@{n}: {r_at_n}")

            # row_name = f"{test_name} Q{i}"
            # # df[row_name][model_names[model]][n] = r_at_n
            # df.loc[row_name, 'BLIP2', (i - 1) * 3 + j] = r_at_n

            row_name = f"{test_name} Q{i}"
            # df[row_name][model_names[model]][n] = r_at_n
            column_name = f"R@{n}"  # Define column name for clarity
            df.loc[row_name, column_name] = r_at_n  # Corrected line

                
    # model.delete()

# Calculate the average of all the numbers in each column

# df.to_csv(f'{test_dataset_name}_{model_name}_nofilter_result.csv', index=False)

df.loc['Average'] = df.mean()
df.to_csv(f'{test_dataset_name}_{model_name}_nofilter_result_mean2.csv', index=False)


        