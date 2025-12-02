"""
Prometheus monitoring integration
Tracks metrics for API performance and health
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
from fastapi.routing import APIRoute
from typing import Callable
import time
import logging

logger = logging.getLogger(__name__)

# Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

http_requests_in_progress = Gauge(
    'http_requests_in_progress',
    'HTTP requests currently in progress',
    ['method', 'endpoint']
)

# Document processing metrics
documents_processed_total = Counter(
    'documents_processed_total',
    'Total documents processed',
    ['status']  # success or failure
)

documents_processing_duration_seconds = Histogram(
    'documents_processing_duration_seconds',
    'Document processing duration in seconds'
)

# RAG metrics
rag_queries_total = Counter(
    'rag_queries_total',
    'Total RAG queries',
    ['status']
)

rag_query_duration_seconds = Histogram(
    'rag_query_duration_seconds',
    'RAG query duration in seconds'
)

# Cache metrics
cache_hits_total = Counter(
    'cache_hits_total',
    'Total cache hits'
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total cache misses'
)


class PrometheusMiddleware:
    """Middleware to track HTTP metrics"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        method = scope["method"]
        path = scope["path"]
        
        # Skip metrics endpoint
        if path == "/metrics":
            await self.app(scope, receive, send)
            return
        
        # Track in-progress requests
        http_requests_in_progress.labels(method=method, endpoint=path).inc()
        
        # Track request duration
        start_time = time.time()
        
        try:
            await self.app(scope, receive, send)
        finally:
            # Record metrics
            duration = time.time() - start_time
            http_request_duration_seconds.labels(
                method=method,
                endpoint=path
            ).observe(duration)
            
            http_requests_in_progress.labels(
                method=method,
                endpoint=path
            ).dec()


def metrics_endpoint():
    """Endpoint to expose Prometheus metrics"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


# Utility functions for tracking custom metrics

def track_document_processing(success: bool, duration: float):
    """Track document processing metrics"""
    status = "success" if success else "failure"
    documents_processed_total.labels(status=status).inc()
    documents_processing_duration_seconds.observe(duration)


def track_rag_query(success: bool, duration: float):
    """Track RAG query metrics"""
    status = "success" if success else "failure"
    rag_queries_total.labels(status=status).inc()
    rag_query_duration_seconds.observe(duration)


def track_cache_hit():
    """Track cache hit"""
    cache_hits_total.inc()


def track_cache_miss():
    """Track cache miss"""
    cache_misses_total.inc()
