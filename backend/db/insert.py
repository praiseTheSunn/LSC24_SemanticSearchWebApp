import math
import os
import pandas as pd
import sqlite3
from typing import Any, Dict


def insert_metadata(db_name: str, table_name: str, metadata: Dict[str, Any]):
    """Inserts metadata into the specified table."""
    connection = sqlite3.connect(db_name)
    cursor = connection.cursor()

    columns = ', '.join(metadata.keys())
    placeholders = ', '.join(f":{key}" for key in metadata.keys())
    cursor.execute(f'''
        INSERT INTO {table_name} ({columns})
        VALUES ({placeholders})
    ''', metadata)

    connection.commit()
    row_id = cursor.lastrowid
    connection.close()
    return row_id


def insert_videos():
    # Read keyframe to time mapping
    # df = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/V3C_keyframe_to_time_mapping.csv", index_col=0)
    # df = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/MVK_keyframe_to_time_mapping.csv")
    # df2 = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/MVK2_keyframe_to_time_mapping.csv")
    # df = pd.concat([df, df2])
    df = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/LHE_keyframe_to_time_mapping.csv")

    # Prepare metadata
    # db_name = "V3C.db"
    # db_name = "MVK.db"
    db_name = "LHE.db"
    table_name = "videos"
    video_names = df["video_id"].unique()
    # all_metadata = [{"name": f"V3C/{int(name):05d}", "dataset": "V3C"} for name in video_names]
    # all_metadata = [{"name": f"MVK/{name}", "dataset": "MVK"} for name in video_names]
    all_metadata = [{"name": f"LHE/{name}", "dataset": "LHE"} for name in video_names]

    # Prepare id_mapping
    # ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/v3c/videos.csv"
    # ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/mvk/videos.csv"
    ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/lhe/videos.csv"
    if not os.path.exists(ID_MAPPING):
        id_mapping = pd.DataFrame(columns=["video_name", "video_id"])
        id_mapping.to_csv(ID_MAPPING, index=False)
        print(f"Created {ID_MAPPING}")
    id_mapping = pd.read_csv(ID_MAPPING)
    id_mapping.set_index("video_name", inplace=True)


    # Insert metadata into DB and update id_mapping
    id_mapping_updates = []
    for metadata in all_metadata:
        video_id = insert_metadata(db_name, table_name, metadata)
        id_mapping_updates.append({"video_name": metadata["name"], "video_id": video_id})
        print(f"Inserted metadata: {metadata['name']}, {video_id} to both DB and id_mapping")

    # Append new data to id_mapping
    updates_df = pd.DataFrame(id_mapping_updates)
    updates_df.set_index("video_name", inplace=True)
    id_mapping = pd.concat([id_mapping, updates_df])
    id_mapping.to_csv(ID_MAPPING, index=True)


def insert_contexts():
    # df = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/V3C_keyframe_to_time_mapping.csv", index_col=0)
    # df = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/MVK_keyframe_to_time_mapping.csv")
    # df2 = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/MVK2_keyframe_to_time_mapping.csv")
    # df = pd.concat([df, df2])
    df = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/LHE_keyframe_to_time_mapping.csv")

    # Prepare video_name to video_id mapping
    # VIDEO_ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/v3c/videos.csv"
    # VIDEO_ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/mvk/videos.csv"
    VIDEO_ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/lhe/videos.csv"
    video_id_mapping = pd.read_csv(VIDEO_ID_MAPPING, index_col=0)

    # Prepare metadata
    # db_name = "V3C.db"
    # db_name = "MVK.db"
    db_name = "LHE.db"
    table_name = "contexts"

    # Group the DataFrame by video_id
    grouped = df.groupby("video_id")
    all_metadata = []
    for video_name, group in grouped:
        num_contexts = math.ceil(len(group) / 16)
        for context_order in range(1, num_contexts + 1):
            # context_name = f"V3C/{int(video_name):05d}/{context_order:05d}"
            # context_name = f"MVK/{video_name}/{context_order:05d}"
            context_name = f"LHE/{video_name}/{context_order:05d}"
            # video_id = video_id_mapping.loc[f"V3C/{int(video_name):05d}"]["video_id"]
            # video_id = video_id_mapping.loc[f"MVK/{video_name}"]["video_id"]
            video_id = video_id_mapping.loc[f"LHE/{video_name}"]["video_id"]
            all_metadata.append({"name": context_name, "video_id": video_id})    

    # Prepare id_mapping
    # ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/v3c/contexts.csv"
    # ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/mvk/contexts.csv"
    ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/lhe/contexts.csv"
    if not os.path.exists(ID_MAPPING):
        id_mapping = pd.DataFrame(columns=["context_name", "context_id"])
        id_mapping.to_csv(ID_MAPPING, index=False)
        print(f"Created {ID_MAPPING}")
    id_mapping = pd.read_csv(ID_MAPPING)
    id_mapping.set_index("context_name", inplace=True)


    # Insert metadata into DB and update id_mapping
    id_mapping_updates = []
    N = len(all_metadata)
    for i, metadata in enumerate(all_metadata):
        context_id = insert_metadata(db_name, table_name, metadata)
        id_mapping_updates.append({"context_name": metadata["name"], "context_id": context_id})
        print(f"Inserted metadata: {metadata}, {context_id} to both DB and id_mapping")

        # Append new data to id_mapping        
        if (i + 1) % 1000 == 0 or (i + 1) == N:
            updates_df = pd.DataFrame(id_mapping_updates)
            updates_df.set_index("context_name", inplace=True)
            id_mapping = pd.concat([id_mapping, updates_df])
            id_mapping.to_csv(ID_MAPPING, index=True)
            id_mapping_updates = []


def insert_keyframes():
    # Read keyframe to time mapping
    # df = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/V3C_keyframe_to_time_mapping.csv", index_col=0)
    # df = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/MVK_keyframe_to_time_mapping.csv")
    # df2 = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/MVK2_keyframe_to_time_mapping.csv")
    # df = pd.concat([df, df2])
    df = pd.read_csv("/home/pc/LSC24_SemanticSearchWebApp/backend/data/mappings/LHE_keyframe_to_time_mapping_transformed.csv")
    df.reset_index(drop=True, inplace=True)

    # Prepare video_name to video_id mapping and context_name to context_id mapping
    # CONTEXT_ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/v3c/contexts.csv"
    # CONTEXT_ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/mvk/contexts.csv"
    CONTEXT_ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/lhe/contexts.csv"
    context_id_mapping = pd.read_csv(CONTEXT_ID_MAPPING, index_col=0)
    # VIDEO_ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/v3c/videos.csv"
    # VIDEO_ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/mvk/videos.csv"
    VIDEO_ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/lhe/videos.csv"
    video_id_mapping = pd.read_csv(VIDEO_ID_MAPPING, index_col=0)

    # Prepare metadata
    # db_name = "V3C.db"
    # db_name = "MVK.db"
    db_name = "LHE.db"
    table_name = "keyframes"

    # Group the DataFrame by video_id
    def process_metadata(df, context_id_mapping, video_id_mapping):
        """Processes metadata from the DataFrame into a list of dictionaries efficiently."""
        # Calculate derived columns
        # df['context_order'] = 1 + (df['frame'] - 1) // 16
        # df['video_name'] = df['video_id'].apply(lambda x: f"V3C/{int(x):05d}")
        # df['context_name'] = df.apply(lambda row: f"{row['video_name']}/{row['context_order']:05d}", axis=1)
        # df['keyframe_name'] = df.apply(lambda row: f"{row['context_name']}/{row['frame']:05d}", axis=1)
        # df['timestamp'] = ((df['start_time'] + df['end_time']) / 2 * 1000).astype(int)
        # df['context_id_mapped'] = df['context_name'].map(context_id_mapping['context_id']).astype(int)
        # df['video_id_mapped'] = df['video_name'].map(video_id_mapping['video_id']).astype(int)

        # df['context_order'] = 1 + (df['keyframe_id'] - 1) // 16
        # df['video_name'] = df['video_id'].apply(lambda x: f"MVK/{x}")
        # df['context_name'] = df.apply(lambda row: f"{row['video_name']}/{row['context_order']:05d}", axis=1)
        # df['keyframe_name'] = df.apply(lambda row: f"{row['context_name']}/{row['keyframe_id']:05d}", axis=1)
        # df['timestamp'] = (df['timeframe'] * 1000).astype(int)
        # df['context_id_mapped'] = df['context_name'].map(context_id_mapping['context_id']).astype(int)
        # df['video_id_mapped'] = df['video_name'].map(video_id_mapping['video_id']).astype(int)

        df['context_order'] = 1 + (df['frame'] - 1) // 16
        df['video_name'] = df['video_id'].apply(lambda x: f"LHE/{x}")
        df['context_name'] = df.apply(lambda row: f"{row['video_name']}/{row['context_order']:05d}", axis=1)
        df['keyframe_name'] = df.apply(lambda row: f"{row['context_name']}/{row['frame']:05d}", axis=1)
        df['timestamp'] = (df['timeframe'] * 1000).astype(int)
        # df['path'] = ...
        df['context_id_mapped'] = df['context_name'].map(context_id_mapping['context_id']).astype(int)
        df['video_id_mapped'] = df['video_name'].map(video_id_mapping['video_id']).astype(int)


        # Select only required columns for final metadata
        all_metadata_df = df[['keyframe_name', 'timestamp', 'context_id_mapped', 'video_id_mapped']].rename(
            columns={
                'keyframe_name': 'name', 
                'context_id_mapped': 'context_id',
                'video_id_mapped': 'video_id'   
            }
        )

        # Convert to a list of dictionaries
        all_metadata = all_metadata_df.to_dict(orient='records')
        return all_metadata

    all_metadata = process_metadata(df, context_id_mapping, video_id_mapping)

    # Prepare id_mapping
    # ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/v3c/keyframes.csv"
    # ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/mvk/keyframes.csv"
    ID_MAPPING = "/home/pc/LSC24_SemanticSearchWebApp/backend/data/id_mapping/lhe/keyframes.csv"
    if not os.path.exists(ID_MAPPING):
        id_mapping = pd.DataFrame(columns=["keyframe_name", "keyframe_id"])
        id_mapping.to_csv(ID_MAPPING, index=False)
        print(f"Created {ID_MAPPING}")
    id_mapping = pd.read_csv(ID_MAPPING)
    id_mapping.set_index("keyframe_name", inplace=True)

    # Insert metadata into DB and update id_mapping
    id_mapping_updates = []
    N = len(all_metadata)
    for i, metadata in enumerate(all_metadata):
        keyframe_id = insert_metadata(db_name, table_name, metadata)
        id_mapping_updates.append({"keyframe_name": metadata["name"], "keyframe_id": keyframe_id})
        print(f"Inserted metadata: {metadata}, {keyframe_id} to both DB and id_mapping")

        # Append new data to id_mapping
        if (i + 1) % 1000 == 0 or (i + 1) == N:
            updates_df = pd.DataFrame(id_mapping_updates)
            updates_df.set_index("keyframe_name", inplace=True)
            id_mapping = pd.concat([id_mapping, updates_df])
            id_mapping.to_csv(ID_MAPPING, index=True)
            id_mapping_updates = []

 
if __name__ == "__main__":
    # insert_videos()
    # insert_contexts()
    insert_keyframes()

    