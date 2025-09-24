import os
from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
from dotenv import load_dotenv
import logging

from services.google_auth import GoogleAuthService
from services.google_docs import GoogleDocsService
from services.rag_pipeline import RAGPipeline
from services.supabase_client import SupabaseClient
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="RAG Chatbot with Google Docs", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize services
google_auth_service = GoogleAuthService()
google_docs_service = GoogleDocsService()
rag_pipeline = RAGPipeline()
supabase_client = SupabaseClient()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and get current user"""
    try:
        token = credentials.credentials
        user_data = await supabase_client.verify_token(token)
        return user_data
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

@app.get("/")
async def root():
    return {"message": "RAG Chatbot API is running"}

@app.post("/auth/google", response_model=Dict[str, Any])
async def authenticate_google(request: AuthRequest):
    """Exchange Google authorization code for tokens and create/update user"""
    try:
        logger.info(f"Received auth code: {request.code[:20]}...")
        
        # Exchange code for tokens
        tokens = await google_auth_service.exchange_code_for_tokens(request.code)
        logger.info(f"Received tokens: access_token length={len(tokens.get('access_token', ''))}, has_refresh_token={bool(tokens.get('refresh_token'))}")
        
        # Get user info from Google
        user_info = await google_auth_service.get_user_info(tokens['access_token'])
        logger.info(f"Got user info for: {user_info.get('email')}")
        
        # Create or update user in Supabase
        supabase_user = await supabase_client.create_or_update_user(
            user_info, tokens['access_token'], tokens.get('refresh_token')
        )
        
        return {
            "user": supabase_user,
            "access_token": tokens['access_token'],
            "refresh_token": tokens.get('refresh_token')
        }
    
    except Exception as e:
        logger.error(f"Google authentication error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/documents", response_model=List[DocumentResponse])
async def get_user_documents(
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Fetch all Google Docs for the authenticated user"""
    try:
        # Try to get access token from Supabase first
        access_token = await supabase_client.get_user_google_token(current_user['id'])
        
        # If no token in Supabase (development mode), use token from header
        if not access_token:
            access_token = x_google_token
            
        if not access_token:
            raise HTTPException(
                status_code=400, 
                detail="Google access token not found. Please ensure you're properly authenticated with Google."
            )
        
        logger.info(f"Attempting to fetch documents with token: {access_token[:20]}...")
        
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
        # Try to get access token from Supabase first
        access_token = await supabase_client.get_user_google_token(current_user['id'])
        
        # If no token in Supabase (development mode), use token from header
        if not access_token:
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
        logger.info(f"X-Google-Token: {x_google_token}")
        
        # Try to get access token from Supabase first
        access_token = await supabase_client.get_user_google_token(current_user['id'])
        logger.info(f"Access token from Supabase: {bool(access_token)}")
        
        # If no token in Supabase (development mode), use token from header
        if not access_token:
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

@app.get("/documents/hierarchy")
async def get_documents_hierarchy(
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Fetch Google Drive documents and folders with hierarchy structure"""
    try:
        # Try to get access token from Supabase first
        access_token = await supabase_client.get_user_google_token(current_user['id'])
        
        # If no token in Supabase (development mode), use token from header
        if not access_token:
            access_token = x_google_token
            
        if not access_token:
            raise HTTPException(
                status_code=400, 
                detail="Google access token not found. Please ensure you're properly authenticated with Google."
            )
        
        logger.info(f"Attempting to fetch folder hierarchy with token: {access_token[:20]}...")
        
        # Fetch folder hierarchy from Google Drive
        try:
            hierarchy = await google_docs_service.get_folder_hierarchy(access_token)
            logger.info(f"Successfully fetched hierarchy: {len(hierarchy['folders'])} folders, {len(hierarchy['documents'])} documents")
            return hierarchy
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
                    detail=f"Failed to fetch Google Drive hierarchy: {str(api_error)}"
                )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching folder hierarchy: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/documents/add")
async def add_documents_to_knowledge_base(
    request: AddDocumentsRequest,
    x_google_token: Optional[str] = Header(None),
    current_user = Depends(get_current_user)
):
    """Add selected documents to the user's knowledge base"""
    try:
        # Get user's Google access token
        access_token = await supabase_client.get_user_google_token(current_user['id'])
        
        # If no token in Supabase (development mode), use token from header
        if not access_token:
            access_token = x_google_token
            
        if not access_token:
            raise HTTPException(status_code=400, detail="Google access token not found")
        
        # Process documents and add to vector store
        processed_count = 0
        for doc_id in request.document_ids:
            try:
                logger.info(f"Processing document {doc_id}")
                
                # Get document metadata first
                documents = await google_docs_service.list_documents(access_token)
                doc_metadata = next((doc for doc in documents if doc['id'] == doc_id), None)
                
                if not doc_metadata:
                    logger.warning(f"Document {doc_id} not found in user's documents")
                    continue
                
                # Get document content (this will automatically detect the MIME type)
                content = await google_docs_service.get_document_content(access_token, doc_id)
                
                logger.info(f"Extracted content length: {len(content)} characters")
                
                if not content or len(content.strip()) < 10:
                    logger.warning(f"Document {doc_id} has very little content: '{content[:50]}...'")
                    continue
                
                # Add to RAG pipeline with metadata
                await rag_pipeline.add_document(
                    user_id=current_user['id'],
                    document_id=doc_id,
                    content=content,
                    document_name=doc_metadata.get('name', f'Document {doc_id[:8]}'),
                    mime_type=doc_metadata.get('mime_type', 'unknown')
                )
                
                logger.info(f"Successfully added document {doc_id} to knowledge base")
                processed_count += 1
            except Exception as e:
                logger.error(f"Failed to process document {doc_id}: {e}", exc_info=True)
        
        return {
            "message": f"Successfully added {processed_count} documents to knowledge base",
            "processed_count": processed_count,
            "total_requested": len(request.document_ids)
        }
    
    except Exception as e:
        logger.error(f"Error adding documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat_with_documents(
    request: ChatRequest,
    current_user = Depends(get_current_user)
):
    """Chat with the RAG system"""
    try:
        # Query the RAG pipeline
        response = await rag_pipeline.query(
            user_id=current_user['id'],
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
        profile = await supabase_client.get_user_profile(current_user['id'])
        return profile
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{document_id}")
async def remove_document_from_knowledge_base(
    document_id: str,
    current_user = Depends(get_current_user)
):
    """Remove a document from the user's knowledge base"""
    try:
        await rag_pipeline.remove_document(current_user['id'], document_id)
        return {"message": "Document removed successfully"}
    except Exception as e:
        logger.error(f"Error removing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/clear-all-documents")
async def clear_all_documents(
    current_user = Depends(get_current_user)
):
    """Clear all documents from the user's knowledge base - FORCE RESET METHOD"""
    try:
        user_id = current_user['id']
        collection_name = f"user_{user_id}"
        
        logger.info(f"🚀 CLEAR ALL ENDPOINT CALLED FOR USER: {user_id}")
        logger.info(f"=== FORCE RESET STARTED FOR USER: {user_id} ===")
        print(f"🚀 CLEAR ALL ENDPOINT CALLED FOR USER: {user_id}")
        print(f"=== FORCE RESET STARTED FOR USER: {user_id} ===")
        
        # Count documents before clearing
        collection = rag_pipeline._get_user_collection(user_id)
        all_docs = collection.get()
        
        if not all_docs['ids']:
            logger.info("Knowledge base is already empty")
            return {"message": "Knowledge base is already empty", "cleared_count": 0}
        
        # Count unique documents
        unique_docs = set()
        if all_docs['metadatas']:
            for meta in all_docs['metadatas']:
                if 'document_id' in meta:
                    unique_docs.add(meta['document_id'])
        
        logger.info(f"BEFORE RESET - User: {user_id}, Chunks: {len(all_docs['ids'])}, Unique docs: {len(unique_docs)}")
        
        # NUCLEAR OPTION - Multiple deletion methods
        try:
            logger.info("🔥 NUCLEAR OPTION: Using multiple deletion methods")
            print("🔥 NUCLEAR OPTION: Using multiple deletion methods")
            
            # Method 1: Delete by IDs
            all_chunk_ids = all_docs['ids']
            logger.info(f"💥 METHOD 1: Deleting {len(all_chunk_ids)} chunks by ID")
            print(f"💥 METHOD 1: Deleting {len(all_chunk_ids)} chunks by ID")
            collection.delete(ids=all_chunk_ids)
            logger.info("✅ METHOD 1 COMPLETED")
            print("✅ METHOD 1 COMPLETED")
            
            # Method 2: Delete by where clause
            logger.info("💥 METHOD 2: Deleting by where clause")
            print("💥 METHOD 2: Deleting by where clause")
            collection.delete(where={})
            logger.info("✅ METHOD 2 COMPLETED")
            print("✅ METHOD 2 COMPLETED")
            
            # Method 3: Delete collection and recreate
            logger.info("💥 METHOD 3: Deleting entire collection and recreating")
            print("💥 METHOD 3: Deleting entire collection and recreating")
            try:
                rag_pipeline.chroma_client.delete_collection(collection_name)
                logger.info(f"✅ Deleted collection: {collection_name}")
                print(f"✅ Deleted collection: {collection_name}")
            except Exception as e:
                logger.warning(f"❌ Could not delete collection: {e}")
                print(f"❌ Could not delete collection: {e}")
            
            # Recreate collection
            try:
                new_collection = rag_pipeline.chroma_client.create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
                logger.info(f"✅ Recreated collection: {collection_name}")
                print(f"✅ Recreated collection: {collection_name}")
            except Exception as e:
                logger.warning(f"❌ Could not recreate collection: {e}")
                print(f"❌ Could not recreate collection: {e}")
            
            # Method 4: Direct file system deletion (if needed)
            import os
            import shutil
            chroma_path = f"./chroma_db/{collection_name}"
            if os.path.exists(chroma_path):
                logger.info(f"💥 METHOD 4: Deleting directory {chroma_path}")
                print(f"💥 METHOD 4: Deleting directory {chroma_path}")
                try:
                    shutil.rmtree(chroma_path)
                    logger.info(f"✅ Deleted directory: {chroma_path}")
                    print(f"✅ Deleted directory: {chroma_path}")
                except Exception as e:
                    logger.warning(f"❌ Could not delete directory: {e}")
                    print(f"❌ Could not delete directory: {e}")
            else:
                logger.info(f"ℹ️ Directory {chroma_path} does not exist")
                print(f"ℹ️ Directory {chroma_path} does not exist")
            
            logger.info("🎉 NUCLEAR OPTION COMPLETED")
            print("🎉 NUCLEAR OPTION COMPLETED")
            
        except Exception as e:
            logger.error(f"Error in nuclear option: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to reset LLM data: {str(e)}")
        
        # Final verification
        try:
            final_collection = rag_pipeline._get_user_collection(user_id)
            final_docs = final_collection.get()
            logger.info(f"FINAL VERIFICATION - Chunks remaining: {len(final_docs['ids'])}")
            logger.info(f"FINAL VERIFICATION - Sample IDs: {final_docs['ids'][:5]}")
            
            if len(final_docs['ids']) > 0:
                logger.error(f"CRITICAL: {len(final_docs['ids'])} chunks still remain after reset operation!")
                logger.info(f"Remaining chunk IDs: {final_docs['ids'][:5]}")
                
                # Try one more time to delete remaining chunks
                logger.info("ATTEMPTING FINAL CLEANUP")
                final_collection.delete(ids=final_docs['ids'])
                final_cleanup = final_collection.get()
                logger.info(f"FINAL CLEANUP - Chunks remaining: {len(final_cleanup['ids'])}")
                
                return {
                    "message": f"Reset operation completed but {len(final_docs['ids'])} chunks may still remain",
                    "cleared_count": len(unique_docs),
                    "total_chunks_removed": len(all_docs['ids']),
                    "remaining_chunks": len(final_docs['ids']),
                    "final_chunks": len(final_cleanup['ids'])
                }
            else:
                logger.info("SUCCESS: All chunks successfully cleared - LLM data reset")
                
        except Exception as verify_error:
            logger.error(f"Error in final verification: {verify_error}")
        
        logger.info(f"=== FORCE RESET COMPLETED FOR USER: {user_id} ===")
        
        return {
            "message": f"LLM data has been reset - all documents cleared from knowledge base",
            "cleared_count": len(unique_docs),
            "total_chunks_removed": len(all_docs['ids']),
            "llm_status": "reset"
        }
    except Exception as e:
        logger.error(f"Error clearing all documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/{document_id}/rechunk")
async def rechunk_document(
    document_id: str,
    current_user = Depends(get_current_user)
):
    """Re-chunk a document with current configuration"""
    try:
        # Get document content from Google Drive
        access_token = await supabase_client.get_user_google_token(current_user['id'])
        if not access_token:
            raise HTTPException(status_code=401, detail="No Google access token found")
        
        # Get document content
        doc_content = await google_docs_service.get_document_content(document_id, access_token)
        if not doc_content:
            raise HTTPException(status_code=404, detail="Document not found or empty")
        
        # Get document metadata
        doc_metadata = await google_docs_service.get_document_metadata(document_id, access_token)
        doc_name = doc_metadata.get('title', f'Document {document_id}')
        
        # Re-chunk the document
        await rag_pipeline.rechunk_document(
            current_user['id'], 
            document_id, 
            doc_content, 
            doc_name, 
            'application/pdf'
        )
        
        return {"message": "Document re-chunked successfully"}
    except Exception as e:
        logger.error(f"Error re-chunking document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test ChromaDB connection
        test_collection = rag_pipeline._get_user_collection("test_user")
        chroma_status = "operational"
    except Exception as e:
        chroma_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "services": {
            "google_auth": "operational",
            "rag_pipeline": "operational",
            "supabase": "operational",
            "chromadb": chroma_status
        }
    }

@app.get("/database-stats")
async def get_database_stats(current_user = Depends(get_current_user)):
    """Get database statistics for monitoring large scale operations"""
    try:
        stats = await rag_pipeline.get_database_stats(current_user['id'])
        return stats
    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/clear-status")
async def debug_clear_status(current_user = Depends(get_current_user)):
    """Debug endpoint to check if clear operation worked"""
    try:
        collection = rag_pipeline._get_user_collection(current_user['id'])
        all_docs = collection.get()
        
        # Count unique documents
        unique_docs = set()
        if all_docs['metadatas']:
            for meta in all_docs['metadatas']:
                if 'document_id' in meta:
                    unique_docs.add(meta['document_id'])
        
        return {
            "user_id": current_user['id'],
            "total_chunks": len(all_docs.get('ids', [])),
            "unique_documents": len(unique_docs),
            "is_empty": len(all_docs.get('ids', [])) == 0,
            "sample_chunk_ids": all_docs.get('ids', [])[:5],
            "collection_name": f"user_{current_user['id']}",
            "status": "empty" if len(all_docs.get('ids', [])) == 0 else "not_empty"
        }
    except Exception as e:
        logger.error(f"Error checking clear status: {e}")
        return {"error": str(e)}

@app.get("/debug/test")
async def debug_test():
    """Simple test endpoint to check if backend is running"""
    return {"message": "Backend is running!", "timestamp": "2024-01-01T00:00:00Z"}


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

@app.get("/debug/knowledge-base")
async def debug_knowledge_base(current_user = Depends(get_current_user)):
    """Debug endpoint to check what's in the knowledge base"""
    try:
        user_id = current_user['id']
        collection = rag_pipeline._get_user_collection(user_id)
        
        # Get basic collection info
        count = collection.count()
        
        result = {
            "user_id": user_id,
            "document_count": count,
            "collection_name": f"user_{user_id}"
        }
        
        # If there are documents, get some sample data
        if count > 0:
            # Get all documents (up to 10 for debugging)
            all_docs = collection.get(limit=10)
            result["sample_documents"] = {
                "ids": all_docs.get('ids', [])[:5],  # First 5 IDs
                "metadatas": all_docs.get('metadatas', [])[:5],  # First 5 metadata
                "documents_preview": [doc[:100] + "..." if len(doc) > 100 else doc 
                                    for doc in (all_docs.get('documents', [])[:3])]  # First 3 doc previews
            }
            
            # Get unique document IDs from ALL documents, not just limited ones
            all_docs_full = collection.get()
            unique_doc_ids = set()
            for metadata in all_docs_full.get('metadatas', []):
                if metadata and 'document_id' in metadata:
                    unique_doc_ids.add(metadata['document_id'])
            
            result["unique_document_ids"] = list(unique_doc_ids)
            result["unique_document_count"] = len(unique_doc_ids)
        else:
            result["unique_document_ids"] = []
            result["unique_document_count"] = 0
        
        return result
        
    except Exception as e:
        logger.error(f"Debug knowledge base error: {e}")
        return {"error": str(e)}

@app.get("/knowledge-base")
async def get_knowledge_base_documents(current_user = Depends(get_current_user)):
    """Get actual documents in the knowledge base with metadata"""
    try:
        user_id = current_user['id']
        collection = rag_pipeline._get_user_collection(user_id)
        
        # Get all documents in the knowledge base
        all_docs = collection.get()
        
        logger.info(f"=== KNOWLEDGE BASE REQUEST FOR USER {user_id} ===")
        logger.info(f"Raw ChromaDB data for user {user_id}:")
        logger.info(f"Total chunks: {len(all_docs.get('ids', []))}")
        logger.info(f"Sample IDs: {all_docs.get('ids', [])[:5]}")
        logger.info(f"Sample metadatas: {all_docs.get('metadatas', [])[:3]}")
        
        # Check if collection is actually empty
        if len(all_docs.get('ids', [])) == 0:
            logger.info("✅ COLLECTION IS EMPTY - Returning empty documents list")
            return {"documents": []}
        
        # Debug: Check if metadatas exist and have document_id
        metadatas = all_docs.get('metadatas', [])
        logger.info(f"Total metadatas: {len(metadatas)}")
        if metadatas:
            logger.info(f"First metadata: {metadatas[0]}")
            logger.info(f"Has document_id in first metadata: {'document_id' in metadatas[0] if metadatas[0] else False}")
        
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
        logger.info(f"Document metadata keys: {list(document_metadata.keys())}")
        
        # Convert to list
        documents = list(document_metadata.values())
        logger.info(f"Documents list length: {len(documents)}")
        
        return {
            "documents": documents,
            "total_documents": len(documents),
            "total_chunks": len(all_docs.get('ids', [])),
            "debug_info": {
                "raw_chunks": len(all_docs.get('ids', [])),
                "unique_documents": len(document_metadata),
                "sample_metadata": all_docs.get('metadatas', [])[:2] if all_docs.get('metadatas') else []
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting knowledge base documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)