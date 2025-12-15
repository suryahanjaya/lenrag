import os
from fastapi import FastAPI, HTTPException, Depends, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
from dotenv import load_dotenv
import logging
import time

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from services.google_auth import GoogleAuthService
from services.google_docs import GoogleDocsService
from services.rag_pipeline import DORAPipeline
from config import settings, RAGConfig

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
# CORS Configuration - Environment-based
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")


# Configure logging - Production optimized
# Default to WARNING in production to reduce Railway log spam
environment = os.getenv("ENVIRONMENT", "development")
default_log_level = "WARNING" if environment == "production" else "INFO"
log_level = os.getenv("LOG_LEVEL", default_log_level).upper()

logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(levelname)s:%(name)s:%(message)s'
)
logger = logging.getLogger(__name__)

# Aggressively reduce verbosity of noisy loggers
logging.getLogger("httpx").setLevel(logging.ERROR)
logging.getLogger("httpcore").setLevel(logging.ERROR)
logging.getLogger("services.google_auth").setLevel(logging.WARNING)
logging.getLogger("services.google_docs").setLevel(logging.WARNING)
logging.getLogger("services.rag_pipeline").setLevel(logging.WARNING)
logging.getLogger("utils.http_client").setLevel(logging.ERROR)
logging.getLogger("utils.cache").setLevel(logging.WARNING)
logging.getLogger("chromadb").setLevel(logging.ERROR)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

app = FastAPI(title="DORA - Document Retrieval Assistant", version="2.0.0")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# CORS middleware
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

# Log configuration on startup (only in non-production)
if environment != "production":
    logger.info("=" * 60)
    logger.info("🚀 DORA BACKEND CONFIGURATION")
    logger.info("=" * 60)
    logger.info(f"📊 Environment: {settings.environment}")
    logger.info(f"🔧 Bulk Upload Batch Size: {settings.bulk_upload_batch_size} (parallel fetch)")
    logger.info(f"🧠 Embedding Batch Size: {settings.embedding_batch_size} (parallel embedding)")
    logger.info(f"📝 Chunk Size: {settings.chunk_size} characters")
    logger.info(f"🔄 Chunk Overlap: {settings.chunk_overlap} characters")
    logger.info(f"🤖 LLM Provider: {RAGConfig.LLM_PROVIDER}")
    logger.info(f"🎯 Primary Model: {RAGConfig.GROQ_MODEL if RAGConfig.LLM_PROVIDER == 'groq' else RAGConfig.GEMINI_MODEL}")
    logger.info(f"💾 ChromaDB Path: {settings.chroma_persist_directory}")
    logger.info(f"🌐 CORS Origins: {settings.cors_origins}")
    logger.info("=" * 60)
else:
    # Single line startup log for production
    logger.warning(f"DORA Backend Started - Env: {settings.environment}, Log Level: {log_level}")

# Simple in-memory cache for user info to prevent spamming Google API
# Format: {access_token: (user_info, expiration_timestamp)}
USER_INFO_CACHE = {}
CACHE_TTL = 300  # 5 minutes

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and get current user"""
    token = credentials.credentials
    
    # Check cache first
    current_time = time.time()
    if token in USER_INFO_CACHE:
        user_info, expires_at = USER_INFO_CACHE[token]
        if current_time < expires_at:
            return user_info
        else:
            # Expired, remove from cache
            del USER_INFO_CACHE[token]
            
    try:
        # Use Google Auth service to verify token
        user_info = await google_auth_service.get_user_info(token)
        
        # Cache the successful result
        USER_INFO_CACHE[token] = (user_info, current_time + CACHE_TTL)
        
        # Simple cache cleanup to prevent memory leaks
        if len(USER_INFO_CACHE) > 1000:
            USER_INFO_CACHE.clear()
            
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
@limiter.limit("5/minute")
async def authenticate_google(request: Request, auth_request: AuthRequest):
    """Exchange Google authorization code for tokens and create/update user"""
    try:
        logger.info("Received authentication request [token redacted]")
        
        # Exchange code for tokens
        tokens = await google_auth_service.exchange_code_for_tokens(auth_request.code)
        logger.info("Successfully exchanged code for tokens")
        
        # Get user info from Google
        user_info = await google_auth_service.get_user_info(tokens['access_token'])
        logger.info(f"Got user info for: {user_info.get('email')}")
        
        # Return user info and tokens
        return {
            "user": user_info,
            "access_token": tokens['access_token'],
            "refresh_token": tokens.get('refresh_token')
        }
    
    except Exception as e:
        logger.error(f"Google authentication error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/refresh", response_model=Dict[str, Any])
@limiter.limit("10/minute")
async def refresh_token(request: Request, refresh_request: Dict[str, str]):
    """Refresh access token using refresh token"""
    try:
        refresh_token = refresh_request.get('refresh_token')
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token required")
        
        logger.info("Refreshing access token")
        
        # Refresh the access token
        tokens = await google_auth_service.refresh_access_token(refresh_token)
        logger.info("Successfully refreshed access token")
        
        return {
            "access_token": tokens['access_token'],
            "expires_in": tokens.get('expires_in', 3600)
        }
    
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/documents", response_model=List[DocumentResponse])
async def get_user_documents(
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
        
        logger.info("Fetching documents for user [token redacted]")
        
        # Fetch documents from Google Drive (with error handling)
        try:
            documents = await google_docs_service.list_documents(access_token)
            logger.info(f"Successfully fetched {len(documents)} documents")
            return documents
        except Exception as api_error:
            logger.error(f"Google API error: {api_error}")
            
            # If it's an auth error, provide clear instructions
            if "401" in str(api_error) or "invalid" in str(api_error).lower():
                raise HTTPException(
                    status_code=401,
                    detail="Google access token is invalid or expired. Please sign out and sign in again with Google."
                )
            elif "403" in str(api_error) or "permission" in str(api_error).lower():
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions. Please re-authenticate and grant access to Google Drive."
                )
            else:
                # For other errors, return the actual error to help debug
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to fetch Google Docs: {str(api_error)}"
                )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching documents: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/documents/from-folder", response_model=List[DocumentResponse])
async def get_documents_from_folder(
    request: FolderRequest,
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Fetch documents from a specific Google Drive folder (public or private)"""
    try:
        # Get access token from header
        access_token = x_google_token
            
        logger.info(f"Fetching documents from folder: {request.folder_url}")
        
        # Fetch documents from the specific folder
        try:
            documents = await google_docs_service.list_documents_from_folder(
                request.folder_url, 
                access_token
            )
            logger.info(f"Successfully fetched {len(documents)} documents from folder")
            return documents
        except Exception as api_error:
            logger.error(f"Google API error: {api_error}")
            
            # If it's an auth error, provide clear instructions
            if "401" in str(api_error) or "invalid" in str(api_error).lower():
                raise HTTPException(
                    status_code=401,
                    detail="Google access token is invalid or expired. Please sign out and sign in again with Google."
                )
            elif "403" in str(api_error) or "permission" in str(api_error).lower():
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions or folder is not accessible. Please check if the folder is public or you have access to it."
                )
            else:
                # For other errors, return the actual error to help debug
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to fetch documents from folder: {str(api_error)}"
                )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching documents from folder: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/documents/from-folder-all", response_model=List[DocumentResponse])
async def get_all_documents_from_folder(
    request: FolderRequest,
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Fetch ALL documents from a folder and its subfolders (recursive)"""
    try:
        logger.info(f"=== ENDPOINT: /documents/from-folder-all ===")
        logger.info(f"Request: {request}")
        logger.info(f"Current user: {current_user}")
        logger.info(f"X-Google-Token: [REDACTED]")
        
        # Get access token from header
        access_token = x_google_token
        logger.info(f"Using token from header: {bool(access_token)}")
            
        logger.info(f"Final access token available: {bool(access_token)}")
        logger.info(f"Fetching ALL documents from folder: {request.folder_url}")
        
        # Fetch ALL documents from the folder and subfolders
        try:
            documents = await google_docs_service.list_all_documents_from_folder(
                request.folder_url, 
                access_token
            )
            logger.info(f"Successfully fetched {len(documents)} documents from folder and subfolders")
            return documents
        except Exception as api_error:
            logger.error(f"Google API error: {api_error}")
            logger.error(f"Error type: {type(api_error)}")
            logger.error(f"Error details: {str(api_error)}")
            
            # If it's an auth error, provide clear instructions
            if "401" in str(api_error) or "invalid" in str(api_error).lower():
                raise HTTPException(
                    status_code=401,
                    detail="Google access token is invalid or expired. Please sign out and sign in again with Google."
                )
            elif "403" in str(api_error) or "permission" in str(api_error).lower():
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions or folder is not accessible. Please check if the folder is public or you have access to it."
                )
            else:
                # For other errors, return the actual error to help debug
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to fetch documents from folder: {str(api_error)}"
                )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching all documents from folder: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@app.post("/documents/from-folder-all-stream")
async def get_all_documents_from_folder_stream(
    request: FolderRequest,
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """🚀 STREAMING: Fetch documents progressively - FEELS INSTANT!"""
    from fastapi.responses import StreamingResponse
    import json
    
    async def document_stream():
        """Stream documents as they are found - PROGRESSIVE LOADING!"""
        try:
            access_token = x_google_token
            folder_id = google_docs_service._extract_folder_id_from_url(request.folder_url)
            
            # Stream documents as they are found
            documents_buffer = []
            batch_size = 20  # Send every 20 documents
            
            async def stream_callback(doc):
                """Callback to stream documents progressively"""
                documents_buffer.append(doc)
                if len(documents_buffer) >= batch_size:
                    # Send batch
                    batch = documents_buffer.copy()
                    documents_buffer.clear()
                    yield f"data: {json.dumps(batch)}\n\n"
            
            # Fetch with streaming callback
            all_documents = []
            await google_docs_service._get_documents_recursive(
                folder_id, access_token, all_documents, ""
            )
            
            # Send documents in batches
            for i in range(0, len(all_documents), batch_size):
                batch = all_documents[i:i+batch_size]
                yield f"data: {json.dumps(batch)}\n\n"
            
            # Send completion signal
            yield f"data: {json.dumps({'done': True, 'total': len(all_documents)})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        document_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/documents/bulk-upload-parallel-stream")
async def bulk_upload_parallel_stream(
    request: FolderRequest,
    fastapi_req: Request,
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """🚀 ULTRA FAST: Parallel fetch (60) + Parallel embedding (5) + Real-time streaming!"""
    from fastapi.responses import StreamingResponse
    import json
    import asyncio
    
    logger.info("🚀 PARALLEL STREAM ENDPOINT CALLED!")
    logger.info(f"📁 Folder URL: {request.folder_url}")
    
    async def upload_stream():
        """Stream upload progress with parallel batch processing"""
        try:
            access_token = x_google_token
            if not access_token:
                yield f"data: {json.dumps({'error': 'No access token'})}\n\n"
                return
            
            user_id = current_user.get('sub', current_user.get('id', 'default_user'))
            
            # Step 1: Get all documents
            yield f"data: {json.dumps({'status': 'scanning', 'message': '🔍 Scanning folder...'})}\n\n"
            
            all_documents = await google_docs_service.list_all_documents_from_folder(request.folder_url, access_token)
            total = len(all_documents)
            
            if total == 0:
                yield f"data: {json.dumps({'status': 'error', 'error': 'No documents found'})}\n\n"
                return
            
            yield f"data: {json.dumps({'status': 'found', 'total': total, 'message': f'📊 Found {total} files - ULTRA FAST MODE: 60 parallel fetch + 15 parallel embedding!'})}\n\n"
            
            # Step 2: Process in PARALLEL BATCHES
            FETCH_BATCH_SIZE = settings.bulk_upload_batch_size  # 60 for fetch (Network Bound)
            EMBED_BATCH_SIZE = settings.embedding_batch_size  # 15 for Extraction & Embedding (CPU Bound)
            processed = 0
            failed = []
            
            async def fetch_raw_only(doc):
                """Fetch RAW content (bytes) without parsing. Fast!"""
                try:
                    doc_id = doc['id']
                    mime_type = doc.get('mimeType', doc.get('mime_type'))
                    
                    # New method that gets bytes but doesn't parse PDF/PPTX yet
                    result = await google_docs_service.download_document_raw(access_token, doc_id, mime_type)
                    
                    if result.get('error'):
                        return {'success': False, 'doc': doc, 'error': result['error']}
                    
                    return {
                        'success': True, 
                        'doc': doc, 
                        'raw_data': result['data'], 
                        'mime_type': result['mime_type'],
                        'is_binary': result['is_binary']
                    }
                except Exception as e:
                    return {'success': False, 'doc': doc, 'error': str(e)}

            # Process in batches
            for batch_start in range(0, total, FETCH_BATCH_SIZE):
                if await fastapi_req.is_disconnected():
                    logger.info("❌ Client disconnected, stopping upload")
                    return

                batch_end = min(batch_start + FETCH_BATCH_SIZE, total)
                batch = all_documents[batch_start:batch_end]
                batch_num = batch_start // FETCH_BATCH_SIZE + 1
                total_batches = (total + FETCH_BATCH_SIZE - 1) // FETCH_BATCH_SIZE
                
                yield f"data: {json.dumps({'status': 'batch_start', 'batch': batch_num, 'total_batches': total_batches, 'message': f'⚡ Batch {batch_num}/{total_batches}: Downloading {len(batch)} files (RAW)...'})}\n\n"
                
                # STEP 1: Fetch ALL RAW DATA in parallel (60 at once) - Network Bound (Fast)
                fetch_tasks = [fetch_raw_only(doc) for doc in batch]
                fetch_results = await asyncio.gather(*fetch_tasks, return_exceptions=True)
                
                # Filter successful fetches
                ready_for_processing = []
                for result in fetch_results:
                    if isinstance(result, Exception):
                        failed.append({'id': 'unknown', 'name': 'Unknown', 'error': str(result)})
                    elif result.get('success'):
                        ready_for_processing.append(result)
                    else:
                        failed.append(result)
                        yield f"data: {json.dumps({'status': 'failed', 'doc_name': result['doc']['name'], 'reason': result.get('error', 'Unknown')})}\n\n"
                
                yield f"data: {json.dumps({'status': 'fetched', 'message': f'✅ Downloaded {len(ready_for_processing)} files. Starting Batch Extraction & Embedding (15 at a time)...'})}\n\n"
                
                # STEP 2: Extract Text + Embed + Save (in groups of 15) - CPU/GPU Bound
                # This moves the heavy PPTX/PDF parsing to this smaller batch!
                
                for proc_start in range(0, len(ready_for_processing), EMBED_BATCH_SIZE):
                    if await fastapi_req.is_disconnected():
                        logger.info("❌ Client disconnected, stopping upload")
                        return
                    
                    proc_end = min(proc_start + EMBED_BATCH_SIZE, len(ready_for_processing))
                    proc_batch = ready_for_processing[proc_start:proc_end]
                    
                    logger.info(f"  🚀 Processing batch of {len(proc_batch)} files (Extract + Embed)...")
                    
                    try:
                        # a. Bulk Extraction (Parallel)
                        bulk_docs_input = []
                        valid_docs_map = {} # map id -> doc_info
                        
                        # Prepare tasks for extraction
                        extract_tasks = []
                        for item in proc_batch:
                            extract_tasks.append(
                                google_docs_service.extract_text_from_raw(item['raw_data'], item['mime_type'])
                            )
                        
                        # run extractions in parallel
                        extracted_texts = await asyncio.gather(*extract_tasks)
                        
                        # Prepare for embedding
                        for i, text in enumerate(extracted_texts):
                            item = proc_batch[i]
                            doc_info = item['doc']
                            
                            if not text or not text.strip():
                                failed.append({'id': doc_info['id'], 'name': doc_info['name'], 'error': 'Empty content after extraction'})
                                continue
                                
                            bulk_docs_input.append({
                                'id': doc_info['id'], 
                                'content': text,
                                'name': doc_info['name'],
                                'mime_type': doc_info.get('mimeType', doc_info.get('mime_type'))
                            })
                            valid_docs_map[doc_info['id']] = doc_info

                        if not bulk_docs_input:
                            continue

                        # b. Bulk Embedding & Saving
                        # TIMEOUT INCREASED: 130k+ chunks can take 10+ minutes. Setting to 30 mins (1800s) to be safe.
                        bulk_results = await asyncio.wait_for(
                            dora_pipeline.add_documents_bulk(user_id, bulk_docs_input),
                            timeout=1800.0
                        )
                        
                        # Call the new BULK method
                        # 5 minute timeout per bulk batch
                        bulk_results = await asyncio.wait_for(
                            dora_pipeline.add_documents_bulk(user_id, bulk_docs_input),
                            timeout=300.0
                        )
                        
                        logger.info(f"  ✅ Bulk process finished: {len(bulk_results)} docs saved")
                        
                        # Stream results for each document in the batch
                        for doc_id, doc_info in valid_docs_map.items():
                            if doc_id in bulk_results:
                                chunks_count = bulk_results[doc_id]['chunks']
                                if bulk_results[doc_id]['success']:
                                    processed += 1
                                    yield f"data: {json.dumps({'status': 'saved', 'current': processed, 'total': total, 'processed': processed, 'doc_name': doc_info['name'], 'doc_id': doc_id, 'chunks': chunks_count, 'percentage': int((processed/total)*100)})}\n\n"
                                else:
                                    failed.append({'id': doc_id, 'name': doc_info['name'], 'error': bulk_results[doc_id].get('error', 'Unknown error')})
                                    yield f"data: {json.dumps({'status': 'failed', 'doc_name': doc_info['name'], 'reason': bulk_results[doc_id].get('error', 'Unknown error')})}\n\n"
                            else:
                                failed.append({'id': doc_id, 'name': doc_info['name'], 'error': 'Processing failed'})
                                yield f"data: {json.dumps({'status': 'failed', 'doc_name': doc_info['name'], 'reason': 'Processing failed'})}\n\n"

                    except asyncio.TimeoutError:
                        logger.error(f"❌ Batch embedding TIMED OUT after 1800s!")
                        for item in proc_batch:
                            doc_info = item['doc']
                            failed.append({'id': doc_info['id'], 'name': doc_info['name'], 'error': 'Bulk processing timed out'})
                            yield f"data: {json.dumps({'status': 'failed', 'doc_name': doc_info['name'], 'reason': 'Bulk processing timed out'})}\n\n"
                    except Exception as e:
                        logger.error(f"❌ Batch embedding error: {e}")
                        import traceback
                        logger.error(traceback.format_exc())
                        for item in proc_batch:
                            doc_info = item['doc']
                            failed.append({'id': doc_info['id'], 'name': doc_info['name'], 'error': str(e)})
                            yield f"data: {json.dumps({'status': 'failed', 'doc_name': doc_info['name'], 'reason': str(e)})}\n\n"
                    
                    # Small breath for event loop
                    await asyncio.sleep(0.1)
                
                yield f"data: {json.dumps({'status': 'batch_complete', 'batch': batch_num, 'processed': processed, 'total': total, 'message': f'✅ Batch {batch_num}/{total_batches} complete: {processed}/{total} files'})}\n\n"
            
            # Send completion
            yield f"data: {json.dumps({'status': 'complete', 'processed': processed, 'total': total, 'failed': len(failed), 'message': f'{processed}/{total} files uploaded'})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming upload error: {e}")
            yield f"data: {json.dumps({'status': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        upload_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/documents/add")
async def add_documents_to_knowledge_base(
    request: AddDocumentsRequest,
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Add selected documents to the user's knowledge base"""
    try:
        # Get user's Google access token
        # Get access token from header
        access_token = x_google_token
            
        if not access_token:
            raise HTTPException(status_code=400, detail="Google access token not found")
        
        # Process documents and add to vector store
        processed_count = 0
        failed_documents = []
        
        user_id = current_user.get('sub', current_user.get('id', 'default_user'))
        logger.info(f"📁 BULK UPLOAD: Processing {len(request.document_ids)} documents for user {user_id}")
        
        # Check if this is a bulk upload (multiple documents)
        is_bulk_upload = len(request.document_ids) > 1
        
        if is_bulk_upload:
            logger.info(f"📁 BULK UPLOAD DETECTED: Processing {len(request.document_ids)} documents without re-fetching metadata")
            # For bulk upload, we don't need to fetch all documents metadata
            # We'll get metadata for each document individually to avoid unnecessary API calls
            documents_lookup = {}
        else:
            # OPTIMIZATION: Get all documents metadata ONCE at the beginning for single document
            logger.info("🚀 OPTIMIZATION: Fetching all documents metadata once...")
            all_documents = await google_docs_service.list_documents(access_token)
            logger.info(f"📊 Fetched {len(all_documents)} documents metadata")
            
            # Create a lookup dictionary for faster access
            documents_lookup = {doc['id']: doc for doc in all_documents}
            logger.info("📊 Created documents lookup dictionary")
        
        for i, doc_id in enumerate(request.document_ids, 1):
            try:
                if is_bulk_upload:
                    logger.info(f"📄 [{i}/{len(request.document_ids)}] Processing document {doc_id}")
                else:
                    logger.info(f"📄 Processing document {doc_id}")
                
                # Get document metadata
                if is_bulk_upload:
                    # For bulk upload, get metadata for each document individually
                    doc_metadata = await google_docs_service.get_document_metadata(access_token, doc_id)
                    if not doc_metadata:
                        logger.warning(f"⚠️ Document {doc_id} not found in user's documents")
                        failed_documents.append({"id": doc_id, "error": "Not found in user's documents"})
                        continue
                else:
                    # Use cached metadata for single document
                    doc_metadata = documents_lookup.get(doc_id)
                    if not doc_metadata:
                        logger.warning(f"⚠️ Document {doc_id} not found in user's documents")
                        failed_documents.append({"id": doc_id, "error": "Not found in user's documents"})
                        continue
                
                logger.info(f"📄 Document {doc_id}: {doc_metadata.get('name', 'Unknown')}")
                
                # Get document content (this will automatically detect the MIME type)
                content = await google_docs_service.get_document_content(access_token, doc_id)
                
                content_len = len(content.strip()) if content else 0
                logger.info(f"📄 Extracted content length: {content_len} characters")
                
                if not content or content_len < 10:
                    logger.warning(f"⚠️ Document {doc_id} has very little content: '{content[:50] if content else ''}...'")
                    failed_documents.append({"id": doc_id, "error": f"Very little content ({content_len} chars)"})
                    continue
                
                # Add to DORA pipeline with metadata
                chunks_added = await dora_pipeline.add_document(
                    user_id=user_id,
                    document_id=doc_id,
                    content=content,
                    document_name=doc_metadata.get('name', f'Document {doc_id[:8]}'),
                    mime_type=doc_metadata.get('mime_type', 'unknown')
                )
                
                if chunks_added > 0:
                    if is_bulk_upload:
                        logger.info(f"✅ [{i}/{len(request.document_ids)}] Successfully added document {doc_id} to knowledge base ({chunks_added} chunks)")
                    else:
                        logger.info(f"✅ Successfully added document {doc_id} to knowledge base ({chunks_added} chunks)")
                    processed_count += 1
                else:
                    logger.warning(f"⚠️ Failed to generate chunks for document {doc_id}")
                    failed_documents.append({"id": doc_id, "error": "No chunks generated (possible empty or unreadable content)"})
                    
            except Exception as e:
                logger.error(f"❌ Failed to process document {doc_id}: {e}", exc_info=True)
                failed_documents.append({"id": doc_id, "error": str(e)})
        
        logger.info(f"📊 BULK UPLOAD RESULT: {processed_count} successful, {len(failed_documents)} failed")
        if failed_documents:
            logger.error(f"❌ Failed documents: {failed_documents}")
        
        return {
            "message": f"Successfully added {processed_count} documents to knowledge base",
            "processed_count": processed_count,
            "total_requested": len(request.document_ids),
            "failed_documents": failed_documents
        }
    
    except Exception as e:
        logger.error(f"Error adding documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat_with_documents(
    request: ChatRequest,
    current_user = Depends(get_current_user)
):
    """Chat with the DORA system"""
    try:
        # Query the DORA pipeline
        user_id = current_user.get('sub', current_user.get('id', 'default_user'))
        response = await dora_pipeline.query(
            user_id=user_id,
            query=request.message,
            use_fallback=True
        )
        
        return ChatResponse(
            message=response['answer'],
            sources=response.get('sources', []),
            from_documents=response.get('from_documents', False),
            fallback_used=response.get('fallback_used', False)
        )
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/profile", response_model=UserProfile)
async def get_user_profile(current_user = Depends(get_current_user)):
    """Get user profile information"""
    try:
        # Get user profile from current_user
        profile = {
            "id": current_user.get('sub'),
            "email": current_user.get('email'),
            "name": current_user.get('name'),
            "picture": current_user.get('picture')
        }
        return profile
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/knowledge-base/{doc_id}")
async def delete_single_document(
    doc_id: str,
    current_user = Depends(get_current_user)
):
    """Delete a single document from knowledge base"""
    try:
        user_id = current_user.get('sub', current_user.get('id', 'default_user'))
        logger.info(f"Deleting document {doc_id} for user {user_id}")
        
        # Use existing remove_document method from DORAPipeline
        success = await dora_pipeline.remove_document(user_id, doc_id)
        
        if success:
            logger.info(f"Successfully deleted document {doc_id}")
            return {"message": "Document deleted successfully", "document_id": doc_id}
        else:
            logger.warning(f"Document {doc_id} not found")
            raise HTTPException(status_code=404, detail="Document not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {doc_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/clear-all-documents")
async def clear_all_documents(
    current_user = Depends(get_current_user)
):
    """Clear all documents from the user's knowledge base - ULTRA FAST!"""
    try:
        user_id = current_user.get('sub', current_user.get('id', 'default_user'))
        collection_name = f"user_{user_id}"
        
        logger.info(f"CLEAR ALL ENDPOINT CALLED FOR USER: {user_id}")
        
        # Get count for user feedback (minimal overhead)
        chunk_count = 0
        try:
            collection = dora_pipeline._get_user_collection(user_id)
            chunk_count = collection.count()
            
            if chunk_count == 0:
                logger.info("Knowledge base is already empty")
                return {"message": "Knowledge base is already empty", "cleared_count": 0}
            
            logger.info(f"Deleting {chunk_count} chunks for user {user_id}")
        except Exception as e:
            logger.warning(f"Could not get count: {e}, proceeding with delete anyway")
        
        # FAST: Delete entire collection and recreate
        dora_pipeline.chroma_client.delete_collection(collection_name)
        logger.info(f"Deleted collection: {collection_name}")
        
        # Recreate collection
        dora_pipeline.chroma_client.create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"Recreated collection: {collection_name}")
        logger.info(f"Successfully cleared {chunk_count} chunks")
        
        return {
            "message": "Knowledge base cleared successfully",
            "total_chunks_removed": chunk_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/health")
async def health_check():
    """Lightweight health check endpoint - optimized to not interfere with heavy operations"""
    # Simple status check without testing ChromaDB to avoid resource contention
    # during embedding operations
    return {
        "status": "healthy",
        "services": {
            "api": "operational"
        }
    }

@app.get("/database-stats")
async def get_database_stats(current_user = Depends(get_current_user)):
    """Get database statistics for monitoring large scale operations"""
    try:
        user_id = current_user.get('sub', current_user.get('id', 'default_user'))
        stats = await dora_pipeline.get_database_stats(user_id)
        return stats
    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/auth-status")
async def check_auth_status():
    """Check authentication configuration"""
    return {
        "google_client_id_configured": bool(os.getenv("GOOGLE_CLIENT_ID")),
        "google_client_secret_configured": bool(os.getenv("GOOGLE_CLIENT_SECRET")),
        "gemini_api_configured": bool(os.getenv("GEMINI_API_KEY")),
        "oauth_redirect_uri": "http://localhost:3000/auth/callback",
        "instructions": [
            "1. Go to http://localhost:3000",
            "2. Click 'Sign in with Google'", 
            "3. Complete OAuth authorization",
            "4. Go to Documents tab to see your Google Docs"
        ]
    }

@app.get("/test-token")
async def test_google_token(
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Test endpoint to verify Google token"""
    try:
        if not x_google_token:
            return {"error": "No Google token provided", "received_token": None}
        
        # Test the token with a simple Google API call
        url = "https://www.googleapis.com/oauth2/v1/tokeninfo"
        params = {"access_token": x_google_token}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
        
        if response.status_code == 200:
            token_info = response.json()
            return {
                "status": "valid",
                "token_length": len(x_google_token),
                "token_info": {
                    "scope": token_info.get("scope"),
                    "expires_in": token_info.get("expires_in"),
                    "email": token_info.get("email")
                }
            }
        else:
            return {
                "status": "invalid", 
                "error": response.text,
                "token_length": len(x_google_token)
            }
            
    except Exception as e:
        return {"error": str(e), "token_received": x_google_token is not None}

@app.post("/test-folder-access")
async def test_folder_access(
    request: FolderRequest,
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Test access to a specific Google Drive folder"""
    try:
        if not x_google_token:
            return {"error": "No Google token provided"}
        
        logger.info(f"Testing folder access: {request.folder_url}")
        
        # Test the folder access
        documents = await google_docs_service.list_documents_from_folder(
            request.folder_url, 
            x_google_token
        )
        
        return {
            "status": "success",
            "folder_url": request.folder_url,
            "documents_found": len(documents),
            "sample_documents": documents[:3] if documents else [],
            "token_info": {
                "length": len(x_google_token),
                "prefix": x_google_token[:30]
            }
        }
            
    except Exception as e:
        logger.error(f"Folder access test error: {e}")
        return {"error": str(e), "folder_url": request.folder_url}

@app.get("/test-google-docs-service")
async def test_google_docs_service(
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Test the Google Docs service directly"""
    try:
        if not x_google_token:
            return {"error": "No Google token provided"}
        
        logger.info(f"Testing Google Docs service with token: {x_google_token[:20]}...")
        
        # Test the Google Docs service
        documents = await google_docs_service.list_documents(x_google_token)
        
        return {
            "status": "success",
            "documents_found": len(documents),
            "sample_documents": documents[:3] if documents else [],
            "token_info": {
                "length": len(x_google_token),
                "prefix": x_google_token[:30]
            }
        }
            
    except Exception as e:
        logger.error(f"Google Docs service test error: {e}")
        return {"error": str(e), "token_received": x_google_token is not None}

@app.get("/test-drive-direct")
async def test_drive_api_direct(
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Test Google Drive API directly without validation"""
    try:
        if not x_google_token:
            return {"error": "No Google token provided"}
        
        logger.info(f"Testing Drive API with token: {x_google_token[:20]}...")
        
        # Test Google Drive API directly with the fixed query
        url = "https://www.googleapis.com/drive/v3/files"
        params = {
            'q': ("(mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or "
                  "mimeType='application/pdf' or "
                  "mimeType='text/plain' or "
                  "mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation' or "
                  "mimeType='application/vnd.google-apps.document' or "
                  "mimeType='application/vnd.google-apps.presentation') and "
                  "trashed=false"),
            'pageSize': 10,
            'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType)'
        }
        
        headers = {
            'Authorization': f'Bearer {x_google_token}',
            'Content-Type': 'application/json'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
        
        result = {
            "status_code": response.status_code,
            "response": response.json() if response.status_code == 200 else response.text,
            "token_format": {
                "length": len(x_google_token),
                "starts_with_ya29": x_google_token.startswith('ya29.'),
                "starts_with_1": x_google_token.startswith('1//'),
                "prefix": x_google_token[:30]
            }
        }
        
        # If no files found, try a broader search
        if response.status_code == 200:
            data = response.json()
            files = data.get('files', [])
            if len(files) == 0:
                logger.info("No files found with specific query, trying broader search...")
                broader_params = {
                    'q': 'trashed=false',
                    'pageSize': 10,
                    'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType)'
                }
                
                async with httpx.AsyncClient() as client:
                    broader_response = await client.get(url, params=broader_params, headers=headers)
                
                if broader_response.status_code == 200:
                    broader_data = broader_response.json()
                    result["broader_search"] = {
                        "status_code": broader_response.status_code,
                        "files_found": len(broader_data.get('files', [])),
                        "sample_files": broader_data.get('files', [])[:3]  # First 3 files
                    }
        
        logger.info(f"Drive API test result: {result}")
        return result
            
    except Exception as e:
        logger.error(f"Drive API test error: {e}")
        return {"error": str(e)}


@app.get("/knowledge-base")
async def get_knowledge_base_documents(current_user = Depends(get_current_user)):
    """Get actual documents in the knowledge base with metadata"""
    try:
        user_id = current_user.get('sub', current_user.get('id', 'default_user'))
        collection = dora_pipeline._get_user_collection(user_id)
        
        # Get all documents in the knowledge base
        all_docs = collection.get()
        
        logger.info(f"=== KNOWLEDGE BASE REQUEST FOR USER {user_id} ===")
        
        # Check if collection is actually empty
        if len(all_docs.get('ids', [])) == 0:
            logger.info("✅ COLLECTION IS EMPTY - Returning empty documents list")
            return {"documents": []}
        
        # Extract unique document IDs and their metadata
        document_metadata = {}
        for i, chunk_id in enumerate(all_docs.get('ids', [])):
            metadata = all_docs.get('metadatas', [])[i] if i < len(all_docs.get('metadatas', [])) else {}
            
            # Get document_id from metadata, not chunk_id
            doc_id = metadata.get('document_id') if metadata else None
            
            if doc_id:
                if doc_id not in document_metadata:
                    document_metadata[doc_id] = {
                        "id": doc_id,
                        "name": metadata.get('document_name', f'Document {doc_id[:8]}'),
                        "mime_type": metadata.get('mime_type', 'unknown'),
                        "chunk_count": 1
                    }
                else:
                    document_metadata[doc_id]["chunk_count"] += 1
        
        logger.info(f"Found {len(document_metadata)} unique documents in knowledge base")
        
        # Convert to list
        documents = list(document_metadata.values())
        
        return {
            "documents": documents,
            "total_documents": len(documents),
            "total_chunks": len(all_docs.get('ids', [])),
            "debug_info": {
                "raw_chunks": len(all_docs.get('ids', [])),
                "unique_documents": len(document_metadata)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting knowledge base documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)