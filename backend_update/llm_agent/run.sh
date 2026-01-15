#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root (works even if script is symlinked)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"     # Edit here when you move the script to another place

export PYTHONPATH="$REPO_ROOT/libs"


# Start the LLM agent service
echo "Starting LLM Agent Service..."
echo "Service URL: http://0.0.0.0:20726"
echo "Docs available at: http://0.0.0.0:20726/docs"

# Run with uvicorn
WATCHFILES_FORCE_POLLING=1 python -m uvicorn main:app --host 0.0.0.0 --port 20726 --reload \
  --reload-exclude '.git/*' \
  --reload-exclude '.venv/*' \
  --reload-exclude 'data/*' \
  --reload-exclude '__pycache__/*'