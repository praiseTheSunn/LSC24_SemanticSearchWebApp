#!/usr/bin/env bash
set -euo pipefail

source /opt/conda/etc/profile.d/conda.sh
conda activate base

export PYTHONPATH=/app/libs

python -m uvicorn embedding_compute:app \
  --host 0.0.0.0 \
  --port 20724