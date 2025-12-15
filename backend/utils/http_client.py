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
        """Get or create HTTP client - ULTRA EXTREME PERFORMANCE for maximum speed"""
        if cls._instance is None or cls._instance.is_closed:
            cls._instance = httpx.AsyncClient(
                # Ultra-fast timeouts but safe for large files
                timeout=httpx.Timeout(
                    connect=10.0,     # Safer connection timeout (was 3.0)
                    read=120.0,       # MUCH longer read for large PDFs (was 30.0)
                    write=10.0,       # Write timeout
                    pool=10.0         # Safer pool timeout (was 3.0)
                ),
                limits=httpx.Limits(
                    # ULTRA EXTREME: Maximum possible connections
                    max_keepalive_connections=500,  # Was 200, now 500!
                    max_connections=2000,           # Was 1000, now 2000!!
                    keepalive_expiry=180.0          # Keep alive for 3 minutes
                ),
                http2=True,  # Enable HTTP/2 for multiplexing
                follow_redirects=True,
                # Aggressive retry for reliability
                transport=httpx.AsyncHTTPTransport(
                    retries=5,  # Increased from 3 to 5 retries
                )
            )
            # Only log once at debug level to avoid spam
            logger.debug(\"HTTP client initialized with connection pooling (2000 max connections, HTTP/2 enabled)\")
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
