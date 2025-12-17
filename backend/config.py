"""
Configuration module for DORA backend.
Centralizes all configuration settings using Pydantic BaseSettings.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    app_name: str = "DORA - Document Retrieval Assistant"
    app_version: str = "2.0.0"
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=False, env="DEBUG")
    
    # API Keys
    google_client_id: str = Field(..., env="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(..., env="GOOGLE_CLIENT_SECRET")
    gemini_api_key: str = Field(default="", env="GEMINI_API_KEY")  # Optional - only needed if using Gemini
    groq_api_key: str = Field(default="", env="GROQ_API_KEY")  # Optional - only needed if using Groq
    
    # Optional Supabase (for future use)
    supabase_url: str = Field(default="", env="SUPABASE_URL")
    supabase_service_role_key: str = Field(default="", env="SUPABASE_SERVICE_ROLE_KEY")
    
    # CORS Configuration
    allowed_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        env="ALLOWED_ORIGINS"
    )
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse allowed origins from comma-separated string."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # RAG Configuration - BALANCED FOR DETAIL & SPEED
    chunk_size: int = Field(default=850, env="CHUNK_SIZE")  # Sweet spot: detail + speed
    chunk_overlap: int = Field(default=85, env="CHUNK_OVERLAP")  # 10% overlap
    max_results: int = Field(default=10, env="MAX_RESULTS")
    similarity_threshold: float = Field(default=0.7, env="SIMILARITY_THRESHOLD")
    
    # ChromaDB Configuration
    chroma_persist_directory: str = Field(
        default="./chroma_db",
        env="CHROMA_PERSIST_DIRECTORY"
    )
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    auth_rate_limit_per_minute: int = Field(default=5, env="AUTH_RATE_LIMIT_PER_MINUTE")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Security
    jwt_secret_key: str = Field(default="", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Document Processing
    max_document_size_mb: int = Field(default=50, env="MAX_DOCUMENT_SIZE_MB")
    max_bulk_upload_documents: int = Field(default=100, env="MAX_BULK_UPLOAD_DOCUMENTS")
    concurrent_processing_limit: int = Field(default=5, env="CONCURRENT_PROCESSING_LIMIT")
    
    # Railway/Vercel Detection - Auto-optimize for limited memory
    is_railway: bool = Field(default=False, env="RAILWAY_ENVIRONMENT")
    is_vercel: bool = Field(default=False, env="VERCEL")
    
    @property
    def is_memory_constrained(self) -> bool:
        """Detect if running on memory-constrained environment (Railway/Vercel free tier)"""
        return self.is_railway or self.is_vercel or os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("VERCEL")
    
    # Bulk Upload Optimization - ADAPTIVE BASED ON ENVIRONMENT
    @property
    def bulk_upload_batch_size(self) -> int:
        """Adaptive batch size based on environment"""
        if self.is_memory_constrained:
            return int(os.getenv("BULK_UPLOAD_BATCH_SIZE", "3"))  # 🔥 RAILWAY: 3 files at a time to prevent OOM
        return int(os.getenv("BULK_UPLOAD_BATCH_SIZE", "60"))  # 🔥 DOCKER/LOCAL: 60 parallel
    
    # Embedding Batch Optimization - ADAPTIVE BASED ON ENVIRONMENT
    @property
    def embedding_batch_size(self) -> int:
        """Adaptive embedding batch size based on environment"""
        if self.is_memory_constrained:
            return int(os.getenv("EMBEDDING_BATCH_SIZE", "1"))  # 🔥 RAILWAY: 1 file at a time
        return int(os.getenv("EMBEDDING_BATCH_SIZE", "15"))  # 🔥 DOCKER/LOCAL: 15 parallel
    
    # Cache Configuration
    cache_ttl_seconds: int = Field(default=300, env="CACHE_TTL_SECONDS")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


# Global settings instance
settings = Settings()


# Configuration constants for RAG pipeline
class RAGConfig:
    """Constants for RAG pipeline configuration."""
    
    # Chunk sizes for different document types
    DEFAULT_CHUNK_SIZE = settings.chunk_size
    DEFAULT_OVERLAP = settings.chunk_overlap
    LEGAL_CHUNK_SIZE = 2000
    LEGAL_OVERLAP = 200
    TECHNICAL_CHUNK_SIZE = 1000
    TECHNICAL_OVERLAP = 100
    ACADEMIC_CHUNK_SIZE = 1500
    ACADEMIC_OVERLAP = 150
    BUSINESS_CHUNK_SIZE = 1500
    BUSINESS_OVERLAP = 150
    
    # Retrieval configuration
    MAX_RESULTS = settings.max_results
    SIMILARITY_THRESHOLD = settings.similarity_threshold
    
    # Embedding model
    EMBEDDING_MODEL = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION = 384
    
    # Gemini model (configurable via environment variable)
    # Using gemini-2.0-flash-exp (the model that was working before)
    # NOTE: This is an experimental model with limited quota (50 req/day)
    # If you get quota exceeded, wait for reset or upgrade to paid plan
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
    GEMINI_TEMPERATURE = 0.7
    GEMINI_MAX_TOKENS = 2048
    
    # Groq model configuration
    # PRODUCTION STABLE: llama-3.1-8b-instant (14.4K req/day - HIGHEST!)
    # Quality fallbacks available (120B, 70B) when needed
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    GROQ_TEMPERATURE = 0.7
    GROQ_MAX_TOKENS = 2048
    
    # LLM Provider: "gemini" or "groq"
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")


# Logging configuration
def get_log_config():
    """Get logging configuration dictionary - MEMORY OPTIMIZED for Railway."""
    # Detect if running on Railway/Vercel (memory-constrained)
    is_memory_constrained = os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("VERCEL")
    
    # Use WARNING level on Railway to reduce log spam and memory usage
    log_level = "WARNING" if is_memory_constrained else settings.log_level
    
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "minimal": {
                "format": "%(levelname)s - %(message)s",  # Minimal for Railway
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "minimal" if is_memory_constrained else "default",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": log_level,
            "handlers": ["console"],  # Only console for Railway (no file logging)
        },
    }
