import os
from typing import Dict, Any, Optional
from langchain_core.language_models import BaseLanguageModel
from langchain_openai import ChatOpenAI, OpenAI
try:
    from langchain_anthropic import ChatAnthropic
except ImportError:
    ChatAnthropic = None
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    ChatGoogleGenerativeAI = None

class LLMConfig:
    """Configuration class for LLM providers"""
    
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "gemini")  # Default to Gemini
        self.model = os.getenv("LLM_MODEL", "gemini-pro")
        self.api_key = os.getenv("LLM_API_KEY")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.1"))
        self.max_tokens = int(os.getenv("MAX_TOKENS", "2000"))
        self.streaming = os.getenv("LLM_STREAMING", "true").lower() == "true"
        
        # Provider-specific configurations
        self.google_api_key = os.getenv("GOOGLE_API_KEY") or self.api_key
        self.openai_api_key = os.getenv("OPENAI_API_KEY") or self.api_key
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY") or self.api_key
        
    def get_llm(self) -> BaseLanguageModel:
        """Get the configured LLM instance"""
        if self.provider == "gemini" or self.provider == "google":
            if not ChatGoogleGenerativeAI:
                raise ImportError("langchain-google-genai is required for Gemini. Install with: pip install langchain-google-genai")
            if not self.google_api_key:
                raise ValueError("GOOGLE_API_KEY environment variable is required for Gemini")
                
            return ChatGoogleGenerativeAI(
                model=self.model,
                google_api_key=self.google_api_key,
                temperature=self.temperature,
                max_output_tokens=self.max_tokens,
                convert_system_message_to_human=True  # Gemini-specific setting
            )
            
        elif self.provider == "openai":
            if not self.openai_api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required for OpenAI")
                
            if self.model.startswith("gpt-"):
                return ChatOpenAI(
                    model=self.model,
                    openai_api_key=self.openai_api_key,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    streaming=self.streaming
                )
            else:
                return OpenAI(
                    model=self.model,
                    openai_api_key=self.openai_api_key,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens
                )
                
        elif self.provider == "anthropic":
            if not ChatAnthropic:
                raise ImportError("langchain-anthropic is required for Anthropic. Install with: pip install langchain-anthropic")
            if not self.anthropic_api_key:
                raise ValueError("ANTHROPIC_API_KEY environment variable is required for Anthropic")
                
            return ChatAnthropic(
                model=self.model,
                anthropic_api_key=self.anthropic_api_key,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}. Supported: gemini, openai, anthropic")

class LLMManager:
    """Singleton manager for LLM instances"""
    
    _instance = None
    _llm = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._llm is None:
            self.config = LLMConfig()
            self._llm = self.config.get_llm()
    
    @property
    def llm(self) -> BaseLanguageModel:
        return self._llm
    
    def get_config(self) -> Dict[str, Any]:
        return {
            "provider": self.config.provider,
            "model": self.config.model,
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
            "streaming": self.config.streaming
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """Test the LLM connection"""
        try:
            # Simple test query
            response = self._llm.invoke("Hello, please respond with 'Connection successful'")
            return {
                "success": True,
                "provider": self.config.provider,
                "model": self.config.model,
                "response": str(response)
            }
        except Exception as e:
            return {
                "success": False,
                "provider": self.config.provider,
                "model": self.config.model,
                "error": str(e)
            }