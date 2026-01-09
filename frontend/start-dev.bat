@echo off
REM Load environment variables from .env file
for /f "delims=" %%x in (.env) do set %%x

REM Run both commands
start pnpm serve dist
@REM python -m http.server --bind 127.0.0.1 8000 --directory %WEBP_DIR%
