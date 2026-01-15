import pandas as pd

df = pd.read_csv("metadata/metadata_v5.csv")
df.set_index("image_id", inplace=True)


# count = 0
# for i, row in df.iterrows():
#     count += 1
#     index = row.name
#     df.at[index, "id"] = count
#     if count % 1000 == 0:
#         print(f"Processed {count} rows")

# df.to_csv("metadata/metadata_v5.csv", index=True)

a = df['id'].to_list()
print(max(a))