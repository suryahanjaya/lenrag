"""
Simple in-memory cache for document metadata
Reduces redundant API calls to Google Drive
"""

from typing import Any, Optional, Dict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class SimpleCache:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self, ttl_seconds: int = 300):
        """
        Initialize cache
        
        Args:
            ttl_seconds: Time to live for cache entries (default: 5 minutes)
        """
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._ttl = timedelta(seconds=ttl_seconds)
        logger.info(f"Initialized cache with TTL: {ttl_seconds} seconds")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found or expired
        """
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        
        # Check if expired
        if datetime.now() > entry['expires_at']:
            # Remove expired entry
            del self._cache[key]
            logger.debug(f"Cache expired for key: {key}")
            return None
        
        logger.debug(f"Cache hit for key: {key}")
        return entry['value']
    
    def set(self, key: str, value: Any):
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache
        """
        self._cache[key] = {
            'value': value,
            'expires_at': datetime.now() + self._ttl,
            'created_at': datetime.now()
        }
        logger.debug(f"Cached value for key: {key}")
    
    def delete(self, key: str):
        """
        Delete value from cache
        
        Args:
            key: Cache key
        """
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Deleted cache for key: {key}")
    
    def clear(self):
        """Clear all cache entries"""
        count = len(self._cache)
        self._cache.clear()
        logger.info(f"Cleared {count} cache entries")
    
    def cleanup_expired(self):
        """Remove all expired entries"""
        now = datetime.now()
        expired_keys = [
            key for key, entry in self._cache.items()
            if now > entry['expires_at']
        ]
        
        for key in expired_keys:
            del self._cache[key]
        
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            'total_entries': len(self._cache),
            'ttl_seconds': self._ttl.total_seconds()
        }


# Global cache instances
document_metadata_cache = SimpleCache(ttl_seconds=300)  # 5 minutes
user_info_cache = SimpleCache(ttl_seconds=600)  # 10 minutes


def get_document_cache() -> SimpleCache:
    """Get document metadata cache"""
    return document_metadata_cache


def get_user_cache() -> SimpleCache:
    """Get user info cache"""
    return user_info_cache
