from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.embedding import embedding
# from dependencies import *
# from connectors import sqlalchemy_engine
# import sql_app.schemas
from fastapi.middleware.cors import CORSMiddleware


# sql_app.schemas.Base.metadata.create_all(bind = sqlalchemy_engine)

# from model.beit3 import beit3
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
