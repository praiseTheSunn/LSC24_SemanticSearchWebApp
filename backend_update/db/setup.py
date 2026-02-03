from dotenv import load_dotenv
from pathlib import Path

# Load .env from repo root (or nearest parent)
load_dotenv()

import os
import yaml

def load_yaml(p: Path):
    with p.open("r") as f:
        return yaml.safe_load(f)
    

CONFIG_DIR = Path(os.environ.get("CONFIG_DIR", "./configs")).resolve()
SYSTEM_CONFIG_NAME = os.environ.get("SYSTEM_CONFIG", "system_config.yaml")
SYSTEM_CONFIG_PATH = (CONFIG_DIR / SYSTEM_CONFIG_NAME).resolve()
SYSTEM_CONFIG = load_yaml(SYSTEM_CONFIG_PATH)

available_datasets = SYSTEM_CONFIG.get("available_datasets", [])
available_models = SYSTEM_CONFIG.get("available_models", [])

MILVUS_CONFIG = SYSTEM_CONFIG.get("milvus", {})
MILVUS_HOST = MILVUS_CONFIG.get("host", "")
MILVUS_PORT = MILVUS_CONFIG.get("port", 19530)
MILVUS_URI = f"http://{MILVUS_HOST}:{MILVUS_PORT}"
print(f"[Milvus] Using URI: {MILVUS_URI}")

ELASTICSEARCH_CONFIG = SYSTEM_CONFIG.get("elasticsearch", {})
ELASTICSEARCH_URL = ELASTICSEARCH_CONFIG.get("url", "")
ELASTICSEARCH_USERNAME = ELASTICSEARCH_CONFIG.get("username", "")
ELASTICSEARCH_PASSWORD = ELASTICSEARCH_CONFIG.get("password", "")
ELASTICSEARCH_CERT = ELASTICSEARCH_CONFIG.get("cert", "")


from pymilvus import MilvusClient, MilvusException
from typing import Any, Dict
import time

milvus_client = MilvusClient(uri=MILVUS_URI)


def _print_collection_summary(collection_name: str, stats: Dict[str, Any]) -> None:
    row_count = None
    for key in ("row_count", "num_entities", "total_row_count", "entities"):
        if key in stats:
            row_count = stats.get(key)
            break

    if "error" in stats:
        print(f"[Milvus] {collection_name}: stats_error={stats['error']}")
    elif row_count is not None:
        print(f"[Milvus] {collection_name}: row_count={row_count}")
    else:
        print(f"[Milvus] {collection_name}: stats_keys={list(stats.keys())}")


def safe_load_collection(collection_name: str, timeout: int = 60) -> None:
    """Load collection with visibility + timeout"""
    print(f"[Milvus] Loading '{collection_name}' ...")
    start = time.time()

    milvus_client.load_collection(collection_name)

    elapsed = time.time() - start
    print(f"[Milvus] Loaded '{collection_name}' in {elapsed:.2f}s")


def init_milvus(load_collections: bool = False) -> None:
    print("[Milvus] Connected.")

    collections = milvus_client.list_collections()
    print(f"[Milvus] Found {len(collections)} collections")

    for name in collections:
        try:
            stats = milvus_client.get_collection_stats(name) or {}
            _print_collection_summary(name, stats)

            if load_collections:
                safe_load_collection(name)

        except MilvusException as e:
            print(f"[Milvus] Error on '{name}': {e}")


# call this ONCE at startup
init_milvus(load_collections=True)




# setup Elasticsearch
from elasticsearch import Elasticsearch, ApiError 
es_client = Elasticsearch(
            ELASTICSEARCH_URL,
            basic_auth=(ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD),
            ca_certs=ELASTICSEARCH_CERT,
            verify_certs=True,
            request_timeout=120,
        )
try:
    info = es_client.info()
    print("[ES] Connected:", info.get("version", {}).get("number", "unknown"))

    # Cluster health (quick sanity)
    health = es_client.cluster.health()
    print("[ES] Cluster health:", {k: health.get(k) for k in ["cluster_name", "status", "number_of_nodes"]})

    # List indices (similar to Milvus list_collections)
    # show only non-hidden by default; remove `expand_wildcards` if you want all
    indices = es_client.cat.indices(format="json", expand_wildcards="open")
    print(f"[ES] Indices: {[i.get('index') for i in indices]}")

    # Print per-index docs/store summary (like your collection stats loop)
    for i in indices:
        idx = i.get("index")
        if not idx:
            continue
        print(
            f"[ES] Index: {idx} | docs={i.get('docs.count')} | store={i.get('store.size')} | health={i.get('health')}"
        )

except ApiError as e:
    print("[ES] ApiError:", e)
except Exception as e:
    print("[ES] Error:", e)


