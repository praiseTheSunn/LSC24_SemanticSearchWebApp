#!/bin/bash

# Set up environment variables if needed
export PYTHONPATH=/app:$PYTHONPATH

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