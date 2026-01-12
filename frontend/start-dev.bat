@echo off
REM Load environment variables from .env file
for /f "delims=" %%x in (.env) do set %%x

REM Run both commands
@REM start pnpm serve dist
set WEBP_DIR=E:/LSCDATA/compressed_keyframes
start rsbuild dev --host 127.0.0.1 --port 3000 &
python -m http.server --bind 127.0.0.1 8080 --directory %WEBP_DIR%
