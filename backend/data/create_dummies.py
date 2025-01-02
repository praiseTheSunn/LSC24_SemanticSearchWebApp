import pandas as pd

df1 = pd.DataFrame(columns=['id', 'name', 'timestamp', 'path', 'context_id', 'video_id'])
# df1.to_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/metadata/vbs25/keyframes.csv", index=False)

df2 = pd.DataFrame(columns=['id', 'name', 'video_id'])
# df2.to_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/metadata/vbs25/contexts.csv", index=False)

df3 = pd.DataFrame(columns=['id', 'name', 'fps', 'dataset'])
# df3.to_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/metadata/vbs25/videos.csv", index=False)

# add dummy data
# for videos: id starts from 0, name is either a 5-digit number (starting from 00001), fps is float, dataset is 'v3c'
# for contexts: id starts from 0, name is video name + "/" + a 4-digit number (starting from 0001)
# for keyframes: id starts from 0, name is context name + "/" + a 8-digit number (starting from 00000001), timestamp is a 8-digit number (starting from 1), path is a string, context_id is an integer, video_id is an integer

import random

videos = []
contexts = []
keyframes = []

video_names = []
context_names = []
keyframe_names = []

for i in range(10):
    video_names.append(f"{i:05d}")
    videos.append({'id': i, 'name': video_names[i], 'fps': random.uniform(1, 30), 'dataset': 'v3c'})

# print(videos)


for i in range(100):
    context_names.append(f"{video_names[random.randint(0, 10-1)]}/{random.randint(0, 10-1):04d}")
    contexts.append({'id': i, 'name': context_names[i], 'video_id': int(context_names[i][:5])})

# print(contexts)


for i in range(1000):
    keyframe_names.append(f"{context_names[random.randint(0, 100-1)]}/{random.randint(0, 100000000-1):08d}")
    keyframes.append({'id': i, 'name': keyframe_names[i], 'timestamp': int(keyframe_names[i][-8:]), 'path': f"dummy_path/{i:08d}.jpg", 'context_id': int(keyframe_names[i][6:10]), 'video_id': int(keyframe_names[i][:5])})

# print(keyframes)


videos = pd.DataFrame(videos)
contexts = pd.DataFrame(contexts)
keyframes = pd.DataFrame(keyframes)


videos.to_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/metadata/vbs25/videos.csv", index=False)
contexts.to_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/metadata/vbs25/contexts.csv", index=False)
keyframes.to_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/metadata/vbs25/keyframes.csv", index=False)
