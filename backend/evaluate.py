from evaluate_helper import load_tests
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

tests = load_tests('lsc22-topics-qrels-shared.txt')


# Create an empty dataframe
df = pd.DataFrame()


# for i, model in enumerate(models):
#     model.load()

print("setting up!")
from helper import setup
print("setup done!")

for test_name, test_value in tests.items():
    print("test name: ", test_name)
    query_texts = test_value["query_text"]
    expected_result = test_value["expected_result"]

    for i, query_text in enumerate(query_texts):

        # image_paths = model.search_text_query(query_text)
        start_time = time.time()
        image_files = embedding_helper.search_by_text_query(setup.keyframe_paths, 'image', query_text, str(test_name + '_' + str(i)), False)
        print(f"Done searching for text query in {time.time() - start_time} seconds.\n")

        for j, n in enumerate([1, 5, 10, 20, 50]):
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

df.to_csv('output.csv', index=False)


        