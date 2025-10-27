#!/bin/bash
set -e

# Activate GPU environment if needed (handled automatically with CUDA base)
export SYSTEM_CONFIG="/app/configs/system_config.yaml"
export CUDA_VISIBLE_DEVICES=0

# Run the FastAPI app with Uvicorn
python3 -m uvicorn main:app --host 0.0.0.0 --port 20736 --reload
