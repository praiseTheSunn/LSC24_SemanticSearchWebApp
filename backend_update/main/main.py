from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import search, explore, feedback, evaluate, submit
from fastapi.middleware.cors import CORSMiddleware

import logging
import os
from datetime import datetime


# def setup_logging(log_dir="./logs"):
#     os.makedirs(log_dir, exist_ok=True)
    
#     timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
#     log_filename = os.path.join(log_dir, f"log_{timestamp}.log")

#     logging.basicConfig(
#         level=logging.INFO,
#         format="%(asctime)s - %(levelname)s - %(message)s",
#         handlers=[
#             logging.FileHandler(log_filename, mode="w")
#         ],
#         force=True
#     )

# setup_logging()


app = FastAPI(
    name = "SnapSeek Server", 
    docs_url = "/docs", 
    redoc_url = "/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# Add routers
routers = [
    search.router,
    explore.router,
    feedback.router,
    evaluate.router,
    submit.router
]

for router in routers:
    app.include_router(router)
