#!/bin/bash
# Load environment variables from .env file
# export $(grep -v '^#' .env | xargs)
WEBP_DIR=/Users/hoavien/Documents/AIC2025/aic_data/webp
# Run both commands
rsbuild dev &
python3 -m http.server --bind 127.0.0.1 8000 --directory "$WEBP_DIR"