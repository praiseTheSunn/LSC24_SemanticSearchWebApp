source /root/miniconda3/etc/profile.d/conda.sh
conda init
conda activate main


#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root (works even if script is symlinked)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"                    # Edit here when you move the script to another place

export PYTHONPATH="$REPO_ROOT/libs"


python3 -m uvicorn main:app --host 0.0.0.0 --port 20721 --reload