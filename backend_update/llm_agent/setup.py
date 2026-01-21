import os
from typing import Dict, Any

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Service configuration
CONFIG = {
    "service_name": "llm_agent",
    "version": "1.0.0",
    "port": int(os.getenv("SERVICE_PORT", 8002)),
    
    # External service URLs
    "main_service_url": os.getenv("MAIN_SERVICE_URL", "http://localhost:8000"),
    "embedding_service_url": os.getenv("EMBEDDING_SERVICE_URL", "http://localhost:8001"),
    "milvus_service_url": os.getenv("MILVUS_SERVICE_URL", "http://localhost:19530"),
    
    # Redis configuration for memory
    "redis_host": os.getenv("REDIS_HOST", "localhost"),
    "redis_port": int(os.getenv("REDIS_PORT", 6379)),
    "redis_db": int(os.getenv("REDIS_DB", 0)),
    
    # LLM configuration
    "llm_provider": os.getenv("LLM_PROVIDER", "gemini"),
    "llm_model": os.getenv("LLM_MODEL", "gemini-pro"),
    "llm_temperature": float(os.getenv("LLM_TEMPERATURE", 0.1)),
    "max_tokens": int(os.getenv("MAX_TOKENS", 2000)),
    "llm_streaming": os.getenv("LLM_STREAMING", "true").lower() == "true",
    
    # Agent configuration
    "max_tool_calls": int(os.getenv("MAX_TOOL_CALLS", 10)),
    "conversation_memory_limit": int(os.getenv("CONVERSATION_MEMORY_LIMIT", 50)),
    "session_timeout": int(os.getenv("SESSION_TIMEOUT", 3600)),  # 1 hour
    
    # Development settings
    "debug": os.getenv("DEBUG", "false").lower() == "true",
    "log_level": os.getenv("LOG_LEVEL", "INFO"),
}

def get_config() -> Dict[str, Any]:
    """Get the current configuration"""
    return CONFIG

def setup_services():
    """Initialize external service connections and validate LLM setup"""
    print(f"🚀 Starting {CONFIG['service_name']} v{CONFIG['version']}")
    print(f"📡 Main service: {CONFIG['main_service_url']}")
    print(f"🔧 Embedding service: {CONFIG['embedding_service_url']}")
    print(f"💾 Milvus service: {CONFIG['milvus_service_url']}")
    print(f"🔴 Redis: {CONFIG['redis_host']}:{CONFIG['redis_port']}")
    print(f"🤖 LLM: {CONFIG['llm_provider']} - {CONFIG['llm_model']}")
    
    # Validate LLM configuration
    provider = CONFIG['llm_provider']
    if provider == "gemini":
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("⚠️  WARNING: GOOGLE_API_KEY not set for Gemini")
        else:
            print("✅ Google API key configured")
    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("⚠️  WARNING: OPENAI_API_KEY not set for OpenAI")
        else:
            print("✅ OpenAI API key configured")
    elif provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("⚠️  WARNING: ANTHROPIC_API_KEY not set for Anthropic")
        else:
            print("✅ Anthropic API key configured")
    
    print(f"🎯 Ready to serve on port {CONFIG['port']}")

# Initialize on import
setup_services()


import os
import yaml
from pathlib import Path

def load_yaml(p: Path):
    with p.open("r") as f:
        return yaml.safe_load(f)
    

CONFIG_DIR = Path(os.environ.get("CONFIG_DIR", "./configs")).resolve()
SYSTEM_CONFIG_NAME = os.environ.get("SYSTEM_CONFIG", "system_config.yaml")
SYSTEM_CONFIG_PATH = (CONFIG_DIR / SYSTEM_CONFIG_NAME).resolve()
SYSTEM_CONFIG = load_yaml(SYSTEM_CONFIG_PATH)