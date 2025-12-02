import os
from fastapi import FastAPI, HTTPException, Depends, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
from dotenv import load_dotenv
import logging

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from services.google_auth import GoogleAuthService
from services.google_docs import GoogleDocsService
from services.rag_pipeline import DORAPipeline
from models.schemas import (
    AuthRequest, 
    DocumentResponse, 
    ChatRequest, 
    ChatResponse,
    AddDocumentsRequest,
    UserProfile,
    FolderRequest
)

load_dotenv()

# Import config if available, otherwise use defaults
try:
    from config import settings
    ALLOWED_ORIGINS = settings.cors_origins
    RATE_LIMIT = f"{settings.rate_limit_per_minute}/minute"
    AUTH_RATE_LIMIT = f"{settings.auth_rate_limit_per_minute}/minute"
    ENVIRONMENT = settings.environment
except ImportError:
    logging.warning("Config module not found, using default settings")
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    RATE_LIMIT = "60/minute"
    AUTH_RATE_LIMIT = "5/minute"
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="DORA - Document Retrieval Assistant", version="2.0.0")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - now using environment variables
logger.info(f"Configuring CORS with origins: {ALLOWED_ORIGINS}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize services
google_auth_service = GoogleAuthService()
google_docs_service = GoogleDocsService()
dora_pipeline = DORAPipeline()

# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with user-friendly messages"""
    logger.error(f"Validation error on {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Invalid request data",
            "errors": exc.errors() if ENVIRONMENT != "production" else "Invalid input"
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.error(f"HTTP error on {request.url}: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors"""
    logger.error(f"Unexpected error on {request.url}: {exc}", exc_info=True)
    
    # Don't expose internal errors in production
    if ENVIRONMENT == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)}
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and get current user"""
    try:
        token = credentials.credentials
        # Use Google Auth service to verify token
        user_info = await google_auth_service.get_user_info(token)
        return user_info
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

@app.get("/")
async def root():
    return {"message": "DORA - Document Retrieval Assistant API is running"}

@app.post("/auth/google", response_model=Dict[str, Any])
@limiter.limit(AUTH_RATE_LIMIT)
async def authenticate_google(request: Request, auth_request: AuthRequest):
    """Exchange Google authorization code for tokens and create/update user"""
    try:
        # SECURITY FIX: Don't log sensitive tokens
        logger.info("Received authentication request [token redacted]")
        
        # Exchange code for tokens
        tokens = await google_auth_service.exchange_code_for_tokens(auth_request.code)
        logger.info(f"Successfully exchanged code for tokens")
        
        # Get user info from Google
        user_info = await google_auth_service.get_user_info(tokens['access_token'])
        logger.info(f"Got user info for: {user_info.get('email')}")
        
        # Return user info and tokens (no Supabase integration)
        return {
            "user": user_info,
            "access_token": tokens['access_token'],
            "refresh_token": tokens.get('refresh_token')
        }
    
    except ValueError as e:
        logger.error(f"Validation error during authentication: {e}")
        raise HTTPException(status_code=400, detail="Invalid authentication data")
    except httpx.HTTPError as e:
        logger.error(f"External API error during authentication: {e}")
        raise HTTPException(status_code=502, detail="Failed to authenticate with Google")
    except Exception as e:
        logger.error(f"Google authentication error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Authentication failed")

@app.get("/documents", response_model=List[DocumentResponse])
@limiter.limit(RATE_LIMIT)
async def get_user_documents(
    request: Request,
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Fetch all Google Docs for the authenticated user"""
    try:
        # Get access token from header
        access_token = x_google_token
            
        if not access_token:
            raise HTTPException(
                status_code=400, 
                detail="Google access token not found. Please ensure you're properly authenticated with Google."
            )
        
        # SECURITY FIX: Don't log tokens
        logger.info("Fetching documents for user [token redacted]")
        
        # Fetch documents from Google Drive (with error handling)
        try:
            documents = await google_docs_service.list_documents(access_token)
            logger.info(f"Successfully fetched {len(documents)} documents")
            return documents
        except httpx.HTTPStatusError as api_error:
            logger.error(f"Google API error: {api_error.response.status_code}")
            
            # If it's an auth error, provide clear instructions
            if api_error.response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Google access token is invalid or expired. Please sign out and sign in again with Google."
                )
            elif api_error.response.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions. Please re-authenticate and grant access to Google Drive."
                )
            else:
                raise HTTPException(
                    status_code=502,
                    detail="Failed to fetch documents from Google Drive"
                )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching documents: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch documents")

@app.post("/documents/from-folder", response_model=List[DocumentResponse])
@limiter.limit(RATE_LIMIT)
async def get_documents_from_folder(
    request_obj: Request,
    folder_request: FolderRequest,
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Fetch documents from a specific Google Drive folder (public or private)"""
    try:
        # Get access token from header
        access_token = x_google_token
            
        logger.info(f"Fetching documents from folder: {folder_request.folder_url}")
        
        # Fetch documents from the specific folder
        try:
            documents = await google_docs_service.list_documents_from_folder(
                folder_request.folder_url, 
                access_token
            )
            logger.info(f"Successfully fetched {len(documents)} documents from folder")
            return documents
        except httpx.HTTPStatusError as api_error:
            logger.error(f"Google API error: {api_error.response.status_code}")
            
            # If it's an auth error, provide clear instructions
            if api_error.response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Google access token is invalid or expired. Please sign out and sign in again with Google."
                )
            elif api_error.response.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions or folder is not accessible. Please check if the folder is public or you have access to it."
                )
            else:
                raise HTTPException(
                    status_code=502,
                    detail="Failed to fetch documents from folder"
                )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching documents from folder: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch folder documents")
