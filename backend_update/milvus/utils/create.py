from pymilvus import (
    MilvusClient, 
    DataType,
    Function,
    FunctionType,
)
from pprint import pprint
import pandas as pd
import numpy as np

import sys
sys.path.append("..")
from dataset.dataset_manager import DatasetManager


    
def get_milvus_schema(csv_path, column_mapping, full_text_fields):    
    schema = MilvusClient.create_schema(auto_id=False, enable_dynamic_field=True)
    df = pd.read_csv(csv_path, nrows=10)

    for col in column_mapping.keys():
        dtype = df[col].dtype
        mapped_col = column_mapping.get(col, col)
        if mapped_col == "record_id":
            schema.add_field(field_name="record_id", datatype=DataType.INT64, is_primary=True)
        elif mapped_col in full_text_fields:
            schema.add_field(field_name=f"text_{mapped_col}", datatype=DataType.VARCHAR, max_length=32768, enable_analyzer=True)
            schema.add_field(field_name=f"sparse_{mapped_col}", datatype=DataType.SPARSE_FLOAT_VECTOR)
        elif pd.api.types.is_integer_dtype(dtype):
            schema.add_field(field_name=mapped_col, datatype=DataType.INT64)
        elif pd.api.types.is_float_dtype(dtype):
            schema.add_field(field_name=mapped_col, datatype=DataType.FLOAT)
        elif pd.api.types.is_bool_dtype(dtype):
            schema.add_field(field_name=mapped_col, datatype=DataType.BOOL)
        else:
            schema.add_field(field_name=mapped_col, datatype=DataType.VARCHAR, max_length=100)

    schema.add_field(field_name="embedding", datatype=DataType.FLOAT_VECTOR, dim=768)
    
    for mapped_col in full_text_fields:
        bm25_function = Function(
            name=f"text_bm25_emb_{mapped_col}",
            input_field_names=[f"text_{mapped_col}"],
            output_field_names=[f"sparse_{mapped_col}"],
            function_type=FunctionType.BM25,
        )
        schema.add_function(bm25_function)

    return schema


def get_index_params(full_text_fields):
    index_params = MilvusClient.prepare_index_params()

    # Dense vector index for general embedding
    index_params.add_index(
        field_name="embedding",
        index_name="embedding_index",
        index_type="HNSW",     # Options: FLAT, IVF_FLAT, IVF_SQ8, IVF_PQ, HNSW, SCANN
        metric_type="IP",      # Options: COSINE, L2, IP
        M=16,
        efConstruction=100,
    )

    # Add BM25 sparse index for each full text field
    for field in full_text_fields:
        sparse_field_name = f"sparse_{field}"
        index_params.add_index(
            field_name=sparse_field_name,
            index_type="SPARSE_INVERTED_INDEX",
            metric_type="BM25"
        )

    return index_params


def print_data_record(data_record):
    for key, value in data_record.items():
        if key == "embedding":
            print(f"{key}: {len(value)}-dimensional vector")
        else:
            print(f"{key}: {value}")


def create_collection(client, collection_name, metadata_file_path, column_mapping, full_text_fields, force=True):
    schema = get_milvus_schema(metadata_file_path, column_mapping, full_text_fields)
    # Drop the collection if force is True and it exists
    if force and client.has_collection(collection_name):
        print(f"Dropping existing collection '{collection_name}'...")
        client.drop_collection(collection_name)

    # Create the collection if it doesn't exist (or was just dropped)
    if force or not client.has_collection(collection_name):
        print(f"Creating collection '{collection_name}'...")
        schema = get_milvus_schema(metadata_file_path, column_mapping, full_text_fields)
        index_params = get_index_params(full_text_fields)
        client.create_collection(collection_name=collection_name, schema=schema, index_params=index_params)
    else:
        print(f"Collection '{collection_name}' already exists.")

    # Print details
    description = client.describe_collection(collection_name)
    pprint(description)

    collections = client.list_collections()
    print(f"Collections: {collections}")


if __name__ == "__main__":
    DATASET_NAME = "lsc24"
    MODEL = "clips"
    FORCE = False                # DANGEROUS: This will drop the collection if it exists

    collection_name = f"{DATASET_NAME}_{MODEL}"
    image_dataset = DatasetManager.get_dataset(DATASET_NAME)
    metadata_file_path = image_dataset.get_metadata_file_path()
    embedding_dir = image_dataset.get_embedding_dir()
    column_mapping = image_dataset.get_column_mapping()
    full_text_fields = image_dataset.get_full_text_fields()


    # CREATE COLLECTION
    client = MilvusClient(host="localhost", port="19530")    
    create_collection(client, collection_name, metadata_file_path, column_mapping, full_text_fields, force=FORCE)


    # INSERT DATA
    df = pd.read_csv(metadata_file_path)
    df = df[(df["image_available"] == 1)]
    df = df[column_mapping.keys()]
    df.rename(columns=column_mapping, inplace=True)
    df.set_index("record_id", inplace=True)
    df["prefix"] = df["image_id"].apply(lambda x: x[:9])
    prefixes = sorted(df["prefix"].unique().tolist())
    
    for prefix in prefixes:                # Each prefix is for a day in the dataset
        vectors_path = f"{embedding_dir}/{prefix}.npy"
        vectors = np.load(vectors_path)

        df_prefix = df[df["prefix"] == prefix]
        # Filter out rows where activity is 'unknown'
        df_prefix = df_prefix[df_prefix["activity"] != "unknown"]

        image_ids = sorted(df_prefix["image_id"].tolist())
        indices = [i for i, img_id in enumerate(sorted(df[df["prefix"] == prefix]["image_id"].tolist())) if img_id in set(image_ids)]
        filtered_vectors = vectors[indices]

        assert len(image_ids) == len(filtered_vectors), f"Length mismatch after filtering: {len(image_ids)} != {len(filtered_vectors)}"

        data = []

        for image_id, vector in zip(image_ids, filtered_vectors):
            record_id = DatasetManager.get_dataset(DATASET_NAME).image_id_to_record_id[image_id]
            data_record = {
                "record_id": record_id,
                "image_id": image_id,
                "embedding": vector.tolist()
            }
            for mapped_col in column_mapping.values():
                if mapped_col in ["record_id", "image_id", "embedding"]:
                    continue
                elif mapped_col in full_text_fields:
                    data_record[f"text_{mapped_col}"] = df[mapped_col].loc[record_id]
                else:
                    data_record[mapped_col] = df[mapped_col].loc[record_id]
            
            data.append(data_record)
            
            # if image_id == "201901/26/20190126_191903_000":
            #     print_data_record(data_record)

        # Print only the last data record for each prefix
        print_data_record(data_record)
        print()

        client.insert(collection_name=collection_name, data=data)
        print(f"Inserted {len(data)} vectors of {prefix} into collection {collection_name}")
        print()


