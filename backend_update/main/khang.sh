#!/bin/bash
set -e

# Optional: activate virtual environment if used
echo "Starting backend server..."

# Set environment variable (can also be handled by Docker ENV)
export SYSTEM_CONFIG="/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/configs/system_config.yaml"

# Run app
exec python -m uvicorn main:app --host 0.0.0.0 --port 20734 --reload
