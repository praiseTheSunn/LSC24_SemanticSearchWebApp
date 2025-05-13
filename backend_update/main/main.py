from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import search, explore, feedback
from fastapi.middleware.cors import CORSMiddleware


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
    feedback.router
]

for router in routers:
    app.include_router(router)
