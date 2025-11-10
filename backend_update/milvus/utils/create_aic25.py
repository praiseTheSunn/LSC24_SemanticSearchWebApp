from pymilvus import (
    MilvusClient, 
    DataType,
    Function,
    FunctionType
)
from pprint import pprint
import pandas as pd
import numpy as np
import os
import sys

sys.path.append("..")
from dataset.dataset_manager import DatasetManager


def get_milvus_schema(csv_path, column_mapping, filters):    
    """
    Build Milvus schema dynamically based on:
      - column_mapping (CSV → Milvus field names)
      - filters config (per-field options like lowercase / sparse indexing)

    The if–else structure ensures:
      1. Primary key field is handled first.
      2. Special filter-driven fields (text, sparse) are handled consistently.
      3. Fallback to numeric/bool/text types based on pandas dtype.
      4. Dense embedding field is always added at the end.
    """
    schema = MilvusClient.create_schema(auto_id=False, enable_dynamic_field=True)
    df = pd.read_csv(csv_path, nrows=10)  # sample to infer dtypes

    for col in column_mapping.keys():
        dtype = df[col].dtype
        mapped_col = column_mapping.get(col, col)

        # -------- 1. Primary key (always INT64) --------
        if mapped_col == "record_id":
            schema.add_field(field_name="record_id", datatype=DataType.INT64, is_primary=True)

        # -------- 2. Fields with custom filter settings --------
        elif mapped_col in filters:
            fcfg = filters[mapped_col]

            # 2a. Sparse vector field (e.g. OCR with BM25)
            #     Adds both: 
            #       - sparse vector for retrieval
            #       - raw text for inspection/debug
            if fcfg.get("sparse_vector", False):
                schema.add_field(
                    field_name=mapped_col, 
                    datatype=DataType.VARCHAR, 
                    max_length=32768,
                    enable_analyzer=True
                )
                schema.add_field(
                    field_name=f"{mapped_col}_sparse",
                    datatype=DataType.SPARSE_FLOAT_VECTOR
                )

            # 2b. Text where we want original case stored,
            #     but lowercase version also indexed for search
            elif not fcfg["lowercase_storing"] and fcfg["lowercase_indexing"]:
                schema.add_field(field_name=mapped_col, datatype=DataType.VARCHAR, max_length=32768)
                schema.add_field(field_name=f"{mapped_col}_indexing", datatype=DataType.VARCHAR, max_length=32768)

            # 2c. Standard text field (no special indexing rules)
            else:
                schema.add_field(field_name=mapped_col, datatype=DataType.VARCHAR, max_length=32768)
                
        # -------- 3. Non-filtered columns: dtype decides --------
        elif pd.api.types.is_integer_dtype(dtype):
            schema.add_field(field_name=mapped_col, datatype=DataType.INT64)

        elif pd.api.types.is_float_dtype(dtype):
            schema.add_field(field_name=mapped_col, datatype=DataType.FLOAT)

        elif pd.api.types.is_bool_dtype(dtype):
            schema.add_field(field_name=mapped_col, datatype=DataType.BOOL)

        # 3d. Fallback: treat as VARCHAR (short text)
        else:
            schema.add_field(field_name=mapped_col, datatype=DataType.VARCHAR, max_length=100)

    # -------- 4. Dense embedding field (always present) --------
    schema.add_field(field_name="embedding", datatype=DataType.FLOAT_VECTOR, dim=768)

    return schema


def get_index_params(filters):
    """
    Define index params for all vector fields.
    - Dense: HNSW on "embedding"
    - Sparse: SPARSE_INVERTED_INDEX on any *_sparse field
    """
    index_params = MilvusClient.prepare_index_params()

    # Dense vector ANN index
    index_params.add_index(
        field_name="embedding",
        index_name="embedding_index",
        index_type="HNSW",
        metric_type="IP",
        M=16,
        efConstruction=100,
    )

    # BM25 sparse vector indexes
    for col, fcfg in filters.items():
        if fcfg.get("sparse_vector", False) and fcfg.get("sparse_index", "").upper() == "BM25":
            index_params.add_index(
                field_name=f"{col}_sparse",
                index_type="SPARSE_INVERTED_INDEX",
                metric_type="BM25",
            )

    return index_params


def print_data_record(data_record):
    """Pretty-print record (summarize embedding size)."""
    for key, value in data_record.items():
        if key == "embedding":
            print(f"{key}: {len(value)}-dimensional vector")
        else:
            print(f"{key}: {value}")


def create_collection(client, collection_name, metadata_file_path, column_mapping, filters, force=True):
    """
    Drop + create collection using schema + index params.
    The schema depends on both CSV dtypes and YAML filters.
    """
    schema = get_milvus_schema(metadata_file_path, column_mapping, filters)

    if force and client.has_collection(collection_name):
        print(f"Dropping existing collection '{collection_name}'...")
        client.drop_collection(collection_name)

    if force or not client.has_collection(collection_name):
        print(f"Creating collection '{collection_name}'...")

        # Add BM25 functions for any sparse_vector fields and then add functions to schema
        functions = []
        for col, fcfg in filters.items():
            if fcfg.get("sparse_vector", False) and fcfg.get("sparse_index", "").upper() == "BM25":
                bm25_func = Function(
                    name=f"{col}_bm25_func",
                    function_type=FunctionType.BM25,
                    input_field_names=[col],             # text field
                    output_field_names=[f"{col}_sparse"]    # Milvus will create sparse field
                )
                functions.append(bm25_func)

        # Add functions to schema, this work as a bridge between the raw text field and the sparse vector field
        for func in functions:
            schema.add_function(func)

        # Index params
        index_params = get_index_params(filters)

        client.create_collection(
            collection_name=collection_name,
            schema=schema,
            index_params=index_params,
            functions=functions
        )
    else:
        print(f"Collection '{collection_name}' already exists.")

    description = client.describe_collection(collection_name)
    pprint(description)

    collections = client.list_collections()
    print(f"Collections: {collections}")


if __name__ == "__main__":
    # DATASET_NAME = "aic25_lesson"
    # ALLOWED_PREFIXES = ["L25"]
    # DATASET_NAME = "aic25_cooking"
    # ALLOWED_PREFIXES = ["L26"]
    DATASET_NAME = "aic25"
    ALLOWED_PREFIXES = [
        "K01", "K02", "K03", "K04", "K05", "K06", "K07", "K08", "K09", "K10",
        "K11", "K12", "K13", "K14", "K15", "K16", "K17", "K18", "K19", "K20",
        "L21", "L22", "L23", "L24", "L25", "L26", "L27", "L28", "L29", "L30"
    ]
    MODEL = "clips"
    FORCE = True  # WARNING: drops collection if exists

    print(f"Dataset: {DATASET_NAME}")
    print(f"Allowed prefixes: {ALLOWED_PREFIXES}")
    print(f"Model: {MODEL}")
    print(f"Force: {FORCE}")
    input("Press Enter to continue...")

    collection_name = f"{DATASET_NAME}_{MODEL}"
    image_dataset = DatasetManager.get_dataset(DATASET_NAME)
    metadata_file_path = image_dataset.get_metadata_file_path()
    embedding_dir = image_dataset.get_embedding_dir()
    column_mapping = image_dataset.get_column_mapping()
    filters = image_dataset.get_filters()

    client = MilvusClient(host="localhost", port="19530")    
    create_collection(client, collection_name, metadata_file_path, column_mapping, filters, force=FORCE)


    # INSERT DATA
    df = image_dataset.df
    all_video_ids = df["video_id"].unique().tolist()

    for video_id in all_video_ids:

        # Keep only video_ids within a range
        allowed = False
        if ALLOWED_PREFIXES == []:
            allowed = True
        else:
            for prefix in ALLOWED_PREFIXES:
                if video_id.startswith(prefix):
                    allowed = True
                    break
        if not allowed:
            continue

        # Get vectors directory and video-specific dataframe
        vectors_dir = f"{embedding_dir}/{video_id}"
        df_video = df[df["video_id"] == video_id]
        image_ids = sorted(df_video["image_id"].tolist())

        data = []
        for image_id in image_ids:
            image_id_int = int(image_id.split("/")[-1])
            vector_path = os.path.join(vectors_dir, f"{image_id_int}.npy")
            if not os.path.exists(vector_path):
                raise FileNotFoundError(f"Embedding not found: {vector_path}")

            vector = np.load(vector_path).squeeze()  # shape (768,)

            record_id = DatasetManager.get_dataset(DATASET_NAME).image_id_to_record_id[image_id]
            data_record = {
                "record_id": record_id,
                "image_id": image_id,
                "embedding": vector.tolist()
            }

            for mapped_col in column_mapping.values():
                if mapped_col in ["record_id", "image_id", "embedding"]:
                    continue
                elif mapped_col in filters:
                    value = df_video[mapped_col].loc[record_id]
                    if pd.isna(value):
                        value = ""
                    if filters[mapped_col].get("sparse_vector", False):
                        data_record[mapped_col] = value
                    elif filters[mapped_col]["lowercase_storing"]:
                        value = value.lower()
                        data_record[mapped_col] = value
                    elif not filters[mapped_col]["lowercase_storing"] and filters[mapped_col]["lowercase_indexing"]:
                        value_indexing = value.lower()
                        data_record[mapped_col] = value
                        data_record[f"{mapped_col}_indexing"] = value_indexing
                    else:
                        data_record[mapped_col] = value
                else:
                    data_record[mapped_col] = df[mapped_col].loc[record_id]

            data.append(data_record)

            # Print only the last data record for each prefix
            print_data_record(data_record)
            print()

        client.insert(collection_name=collection_name, data=data)
        print(f"Inserted {len(data)} vectors of {video_id} into collection {collection_name}")
        print(client.get_collection_stats(collection_name))
        print()


