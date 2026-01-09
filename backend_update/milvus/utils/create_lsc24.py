# index_milvus_and_es.py
#
# One script to (1) create+load Milvus vectors and (2) create+load Elasticsearch text fields.
# - Loads dataset.df ONCE and passes it through (no repeated CSV loads).
# - Uses constants from setup.py (no os.getenv).
# - Keeps function-call sequence for Milvus similar to Elasticsearch:
#     client -> build {schema/index_body} -> ensure {collection/index} -> bulk insert
#
# Expected setup.py constants (adjust to your env):
#   MILVUS_HOST, MILVUS_PORT
#   ELASTICSEARCH_URL, ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD
#
# Usage:
#   python index_milvus_and_es.py --dataset lsc24 --model clips --activity both --force

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple, Optional

from pprint import pprint
import math
import numpy as np
import pandas as pd

from dataset.dataset_manager import DatasetManager
from milvus.setup import (
    MILVUS_HOST,
    MILVUS_PORT,
    ELASTICSEARCH_URL,
    ELASTICSEARCH_USERNAME,
    ELASTICSEARCH_PASSWORD,
    ELASTICSEARCH_CERT
)

from pymilvus import MilvusClient, DataType, Function, FunctionType
from elasticsearch import Elasticsearch, helpers



# -----------------------------
# Common helpers
# -----------------------------

def print_config(dataset: str, model: str, force: bool, activity: str, do_milvus: bool, do_es: bool) -> None:
    print(f"Dataset: {dataset}")
    print(f"Model: {model}")
    print(f"Force: {force}")
    print(f"Activity filter: {activity}")
    print(f"Do Milvus: {do_milvus}")
    print(f"Do Elasticsearch: {do_es}")


def filter_df(df: pd.DataFrame, activity_mode: str) -> pd.DataFrame:
    df = df.copy()

    if "image_available" in df.columns:
        df = df[df["image_available"] == 1].copy()

    if activity_mode == "activity-only":
        df = df[df["activity"] != "unknown"].copy()
    elif activity_mode == "no-activity":
        df = df[df["activity"] == "unknown"].copy()
    elif activity_mode == "both":
        pass
    else:
        raise ValueError(f"Unknown activity mode: {activity_mode}")

    if "image_id" not in df.columns:
        raise ValueError("dataset.df must contain 'image_id' column")

    df["prefix"] = df["image_id"].astype(str).apply(lambda x: x[:9])
    return df


def ensure_record_id(df: pd.DataFrame, dataset_name: str) -> pd.DataFrame:
    """
    Ensure df has record_id column for both Milvus and ES.
    If it doesn't exist, derive from DatasetManager mapping.
    """
    df = df.copy()
    if "record_id" in df.columns:
        return df

    id_map = DatasetManager.get_dataset(dataset_name).image_id_to_record_id
    df["record_id"] = df["image_id"].map(id_map)
    missing = df["record_id"].isna().sum()
    if missing:
        # drop rows without mapping (shouldn't happen if dataset is consistent)
        df = df.dropna(subset=["record_id"]).copy()
    df["record_id"] = df["record_id"].astype("int64")
    return df


def coerce_missing(value: Any, db: str) -> Any:
    # Prefer None over empty string/0 for ES (unless you have strict needs)
    if pd.isna(value):
        if db == "es":
            return None
        if db == "milvus":
            return ""
    return value


def to_float_or_none(x):
    if x is None:
        return None
    # pandas NaN
    if isinstance(x, float) and math.isnan(x):
        return None
    if isinstance(x, (int, float)):
        return float(x)
    if isinstance(x, str):
        s = x.strip()
        if s == "" or s.lower() in {"nan", "none", "null"}:
            return None
        # handle "10,123" kiểu dùng dấu phẩy
        s = s.replace(",", ".")
        try:
            return float(s)
        except ValueError:
            return None
    # kiểu lạ
    try:
        return float(x)
    except Exception:
        return None


# -----------------------------
# Milvus: build schema/index/functions + ensure collection + insert
# -----------------------------

def build_milvus_schema_from_df(
    df_sample: pd.DataFrame,
    column_mapping: Dict[str, str],
    text_fields: List[str],
    embedding_dim: int = 768,
) -> Any:
    schema = MilvusClient.create_schema(auto_id=False, enable_dynamic_field=True)

    # Iterate source columns from column_mapping keys (like your original)
    for src_col in column_mapping.keys():
        mapped_col = column_mapping.get(src_col, src_col)

        # Primary key
        if mapped_col == "record_id":
            schema.add_field(field_name="record_id", datatype=DataType.INT64, is_primary=True)
            continue

        if mapped_col in text_fields:
            schema.add_field(
                field_name=mapped_col,
                datatype=DataType.VARCHAR,
                max_length=32768,
                enable_analyzer=True,
            )
            # schema.add_field(
            #     field_name=f"{mapped_col}_sparse",
            #     datatype=DataType.SPARSE_FLOAT_VECTOR,
            # )
            continue

        # Infer dtype from df_sample if present
        if src_col in df_sample.columns:
            dtype = df_sample[src_col].dtype
        elif mapped_col in df_sample.columns:
            dtype = df_sample[mapped_col].dtype
        else:
            dtype = None

        if dtype is not None and pd.api.types.is_integer_dtype(dtype):
            schema.add_field(field_name=mapped_col, datatype=DataType.INT64)
        elif dtype is not None and pd.api.types.is_float_dtype(dtype):
            schema.add_field(field_name=mapped_col, datatype=DataType.FLOAT)
        elif dtype is not None and pd.api.types.is_bool_dtype(dtype):
            schema.add_field(field_name=mapped_col, datatype=DataType.BOOL)
        else:
            schema.add_field(field_name=mapped_col, datatype=DataType.VARCHAR, max_length=100)

    # Dense embedding field
    schema.add_field(field_name="embedding", datatype=DataType.FLOAT_VECTOR, dim=embedding_dim)
    return schema


def build_milvus_functions(text_fields: List[str]) -> List[Function]:
    functions: List[Function] = []
    for col in text_fields:
        # functions.append(
        #     Function(
        #         name=f"{col}_bm25_func",
        #         function_type=FunctionType.BM25,
        #         input_field_names=[col],
        #         output_field_names=[f"{col}_sparse"],
        #     )
        # )
        pass
    return functions


def build_milvus_index_params(text_fields: List[str]) -> Any:
    index_params = MilvusClient.prepare_index_params()

    # Dense
    index_params.add_index(
        field_name="embedding",
        index_name="embedding_index",
        index_type="HNSW",
        metric_type="IP",
        M=16,
        efConstruction=100,
    )

    return index_params


def ensure_milvus_collection(
    client: MilvusClient,
    collection_name: str,
    schema: Any,
    index_params: Any,
    functions: List[Function],
    force: bool,
) -> None:
    if force and client.has_collection(collection_name):
        print(f"[Milvus] Dropping existing collection '{collection_name}'...")
        client.drop_collection(collection_name)

    if force or not client.has_collection(collection_name):
        print(f"[Milvus] Creating collection '{collection_name}'...")
        # Add functions to schema (Milvus requires schema to know functions too)
        for func in functions:
            schema.add_function(func)

        client.create_collection(
            collection_name=collection_name,
            schema=schema,
            index_params=index_params,
            functions=functions,
        )
    else:
        print(f"[Milvus] Collection '{collection_name}' already exists.")

    pprint(client.describe_collection(collection_name))


def milvus_insert_vectors_by_prefix(
    client: MilvusClient,
    collection_name: str,
    df_filtered: pd.DataFrame,
    embedding_dir: str,
    dataset_name: str,
    column_mapping: Dict[str, str],
    with_metadata: bool = True,
) -> None:
    """
    Inserts vectors in day-prefix batches like your original.
    - df_filtered must already have: image_id, record_id, prefix
    - embeddings are loaded from {embedding_dir}/{prefix}.npy
    """
    # Build a fast lookup from image_id -> row (use set_index)
    df_by_image = df_filtered.set_index("image_id", drop=False)

    prefixes = sorted(df_filtered["prefix"].unique().tolist())

    for prefix in prefixes:
        # if prefix <= "202001/15":
        #     print(f"[Milvus] Skipping prefix {prefix} (before 2020-01-16)")
        #     continue
        vectors_path = f"{embedding_dir}/{prefix}.npy"
        vectors = np.load(vectors_path)

        # All image_ids that exist for this prefix in the *original order used by the vectors file*
        # You used: sorted(df[df["prefix"] == prefix]["image_id"])
        # Here we recreate that from df_filtered? That could change alignment if df_filtered is filtered.
        # So we compute indices against the "all" list from the dataset base (unfiltered) for this prefix.
        # We'll use DatasetManager dataset.df (unfiltered but image_available==1 is OK) to preserve vector alignment.
        base_df = DatasetManager.get_dataset(dataset_name).df
        base_df = base_df[base_df["image_available"] == 1].copy()
        base_df["prefix"] = base_df["image_id"].astype(str).apply(lambda x: x[:9])

        all_image_ids_sorted = sorted(base_df[base_df["prefix"] == prefix]["image_id"].tolist())

        # The image_ids we actually want to insert for this prefix (filtered + sorted like your original)
        wanted_image_ids = sorted(df_filtered[df_filtered["prefix"] == prefix]["image_id"].tolist())
        wanted_set = set(wanted_image_ids)

        indices = [i for i, img_id in enumerate(all_image_ids_sorted) if img_id in wanted_set]
        filtered_vectors = vectors[indices]

        assert len(wanted_image_ids) == len(filtered_vectors), (
            f"Length mismatch after filtering: {len(wanted_image_ids)} != {len(filtered_vectors)}"
        )

        # Get rows aligned with wanted_image_ids
        rows = df_by_image.loc[wanted_image_ids]

        data: List[Dict[str, Any]] = []
        mapped_cols = list(column_mapping.values())

        for (image_id, vec) in zip(wanted_image_ids, filtered_vectors):
            row = rows.loc[image_id]
            record_id = int(row["record_id"])

            rec: Dict[str, Any] = {
                "record_id": record_id,
                "image_id": image_id,
                "embedding": vec.tolist(),
            }

            # Add metadata fields (excluding embedding)
            for mapped_col in mapped_cols:
                if mapped_col in ("record_id", "image_id", "embedding"):
                    continue
                if with_metadata:
                    if mapped_col in ("new_lat", "new_lng"):
                        val = coerce_missing(row[mapped_col], db="milvus")
                        val = to_float_or_none(val)
                        # nếu field trong schema KHÔNG nullable thì phải default (vd 0.0)
                        if val is None:
                            val = 0.0  # hoặc bỏ field nếu schema nullable=True
                        rec[mapped_col] = val
                    elif mapped_col in row.index:
                        rec[mapped_col] = coerce_missing(row[mapped_col], db="milvus")

            data.append(rec)

        # Print last record as debug
        if data:
            print("[Milvus] Example record:")
            for k, v in data[-1].items():
                if k == "embedding":
                    print(f"  {k}: {len(v)}-dim vector")
                else:
                    print(f"  {k}: {v}")

        client.insert(collection_name=collection_name, data=data)
        print(f"[Milvus] Inserted {len(data)} vectors for prefix={prefix}")
        print(client.get_collection_stats(collection_name))
        print()


# -----------------------------
# Elasticsearch: build index body + ensure index + bulk index
# -----------------------------

def create_es_client() -> Elasticsearch:
    return Elasticsearch(
        ELASTICSEARCH_URL,
        basic_auth=(ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD),
        ca_certs=ELASTICSEARCH_CERT,
        verify_certs=True,
    )


def infer_es_field_mapping(series: pd.Series) -> Dict[str, Any]:
    dtype = series.dtype
    if pd.api.types.is_integer_dtype(dtype):
        return {"type": "long"}
    if pd.api.types.is_float_dtype(dtype):
        return {"type": "double"}
    if pd.api.types.is_bool_dtype(dtype):
        return {"type": "boolean"}
    return {"type": "keyword", "ignore_above": 32766}


def build_es_index_body(
    df_sample: pd.DataFrame,
    column_mapping: Dict[str, str],
    text_fields: Dict[str, Any],
) -> Dict[str, Any]:
    properties: Dict[str, Any] = {}

    properties["record_id"] = {"type": "long"}
    properties["image_id"] = {"type": "keyword", "ignore_above": 32766}

    for src_col, mapped_col in column_mapping.items():
        if mapped_col in ("record_id", "image_id"):
            continue

        if mapped_col in text_fields:
            properties[mapped_col] = {
                "type": "text",
                "fields": {
                    "keyword": {"type": "keyword", "ignore_above": 32766}
                },
            }
        else:
            if src_col in df_sample.columns:
                properties[mapped_col] = infer_es_field_mapping(df_sample[src_col])
            elif mapped_col in df_sample.columns:
                properties[mapped_col] = infer_es_field_mapping(df_sample[mapped_col])
            else:
                properties[mapped_col] = {"type": "keyword", "ignore_above": 32766}

    return {
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "refresh_interval": "30s",
        },
        "mappings": {
            "dynamic": True,
            "properties": properties,
        },
    }


def ensure_es_index(es: Elasticsearch, index_name: str, index_body: Dict[str, Any], force: bool) -> None:
    if force and es.indices.exists(index=index_name):
        print(f"[ES] Deleting existing index: {index_name}")
        es.indices.delete(index=index_name)

    if force or not es.indices.exists(index=index_name):
        print(f"[ES] Creating index: {index_name}")
        es.indices.create(index=index_name, **index_body)
    else:
        print(f"[ES] Index exists: {index_name}")


def bulk_index_es(
    es: Elasticsearch,
    index_name: str,
    df_filtered: pd.DataFrame,
    column_mapping: Dict[str, str],
    chunk_size: int = 2000,
) -> Tuple[int, int]:
    mapped_cols = list(column_mapping.values())

    def gen_actions():
        # Iterate rows directly from df_filtered (already filtered once)
        for row in df_filtered.itertuples(index=False):
            r = row._asdict()

            record_id = r.get("record_id")
            image_id = r.get("image_id")
            if record_id is None or image_id is None:
                continue

            doc: Dict[str, Any] = {
                "record_id": int(record_id),
                "image_id": image_id,
            }

            for mapped_col in mapped_cols:
                if mapped_col in ("record_id", "image_id", "embedding"):
                    continue
                if mapped_col in r:
                    doc[mapped_col] = coerce_missing(r[mapped_col], db="es")

            yield {
                "_op_type": "index",
                "_index": index_name,
                "_id": str(int(record_id)),
                "_source": doc,
            }

    print(f"[ES] Bulk indexing into {index_name} ...")
    success, failed = 0, 0
    es_bulk = es.options(request_timeout=120)

    for ok, item in helpers.streaming_bulk(
        client=es_bulk,
        actions=gen_actions(),
        chunk_size=chunk_size,
        request_timeout=120,
    ):
        if ok:
            success += 1
        else:
            failed += 1
            try:
                action = list(item.keys())[0]
                err = item[action].get("error")
                print("[ES] Bulk error:", err)
            except Exception:
                print("[ES] Bulk error (unparsed):", item)

    print(f"[ES] Done. success={success}, failed={failed}")
    return success, failed


# -----------------------------
# Main orchestration (same sequence style for both)
# -----------------------------

def run_milvus(
    dataset_name: str,
    collection_name: str,
    df_filtered: pd.DataFrame,
    embedding_dir: str,
    column_mapping: Dict[str, str],
    text_fields: Dict[str, Any],
    force: bool,
    embedding_dim: int = 768,
    with_metadata: bool = True,
) -> None:
    client = MilvusClient(host=MILVUS_HOST, port=str(MILVUS_PORT))
    print("[Milvus] Connected.")

    schema = build_milvus_schema_from_df(
        df_sample=df_filtered.head(50),
        column_mapping=column_mapping,
        text_fields=text_fields,
        embedding_dim=embedding_dim,
    )
    functions = build_milvus_functions(text_fields)
    index_params = build_milvus_index_params(text_fields)

    ensure_milvus_collection(
        client=client,
        collection_name=collection_name,
        schema=schema,
        index_params=index_params,
        functions=functions,
        force=force,
    )

    milvus_insert_vectors_by_prefix(
        client=client,
        collection_name=collection_name,
        df_filtered=df_filtered,
        embedding_dir=embedding_dir,
        dataset_name=dataset_name,
        column_mapping=column_mapping,
        with_metadata=with_metadata,
    )


def run_es(
    index_name: str,
    df_filtered: pd.DataFrame,
    column_mapping: Dict[str, str],
    text_fields: Dict[str, Any],
    force: bool,
    chunk_size: int = 2000,
) -> None:
    es = create_es_client()
    info = es.info()
    print("[ES] Connected:", info.get("version", {}).get("number", "unknown"))

    index_body = build_es_index_body(
        df_sample=df_filtered.head(200),
        column_mapping=column_mapping,
        text_fields=text_fields,
    )
    ensure_es_index(es, index_name=index_name, index_body=index_body, force=force)

    bulk_index_es(
        es=es,
        index_name=index_name,
        df_filtered=df_filtered,
        column_mapping=column_mapping,
        chunk_size=chunk_size,
    )
    es.indices.refresh(index=index_name)
    print(f"[ES] Refreshed index: {index_name}")


def main():
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", default="lsc24")
    ap.add_argument("--model", default="clips")
    ap.add_argument("--force", action="store_true", help="Drop+recreate Milvus collection and ES index.")
    ap.add_argument("--activity", default="both", choices=["activity-only", "no-activity", "both"])
    ap.add_argument("--no-milvus", action="store_true")
    ap.add_argument("--no-es", action="store_true")
    ap.add_argument("--es-chunk-size", type=int, default=2000)
    ap.add_argument("--embedding-dim", type=int, default=768)
    args = ap.parse_args()

    dataset_name = args.dataset
    model = args.model
    force = args.force
    activity = args.activity
    do_milvus = not args.no_milvus
    do_es = not args.no_es

    print_config(dataset_name, model, force, activity, do_milvus, do_es)
    input("Press Enter to continue...")

    # Single dataset load
    image_dataset = DatasetManager.get_dataset(dataset_name)
    embedding_dir = image_dataset.get_embedding_dir()
    column_mapping = image_dataset.get_column_mapping()
    text_fields = image_dataset.get_text_fields()

    df = image_dataset.df
    df = filter_df(df, activity_mode=activity)
    df = ensure_record_id(df, dataset_name=dataset_name)

    # Keep names consistent, but ES gets a suffix to avoid collisions if you want
    milvus_collection = f"{dataset_name}_{model}"
    es_index = f"{dataset_name}_text"

    # Run in desired order (you can swap if you prefer)
    if do_milvus:
        run_milvus(
            dataset_name=dataset_name,
            collection_name=milvus_collection,
            df_filtered=df,
            embedding_dir=embedding_dir,
            column_mapping=column_mapping,
            text_fields=text_fields,
            force=force,
            embedding_dim=args.embedding_dim,
            with_metadata=True,
        )

    if do_es:
        run_es(
            index_name=es_index,
            df_filtered=df,
            column_mapping=column_mapping,
            text_fields=text_fields,
            force=force,
            chunk_size=args.es_chunk_size,
        )


if __name__ == "__main__":
    main()
