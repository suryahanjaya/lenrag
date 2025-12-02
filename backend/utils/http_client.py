"""
HTTP Connection Pooling Implementation
This improves performance by reusing HTTP connections
"""

import httpx
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class HTTPClientManager:
    """Manages HTTP client with connection pooling"""
    
    _instance: Optional[httpx.AsyncClient] = None
    
    @classmethod
    async def get_client(cls) -> httpx.AsyncClient:
        """Get or create HTTP client with connection pooling"""
        if cls._instance is None or cls._instance.is_closed:
            cls._instance = httpx.AsyncClient(
                timeout=30.0,
                limits=httpx.Limits(
                    max_keepalive_connections=20,
                    max_connections=100,
                    keepalive_expiry=30.0
                ),
                http2=True  # Enable HTTP/2 for better performance
            )
            logger.info("Created new HTTP client with connection pooling")
        return cls._instance
    
    @classmethod
    async def close(cls):
        """Close the HTTP client"""
        if cls._instance is not None:
            await cls._instance.aclose()
            cls._instance = None
            logger.info("Closed HTTP client")


# Convenience function
async def get_http_client() -> httpx.AsyncClient:
    """Get HTTP client with connection pooling"""
    return await HTTPClientManager.get_client()
