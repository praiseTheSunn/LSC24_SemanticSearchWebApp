from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import agent, conversation, planning
import setup

app = FastAPI(
    title="SnapSeek LLM Agent",
    description="LLM Agent service for intelligent search planning and execution",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Setup CORS policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent.router)
app.include_router(conversation.router)
app.include_router(planning.router)

@app.get("/")
async def root():
    return {"message": "SnapSeek LLM Agent Service", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "llm_agent"}
