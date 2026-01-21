from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import embedding
from fastapi.middleware.cors import CORSMiddleware

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

app.include_router(embedding.router)
