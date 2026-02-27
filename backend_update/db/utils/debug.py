# debug_store.py
#
# Debug script for:
#  - ANY Milvus collection: list collections, describe, list indexes, print stats, print a few records
#  - ANY Elasticsearch index: list indices, get mapping/settings, print count, print a few documents
#
# Hard-coded targets are recommended: set COLLECTION_NAME / ES_INDEX_NAME below.
#
# Usage:
#   python debug_store.py

from __future__ import annotations

from pprint import pprint
from typing import Any, Dict, List, Optional

from pymilvus import MilvusClient, MilvusException
from elasticsearch import Elasticsearch, ApiError

from milvus.setup import (
    MILVUS_HOST,
    MILVUS_PORT,
    ELASTICSEARCH_URL,
    ELASTICSEARCH_USERNAME,
    ELASTICSEARCH_PASSWORD,
    ELASTICSEARCH_CERT,
)

# -----------------------------
# HARD-CODE TARGETS HERE
# -----------------------------
COLLECTION_NAME = "lsc24_clips"
ES_INDEX_NAME = "lsc24_text"

# If you don't know ids in Milvus, we will try to query a few via iterator-like flow (fallback).
# You can hardcode some ids for guaranteed output:
MILVUS_SAMPLE_IDS: List[int] = [20]  # add more if you want


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
# Milvus debug
# -----------------------------
def debug_milvus_collection(
    client: MilvusClient,
    collection_name: str,
    sample_ids: Optional[List[int]] = None,
    limit: int = 5,
    output_fields: Optional[List[str]] = None,
) -> None:
    print("\n======================")
    print(f"[Milvus] Debug collection: {collection_name}")
    print("======================")

    try:
        collections = client.list_collections()
        print(f"[Milvus] Collections: {collections}")
    except Exception as e:
        print("[Milvus] list_collections() error:", e)

    try:
        if not client.has_collection(collection_name):
            print(f"[Milvus] Collection not found: {collection_name}")
            return
    except Exception as e:
        print("[Milvus] has_collection() error:", e)
        return

    # Stats
    try:
        stats = client.get_collection_stats(collection_name)
        print(f"[Milvus] Stats:")
        pprint(stats)
    except Exception as e:
        print("[Milvus] get_collection_stats() error:", e)

    # Describe
    try:
        desc = client.describe_collection(collection_name)
        print(f"[Milvus] Description (keys={list(desc.keys()) if isinstance(desc, dict) else 'n/a'}):")
        pprint(desc)
    except Exception as e:
        print("[Milvus] describe_collection() error:", e)

    # Indexes
    try:
        idx = client.list_indexes(collection_name)
        print(f"[Milvus] Indexes:")
        pprint(idx)
    except Exception as e:
        print("[Milvus] list_indexes() error:", e)

    # Try to fetch a few docs
    out_fields = output_fields  # may be None -> all scalar fields (depends on Milvus)
    ids = sample_ids or []

    if ids:
        print(f"[Milvus] Fetching by ids={ids[:limit]} (limit={limit}) ...")
        try:
            rows = client.get(collection_name=collection_name, ids=ids[:limit], output_fields=out_fields)
            print(f"[Milvus] Got {len(rows)} rows")
            for i, hit in enumerate(rows):
                print(f"\n[Milvus] --- record {i} ---")
                # Print a compact subset first if present
                for k in ("record_id", "image_id", "time", "text_activity"):
                    if isinstance(hit, dict) and k in hit:
                        print(f"{k}: {hit.get(k)}")
                # Then full dict
                pprint(hit)
            return
        except Exception as e:
            print("[Milvus] get() error:", e)

    # Fallback: query a few rows without knowing IDs (requires a valid filter expr)
    # We assume record_id is primary key and exists.
    print("[Milvus] No sample ids (or get failed). Trying a fallback query: record_id >= 0")
    try:
        rows = client.query(
            collection_name=collection_name,
            filter="record_id >= 0",
            output_fields=out_fields,
            limit=limit,
        )
        print(f"[Milvus] Query returned {len(rows)} rows")
        for i, hit in enumerate(rows):
            print(f"\n[Milvus] --- record {i} ---")
            for k in ("record_id", "image_id", "time", "text_activity"):
                if isinstance(hit, dict) and k in hit:
                    print(f"{k}: {hit.get(k)}")
            pprint(hit)
    except Exception as e:
        print("[Milvus] query() fallback error:", e)
        print("[Milvus] Tip: set MILVUS_SAMPLE_IDS to known ids, or provide output_fields explicitly.")


# -----------------------------
# Elasticsearch debug
# -----------------------------
def debug_es_index(
    es: Elasticsearch,
    index_name: str,
    limit: int = 5,
    source_includes: Optional[List[str]] = None,
) -> None:
    print("\n======================")
    print(f"[ES] Debug index: {index_name}")
    print("======================")

    # Info + indices list
    try:
        info = es.info()
        print("[ES] Version:", info.get("version", {}).get("number", "unknown"))
    except Exception as e:
        print("[ES] info() error:", e)

    try:
        indices = es.cat.indices(format="json", expand_wildcards="open")
        print("[ES] Indices:", [i.get("index") for i in indices])
    except Exception as e:
        print("[ES] cat.indices() error:", e)

    # Exists?
    try:
        if not es.indices.exists(index=index_name):
            print(f"[ES] Index not found: {index_name}")
            return
    except ApiError as e:
        print("[ES] exists() ApiError:", e)
        return

    # Count
    try:
        cnt = es.count(index=index_name)
        print("[ES] Count:", cnt.get("count"))
    except Exception as e:
        print("[ES] count() error:", e)

    # Mapping
    try:
        mapping = es.indices.get_mapping(index=index_name)
        print("[ES] Mapping (showing properties keys only):")
        props = mapping[index_name]["mappings"].get("properties", {})
        print(sorted(list(props.keys()))[:200])
    except Exception as e:
        print("[ES] get_mapping() error:", e)

    # Settings
    try:
        settings = es.indices.get_settings(index=index_name)
        print("[ES] Settings (refresh_interval, shards/replicas):")
        s = settings[index_name]["settings"]["index"]
        pprint(
            {
                "refresh_interval": s.get("refresh_interval"),
                "number_of_shards": s.get("number_of_shards"),
                "number_of_replicas": s.get("number_of_replicas"),
            }
        )
    except Exception as e:
        print("[ES] get_settings() error:", e)

    # Sample docs
    try:
        body: Dict[str, Any] = {
            "size": limit,
            "query": {"match_all": {}},
            "sort": [{"record_id": "asc"}],  # requires record_id mapped
        }
        if source_includes is not None:
            body["_source"] = {"includes": source_includes}
        resp = es.search(index=index_name, body=body)
        hits = resp.get("hits", {}).get("hits", [])
        print(f"[ES] Sample docs: {len(hits)}")
        for i, h in enumerate(hits):
            print(f"\n[ES] --- doc {i} ---")
            print("_id:", h.get("_id"))
            print("_score:", h.get("_score"))
            src = h.get("_source", {})
            # Print a few common fields if present
            for k in ("record_id", "image_id", "time", "text_activity", "ocr", "caption"):
                if k in src:
                    v = src.get(k)
                    # avoid dumping megabytes
                    if isinstance(v, str) and len(v) > 300:
                        v = v[:300] + "..."
                    print(f"{k}: {v}")
            pprint(src)
    except Exception as e:
        print("[ES] search(match_all) error:", e)
        print("[ES] Tip: remove the sort if record_id is not mapped or not present.")


# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    print("=== Debug targets ===")
    print("Milvus collection:", COLLECTION_NAME)
    print("ES index:", ES_INDEX_NAME)
    input("Press Enter to continue...")

    # Milvus
    milvus_client = make_milvus_client()
    print("[Milvus] Connected.")
    debug_milvus_collection(
        milvus_client,
        collection_name=COLLECTION_NAME,
        sample_ids=MILVUS_SAMPLE_IDS,
        limit=5,
        output_fields=None,  # or ["record_id","image_id","time","text_activity"]
    )

    # ES
    es_client = make_es_client()
    print("[ES] Connected.")
    debug_es_index(
        es_client,
        index_name=ES_INDEX_NAME,
        limit=5,
        source_includes=None,  # or ["record_id","image_id","time","text_activity","ocr"]
    )
