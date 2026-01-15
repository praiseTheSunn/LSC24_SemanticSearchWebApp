import pandas as pd
import json

rows = []
with open("./V3C_metadata.json", "r") as f:
    data = json.load(f)
    keys = sorted(data.keys(), key=lambda x: (int(x.split('/')[0]), int(x.split('/')[1].split('_')[1])))
    for i, key in enumerate(keys, 1):
        rows.append({
            "id": i,
            "image_id": key[:-4],
            "video_id": key.split('/')[0],
            "start_time": data[key]["start_time"],
            "end_time": data[key]["end_time"],
        })
        if i % 1000 == 0:
            print(f"{i} / {len(keys)}: {key}")

df = pd.DataFrame(rows)
df.to_csv("./metadata_v1.csv", index=False)