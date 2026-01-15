#!/bin/bash
# Load environment variables from .env file
# export $(grep -v '^#' .env | xargs)
WEBP_DIR=/Users/hoavien/Documents/AIC2025/aic_data/webp
# Run both commands
rsbuild dev &
python3 -m http.server --bind 0.0.0.0 8080 --directory "$WEBP_DIR"