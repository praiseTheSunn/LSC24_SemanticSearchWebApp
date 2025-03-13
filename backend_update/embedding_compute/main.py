from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import embedding
from fastapi.middleware.cors import CORSMiddleware

import setup

app = FastAPI(
    name = "SnapSeek (Embedding)", 
    docs_url = "/docs", 
    redoc_url = "/redoc",
)

# Setup CORS policy for FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# Add routers
routers = [
    embedding.router
]
for router in routers:
    app.include_router(router)
