#!/usr/bin/env python3
import argparse
from pymilvus import MilvusClient
from pprint import pprint
import sys

def fail(msg: str, code: int = 1):
    print(f"[ERROR] {msg}", file=sys.stderr)
    sys.exit(code)

def main():
    ap = argparse.ArgumentParser(description="Rename a Milvus collection.")
    ap.add_argument("--host", default="localhost", help="Milvus host (default: localhost)")
    ap.add_argument("--port", default="19530", help="Milvus port (default: 19530)")
    ap.add_argument("--db", default="", help="Database name if you use multi-DB (optional)")
    ap.add_argument("--from", dest="old_name", required=True, help="Current collection name")
    ap.add_argument("--to", dest="new_name", required=True, help="New collection name")
    ap.add_argument("--yes", action="store_true", help="Skip confirmation prompt")
    args = ap.parse_args()

    client = MilvusClient(host=args.host, port=args.port, db_name=args.db)

    # 1) Pre-flight checks
    existing = set(client.list_collections())
    if args.old_name not in existing:
        fail(f"Source collection '{args.old_name}' not found.")
    if args.new_name in existing:
        fail(f"Target name '{args.new_name}' already exists. Choose a different name.")

    print("[INFO] Current collections:")
    pprint(sorted(existing))

    if not args.yes:
        reply = input(f"Rename '{args.old_name}' → '{args.new_name}' ? [y/N]: ").strip().lower()
        if reply != "y":
            print("Aborted.")
            return

    # 2) Rename
    print(f"[INFO] Renaming '{args.old_name}' to '{args.new_name}' ...")
    client.rename_collection(old_name=args.old_name, new_name=args.new_name)

    # 3) Verify
    after = set(client.list_collections())
    print("[INFO] Collections after rename:")
    pprint(sorted(after))

    if args.old_name in after or args.new_name not in after:
        fail("Post-rename check failed.")
    print("[SUCCESS] Rename complete.")

if __name__ == "__main__":
    main()
