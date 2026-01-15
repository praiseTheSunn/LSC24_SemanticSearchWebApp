#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root (works even if script is symlinked)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"                    # Edit here when you move the script to another place

export PYTHONPATH="$REPO_ROOT/libs"

cd "$REPO_ROOT"

python -m milvus.utils.delete