"""
Comprehensive health check endpoints
Monitors all critical dependencies
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import httpx
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


async def check_chromadb() -> Dict[str, Any]:
    """Check ChromaDB connection"""
    try:
        from services.rag_pipeline import DORAPipeline
        pipeline = DORAPipeline()
        # Try to get collection
        collection = pipeline._get_user_collection("health_check")
        return {
            "status": "healthy",
            "message": "ChromaDB is accessible",
            "details": {
                "collection_accessible": True
            }
        }
    except Exception as e:
        logger.error(f"ChromaDB health check failed: {e}")
        return {
            "status": "unhealthy",
            "message": f"ChromaDB error: {str(e)}",
            "details": {
                "error": str(e)
            }
        }


async def check_gemini_api() -> Dict[str, Any]:
    """Check Gemini API connection"""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {
                "status": "unhealthy",
                "message": "Gemini API key not configured",
                "details": {
                    "configured": False
                }
            }
        
        # Simple check - just verify key exists
        return {
            "status": "healthy",
            "message": "Gemini API key configured",
            "details": {
                "configured": True,
                "key_length": len(api_key)
            }
        }
    except Exception as e:
        logger.error(f"Gemini API health check failed: {e}")
        return {
            "status": "unhealthy",
            "message": f"Gemini API error: {str(e)}",
            "details": {
                "error": str(e)
            }
        }


async def check_google_oauth() -> Dict[str, Any]:
    """Check Google OAuth configuration"""
    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        
        if not client_id or not client_secret:
            return {
                "status": "unhealthy",
                "message": "Google OAuth not fully configured",
                "details": {
                    "client_id_configured": bool(client_id),
                    "client_secret_configured": bool(client_secret)
                }
            }
        
        return {
            "status": "healthy",
            "message": "Google OAuth configured",
            "details": {
                "client_id_configured": True,
                "client_secret_configured": True
            }
        }
    except Exception as e:
        logger.error(f"Google OAuth health check failed: {e}")
        return {
            "status": "unhealthy",
            "message": f"Google OAuth error: {str(e)}",
            "details": {
                "error": str(e)
            }
        }


@router.get("")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "DORA API"
    }


@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check for all dependencies"""
    
    # Check all dependencies
    chromadb_health = await check_chromadb()
    gemini_health = await check_gemini_api()
    oauth_health = await check_google_oauth()
    
    # Determine overall status
    all_healthy = all([
        chromadb_health["status"] == "healthy",
        gemini_health["status"] == "healthy",
        oauth_health["status"] == "healthy"
    ])
    
    overall_status = "healthy" if all_healthy else "degraded"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now().isoformat(),
        "service": "DORA API",
        "dependencies": {
            "chromadb": chromadb_health,
            "gemini_api": gemini_health,
            "google_oauth": oauth_health
        },
        "environment": {
            "python_version": os.sys.version,
            "environment": os.getenv("ENVIRONMENT", "development")
        }
    }


@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe"""
    chromadb_health = await check_chromadb()
    
    if chromadb_health["status"] != "healthy":
        raise HTTPException(status_code=503, detail="Service not ready")
    
    return {
        "status": "ready",
        "timestamp": datetime.now().isoformat()
    }


@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {
        "status": "alive",
        "timestamp": datetime.now().isoformat()
    }
