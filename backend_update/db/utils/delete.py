# delete_indexes.py
#
# Hard-coded delete script for:
# - Milvus collection
# - Elasticsearch index
#
# Uses constants loaded from setup.py (recommended).
#
# Usage:
#   python delete_indexes.py
#
# (Edit the constants below to the collection/index you want to delete.)

from __future__ import annotations

from db.setup import (
    MILVUS_HOST,
    MILVUS_PORT,
    ELASTICSEARCH_URL,
    ELASTICSEARCH_USERNAME,
    ELASTICSEARCH_PASSWORD,
    ELASTICSEARCH_CERT,
)

from pymilvus import MilvusClient, MilvusException
from elasticsearch import Elasticsearch, ApiError


# -----------------------------
# HARD-CODE TARGETS HERE
# -----------------------------
MILVUS_COLLECTION_NAME = ""
ELASTICSEARCH_INDEX_NAME = "lsc24_text"


# -----------------------------
# Clients
# -----------------------------

def make_milvus_client() -> MilvusClient:
    host = MILVUS_HOST or "localhost"
    port = str(MILVUS_PORT or 19530)
    return MilvusClient(host=host, port=port)


def make_es_client() -> Elasticsearch:
    if ELASTICSEARCH_CERT:
        return Elasticsearch(
            ELASTICSEARCH_URL,
            basic_auth=(ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD),
            ca_certs=ELASTICSEARCH_CERT,
            verify_certs=True,
            request_timeout=120,
        )
    return Elasticsearch(
        ELASTICSEARCH_URL,
        basic_auth=(ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD),
        request_timeout=120,
    )


# -----------------------------
# Delete operations
# -----------------------------

def delete_milvus_collection(client: MilvusClient, collection_name: str) -> None:
    try:
        if client.has_collection(collection_name):
            print(f"[Milvus] Dropping collection: {collection_name}")
            client.drop_collection(collection_name)
            print(f"[Milvus] Dropped: {collection_name}")
        else:
            print(f"[Milvus] Collection not found: {collection_name}")
    except MilvusException as e:
        print(f"[Milvus] Error dropping collection '{collection_name}': {e}")


def delete_es_index(es: Elasticsearch, index_name: str) -> None:
    try:
        if es.indices.exists(index=index_name):
            print(f"[ES] Deleting index: {index_name}")
            es.indices.delete(index=index_name)
            print(f"[ES] Deleted: {index_name}")
        else:
            print(f"[ES] Index not found: {index_name}")
    except ApiError as e:
        print(f"[ES] ApiError deleting index '{index_name}': {e}")
    except Exception as e:
        print(f"[ES] Error deleting index '{index_name}': {e}")


def main() -> None:
    print("=== Delete targets ===")
    print(f"Milvus collection: {MILVUS_COLLECTION_NAME}")
    print(f"Elasticsearch index: {ELASTICSEARCH_INDEX_NAME}")
    input("Press Enter to continue (THIS IS DESTRUCTIVE)...")

    # Milvus
    milvus = make_milvus_client()
    print("[Milvus] Connected.")
    delete_milvus_collection(milvus, MILVUS_COLLECTION_NAME)

    # Elasticsearch
    es = make_es_client()
    try:
        info = es.info()
        print("[ES] Connected:", info.get("version", {}).get("number", "unknown"))
    except Exception:
        print("[ES] Connected.")
    delete_es_index(es, ELASTICSEARCH_INDEX_NAME)

    print("Done.")


if __name__ == "__main__":
    main()
