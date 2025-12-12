import os
import httpx
from utils.http_client import get_http_client
import traceback
from typing import List, Dict, Any
import logging
import json
import io
import asyncio

# Import libraries for document processing
try:
    from pypdf import PdfReader
    PDF_AVAILABLE = True
except ImportError:
    try:
        import PyPDF2
        from PyPDF2 import PdfReader
        PDF_AVAILABLE = True
    except ImportError:
        PDF_AVAILABLE = False

try:
    from docx import Document as DocxDocument
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

logger = logging.getLogger(__name__)



class GoogleDocsService:
    def __init__(self):
        self.drive_api_base = "https://www.googleapis.com/drive/v3"
        self.docs_api_base = "https://www.googleapis.com/docs/v1"
        self._semaphore = asyncio.Semaphore(200)
        self._folder_cache = {}
        self._cache_ttl = 300
        self._pending_requests = {}
    
    async def list_documents(self, access_token: str) -> List[Dict[str, Any]]:
        """List all document files (.docx, .pdf, .txt, .pptx, Google Docs) for the user (NO FOLDERS)"""
        try:
            # Query for various document types using Drive API (EXCLUDE FOLDERS)
            query = ("(mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or "
                    "mimeType='application/pdf' or "
                    "mimeType='text/plain' or "
                    "mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation' or "
                    "mimeType='application/vnd.google-apps.document' or "
                    "mimeType='application/vnd.google-apps.presentation') and "
                    "trashed=false")
            url = f"{self.drive_api_base}/files"
            
            params = {
                'q': query,
                'pageSize': 50,
                'orderBy': 'modifiedTime desc',
                'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Use connection pooling
            client = await get_http_client()
            response = await client.get(url, params=params, headers=headers)
                
            if response.status_code != 200:
                logger.error(f"Drive API error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to fetch documents: {response.status_code}")
            
            data = response.json()
            files = data.get('files', [])
            
            logger.debug(f"Google Drive API response: {data}")
            logger.info(f"Raw files found: {len(files)}")
            
            # If no files found with the specific query, try a broader query
            if len(files) == 0:
                logger.warning("No files found with specific query, trying broader search...")
                broader_query = "trashed=false"
                broader_params = {
                    'q': broader_query,
                    'pageSize': 50,
                    'orderBy': 'modifiedTime desc',
                    'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
                }
                
                # Use connection pooling
                client = await get_http_client()
                broader_response = await client.get(url, params=broader_params, headers=headers)
                
                if broader_response.status_code == 200:
                    broader_data = broader_response.json()
                    broader_files = broader_data.get('files', [])
                    logger.info(f"Broader search found {len(broader_files)} files")
                    
                    # Filter for document types from the broader results (EXCLUDE FOLDERS)
                    document_files = []
                    for file in broader_files:
                        mime_type = file.get('mimeType', '')
                        if any(doc_type in mime_type for doc_type in [
                            'document', 'pdf', 'text', 'presentation'
                        ]) and 'folder' not in mime_type:
                            document_files.append(file)
                    
                    logger.info(f"Filtered to {len(document_files)} document files")
                    files = document_files
            
            documents = []
            for file in files:
                logger.debug(f"Processing file: {file.get('name')} (ID: {file.get('id')})")
                
                mime_type = file.get('mimeType', 'unknown')
                
                if 'folder' in mime_type:
                    continue
                
                parents = file.get('parents', [])
                parent_id = parents[0] if parents else None
                
                file_extension = self._get_file_extension(file.get('name', ''))
                if not file_extension:
                    file_extension = self._mime_to_extension(mime_type)
                
                doc = {
                    'id': file['id'],
                    'name': file['name'],
                    'created_time': file.get('createdTime', ''),
                    'modified_time': file.get('modifiedTime', ''),
                    'web_view_link': file.get('webViewLink', ''),
                    'size': file.get('size'),
                    'mime_type': mime_type,
                    'file_extension': file_extension,
                    'parent_id': parent_id,
                    'is_folder': False
                }
                documents.append(doc)
            
            logger.info(f"Processed {len(documents)} Google Docs successfully")
            return documents
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}", exc_info=True)
            raise
    
    def _get_file_extension(self, filename: str) -> str:
        if '.' in filename:
            return filename.split('.')[-1].lower()
        return ''
    
    def _mime_to_extension(self, mime_type: str) -> str:
        mime_map = {
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/pdf': 'pdf',
            'text/plain': 'txt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
            'application/vnd.google-apps.document': 'gdoc',
            'application/vnd.google-apps.presentation': 'gslides',
            'application/msword': 'doc',
            'application/vnd.ms-powerpoint': 'ppt'
        }
        return mime_map.get(mime_type, 'unknown')
    
    def _extract_folder_id_from_url(self, folder_url: str) -> str:
        import re
        patterns = [
            r'drive\.google\.com/drive/folders/([a-zA-Z0-9_-]+)',
            r'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)',
            r'drive\.google\.com/open\?id=([a-zA-Z0-9_-]+)',
            r'folders/([a-zA-Z0-9_-]+)',
            r'id=([a-zA-Z0-9_-]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, folder_url)
            if match:
                return match.group(1)
        
        if re.match(r'^[a-zA-Z0-9_-]+$', folder_url.strip()):
            return folder_url.strip()
        
        raise ValueError(f"Tidak dapat mengekstrak folder ID dari URL: {folder_url}")
    
    async def list_documents_from_folder(self, folder_url: str, access_token: str = None) -> List[Dict[str, Any]]:
        try:
            folder_id = self._extract_folder_id_from_url(folder_url)
            logger.info(f"Extracted folder ID: {folder_id}")
            
            query = (f"'{folder_id}' in parents and "
                    "(mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or "
                    "mimeType='application/pdf' or "
                    "mimeType='text/plain' or "
                    "mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation' or "
                    "mimeType='application/vnd.google-apps.document' or "
                    "mimeType='application/vnd.google-apps.presentation' or "
                    "mimeType='application/vnd.google-apps.folder') and "
                    "trashed=false")
            
            url = f"{self.drive_api_base}/files"
            
            params = {
                'q': query,
                'pageSize': 50,
                'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
            }
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            if access_token:
                headers['Authorization'] = f'Bearer {access_token}'
            
            # Use connection pooling
            client = await get_http_client()
            response = await client.get(url, params=params, headers=headers)
                
            if response.status_code != 200:
                logger.error(f"Drive API error: {response.status_code} - {response.text}")
                
                if response.status_code in [403, 404]:
                    logger.warning(f"Folder {folder_id} is not accessible, falling back to recent files")
                    return await self._get_recent_documents(access_token)
                
                raise Exception(f"Failed to fetch documents from folder: {response.status_code} - {response.text}")
            
            data = response.json()
            files = data.get('files', [])
            
            logger.info(f"Found {len(files)} files in folder {folder_id}")
            
            if len(files) == 0:
                logger.warning("No files found with specific query, trying broader search in folder...")
                broader_query = f"'{folder_id}' in parents and trashed=false"
                broader_params = {
                    'q': broader_query,
                    'pageSize': 50,
                    'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
                }
                
                # Use connection pooling
                client = await get_http_client()
                broader_response = await client.get(url, params=broader_params, headers=headers)
                
                if broader_response.status_code == 200:
                    broader_data = broader_response.json()
                    broader_files = broader_data.get('files', [])
                    logger.info(f"Broader search found {len(broader_files)} files in folder")
                    
                    document_files = []
                    for file in broader_files:
                        mime_type = file.get('mimeType', '')
                        if any(doc_type in mime_type for doc_type in [
                            'document', 'pdf', 'text', 'presentation', 'folder'
                        ]):
                            document_files.append(file)
                    
                    logger.info(f"Filtered to {len(document_files)} files and folders in folder")
                    files = document_files
                else:
                    logger.warning("Broader search also failed, falling back to recent files")
                    return await self._get_recent_documents(access_token)
            
            documents = []
            for file in files:
                logger.debug(f"Processing file: {file.get('name')} (ID: {file.get('id')})")
                
                mime_type = file.get('mimeType', 'unknown')
                parents = file.get('parents', [])
                parent_id = parents[0] if parents else None
                
                file_extension = self._get_file_extension(file.get('name', ''))
                if not file_extension:
                    file_extension = self._mime_to_extension(mime_type)
                
                is_folder = mime_type == 'application/vnd.google-apps.folder'
                logger.debug(f"File: {file.get('name')}, MIME: {mime_type}, Is Folder: {is_folder}")
                
                if is_folder:
                    logger.debug(f"FOLDER DATA: {file.get('name')}, webViewLink: {file.get('webViewLink', '')}, id: {file['id']}")
                
                doc = {
                    'id': file['id'],
                    'name': file['name'],
                    'created_time': file.get('createdTime', ''),
                    'modified_time': file.get('modifiedTime', ''),
                    'web_view_link': file.get('webViewLink', ''),
                    'size': file.get('size'),
                    'mime_type': mime_type,
                    'file_extension': file_extension,
                    'parent_id': parent_id,
                    'is_folder': is_folder,
                    'source_folder_id': folder_id,
                    'source_folder_url': folder_url
                }
                documents.append(doc)
            
            logger.info(f"Processed {len(documents)} documents from folder successfully")
            return documents
            
        except Exception as e:
            logger.error(f"Error listing documents from folder: {e}", exc_info=True)
            logger.warning("Falling back to recent files due to error")
            try:
                return await self._get_recent_documents(access_token)
            except Exception as fallback_error:
                logger.error(f"Fallback to recent files also failed: {fallback_error}", exc_info=True)
                raise e
    
    async def _get_recent_documents(self, access_token: str = None) -> List[Dict[str, Any]]:
        try:
            logger.info("Fetching recent documents as fallback")
            
            query = ("(mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or "
                    "mimeType='application/pdf' or "
                    "mimeType='text/plain' or "
                    "mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation' or "
                    "mimeType='application/vnd.google-apps.document' or "
                    "mimeType='application/vnd.google-apps.presentation') and "
                    "trashed=false")
            
            url = f"{self.drive_api_base}/files"
            
            params = {
                'q': query,
                'pageSize': 50,
                'orderBy': 'modifiedTime desc',
                'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
            }
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            if access_token:
                headers['Authorization'] = f'Bearer {access_token}'
            
            # Use connection pooling
            client = await get_http_client()
            response = await client.get(url, params=params, headers=headers)
                
            if response.status_code != 200:
                logger.error(f"Recent documents API error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to fetch recent documents: {response.status_code} - {response.text}")
            
            data = response.json()
            files = data.get('files', [])
            
            logger.info(f"Found {len(files)} recent files")
            
            documents = []
            for file in files:
                mime_type = file.get('mimeType', 'unknown')
                
                if 'folder' in mime_type:
                    continue
                
                parents = file.get('parents', [])
                parent_id = parents[0] if parents else None
                
                file_extension = self._get_file_extension(file.get('name', ''))
                if not file_extension:
                    file_extension = self._mime_to_extension(mime_type)
                
                doc = {
                    'id': file['id'],
                    'name': file['name'],
                    'created_time': file.get('createdTime', ''),
                    'modified_time': file.get('modifiedTime', ''),
                    'web_view_link': file.get('webViewLink', ''),
                    'size': file.get('size'),
                    'mime_type': mime_type,
                    'file_extension': file_extension,
                    'parent_id': parent_id,
                    'is_folder': False,
                    'source_folder_id': None,
                    'source_folder_url': None,
                    'is_recent_fallback': True
                }
                documents.append(doc)
            
            logger.info(f"Processed {len(documents)} recent documents successfully")
            return documents
            
        except Exception as e:
            logger.error(f"Error fetching recent documents: {e}", exc_info=True)
            raise
    
    async def list_all_documents_from_folder(self, folder_url: str, access_token: str = None) -> List[Dict[str, Any]]:
        try:
            logger.info(f"=== LIST ALL DOCUMENTS FROM FOLDER ===")
            logger.info(f"Folder URL: {folder_url}")
            
            folder_id = self._extract_folder_id_from_url(folder_url)
            logger.info(f"Extracted ID: {folder_id}")
            
            # OPTIMIZATION: Skip file type check - assume it's always a folder
            # This removes 1-2 seconds of unnecessary API call overhead
            # If it's actually a file, the recursive function will handle it gracefully
            
            all_documents = []
            await self._get_documents_recursive(folder_id, access_token, all_documents, "")
            
            logger.info(f"🎯 Found {len(all_documents)} total documents in folder and subfolders")
            return all_documents
            
        except Exception as e:
            logger.error(f"Error fetching all documents from folder: {e}", exc_info=True)
            raise Exception(f"Failed to fetch all documents from folder: {str(e)}")
    
    async def _get_documents_recursive(self, folder_id: str, access_token: str, all_documents: List[Dict[str, Any]], current_folder_name: str = ""):
        try:
            logger.info(f"=== RECURSIVE SEARCH IN FOLDER {folder_id} ===")
            logger.info(f"Current folder name: {current_folder_name}")
            
            query = (f"'{folder_id}' in parents and "
                    "(mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or "
                    "mimeType='application/pdf' or "
                    "mimeType='text/plain' or "
                    "mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation' or "
                    "mimeType='application/vnd.google-apps.document' or "
                    "mimeType='application/vnd.google-apps.presentation' or "
                    "mimeType='application/vnd.google-apps.folder') and "
                    "trashed=false")
            
            url = f"{self.drive_api_base}/files"
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            if access_token:
                headers['Authorization'] = f'Bearer {access_token}'
            
            # Use connection pooling
            client = await get_http_client()
            
            # Collect all files from all pages
            all_files = []
            page_token = None
            page_count = 0
            
            # Pagination loop to get ALL files (not just first 50)
            while True:
                page_count += 1
                params = {
                    'q': query,
                    'pageSize': 1000,  # Maximum allowed by Google Drive API
                    'fields': 'nextPageToken,files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
                }
                
                if page_token:
                    params['pageToken'] = page_token
                
                # Use debug logging for per-page updates to reduce overhead
                if page_count == 1 or page_count % 5 == 0:  # Log every 5th page
                    logger.info(f"📄 Fetching page {page_count} for folder {folder_id}")
                else:
                    logger.debug(f"📄 Fetching page {page_count} for folder {folder_id}")
                
                # Use semaphore to control concurrent requests
                async with self._semaphore:
                    response = await client.get(url, params=params, headers=headers)
                
                if response.status_code != 200:
                    logger.error(f"Drive API error: {response.status_code} - {response.text}")
                    break
                
                data = response.json()
                files = data.get('files', [])
                all_files.extend(files)
                
                # Reduce logging frequency
                if page_count == 1 or page_count % 5 == 0 or not data.get('nextPageToken'):
                    logger.info(f"✅ Page {page_count}: Found {len(files)} items (Total: {len(all_files)})")
                
                # Check if there are more pages
                page_token = data.get('nextPageToken')
                if not page_token:
                    break
            
            logger.info(f"🎯 Total {len(all_files)} items found in folder {folder_id} across {page_count} page(s)")
            
            # Separate files and folders
            folders = []
            documents = []
            
            for file in all_files:
                mime_type = file.get('mimeType', '')
                file_name = file.get('name', '')
                file_id = file.get('id', '')
                
                if mime_type == 'application/vnd.google-apps.folder':
                    folders.append(file)
                    logger.debug(f"📁 Found subfolder: {file_name} (ID: {file_id})")
                else:
                    documents.append(file)
                    logger.debug(f"📄 Found document: {file_name} (ID: {file_id})")
            
            # Add all documents from current folder (MEMORY EFFICIENT for 1000+ files)
            # Process documents in chunks to prevent memory overflow
            chunk_size = 100  # Process 100 documents at a time
            total_docs = len(documents)
            
            if total_docs > chunk_size:
                logger.info(f"📦 Processing {total_docs} documents in chunks of {chunk_size} for memory efficiency...")
            
            for chunk_start in range(0, total_docs, chunk_size):
                chunk_end = min(chunk_start + chunk_size, total_docs)
                chunk = documents[chunk_start:chunk_end]
                
                for file in chunk:
                    mime_type = file.get('mimeType', '')
                    file_name = file.get('name', '')
                    file_id = file.get('id', '')
                    
                    parents = file.get('parents', [])
                    parent_id = parents[0] if parents else None
                    
                    file_extension = self._get_file_extension(file_name)
                    if not file_extension:
                        file_extension = self._mime_to_extension(mime_type)
                    
                    document = {
                        'id': file_id,
                        'name': file_name,
                        'mime_type': mime_type,
                        'created_time': file.get('createdTime'),
                        'modified_time': file.get('modifiedTime'),
                        'web_view_link': file.get('webViewLink'),
                        'size': file.get('size'),
                        'parent_id': parent_id,
                        'is_folder': False,
                        'file_extension': file_extension,
                        'source_subfolder': current_folder_name if current_folder_name else None
                    }
                    
                    all_documents.append(document)
                
                if total_docs > chunk_size and chunk_end < total_docs:
                    logger.debug(f"   Processed {chunk_end}/{total_docs} documents...")
            
            
            logger.info(f"✅ Added {len(documents)} documents from folder {folder_id}")
            
            # Process subfolders in PARALLEL with ULTRA-AGGRESSIVE BATCHING
            if folders:
                logger.info(f"� Processing {len(folders)} subfolders with ULTRA-AGGRESSIVE PARALLEL BATCHING...")
                
                # ULTRA-AGGRESSIVE BATCH SIZE for maximum speed
                if len(folders) <= 10:
                    batch_size = 10   # Small: all at once
                elif len(folders) <= 50:
                    batch_size = 30   # Medium: 30 per batch (was 20)
                elif len(folders) <= 200:
                    batch_size = 60   # Large: 60 per batch (was 30)
                elif len(folders) <= 500:
                    batch_size = 100  # Very large: 100 per batch (was 50)
                else:
                    batch_size = 150  # ULTRA EXTREME: 150 per batch!
                
                total_batches = (len(folders) + batch_size - 1) // batch_size
                logger.info(f"📊 Using dynamic batch size: {batch_size} folders per batch ({total_batches} batches total)")
                
                import time
                start_time = time.time()
                processed_folders = 0
                
                for batch_num in range(0, len(folders), batch_size):
                    batch = folders[batch_num:batch_num + batch_size]
                    current_batch = (batch_num // batch_size) + 1
                    
                    batch_start = time.time()
                    logger.info(f"⚡ Processing batch {current_batch}/{total_batches} ({len(batch)} folders)...")
                    
                    # Create tasks for this batch
                    subfolder_tasks = []
                    for folder in batch:
                        folder_name = folder.get('name', '')
                        folder_id_sub = folder.get('id', '')
                        
                        # Each subfolder gets its own task
                        task = self._get_documents_recursive(
                            folder_id_sub, 
                            access_token, 
                            all_documents, 
                            folder_name
                        )
                        subfolder_tasks.append(task)
                    
                    # Execute this batch in parallel
                    results = await asyncio.gather(*subfolder_tasks, return_exceptions=True)
                    
                    # Count errors
                    errors = sum(1 for r in results if isinstance(r, Exception))
                    processed_folders += len(batch)
                    
                    batch_time = time.time() - batch_start
                    elapsed_time = time.time() - start_time
                    
                    # Calculate ETA
                    if processed_folders > 0:
                        avg_time_per_folder = elapsed_time / processed_folders
                        remaining_folders = len(folders) - processed_folders
                        eta_seconds = avg_time_per_folder * remaining_folders
                        eta_str = f"{int(eta_seconds)}s" if eta_seconds < 60 else f"{int(eta_seconds/60)}m {int(eta_seconds%60)}s"
                    else:
                        eta_str = "calculating..."
                    
                    logger.info(f"✅ Batch {current_batch}/{total_batches} done in {batch_time:.1f}s ({errors} errors) | Progress: {processed_folders}/{len(folders)} | ETA: {eta_str}")
                
                total_time = time.time() - start_time
                logger.info(f"🎉 Completed ALL {len(folders)} subfolders in {total_time:.1f}s! (Avg: {total_time/len(folders):.2f}s per folder)")
            
            
        except Exception as e:
            logger.error(f"Error in recursive document fetch for folder {folder_id}: {e}", exc_info=True)
    
    async def get_document_content(self, access_token: str, document_id: str, mime_type: str = None) -> str:
        try:
            if not mime_type:
                file_info = await self._get_file_info(access_token, document_id)
                mime_type = file_info.get('mimeType', '')
            
            logger.info(f"Extracting content for document {document_id} with MIME type: {mime_type}")
            
            if mime_type == 'application/vnd.google-apps.document':
                return await self._get_google_doc_content(access_token, document_id)
            
            elif mime_type in ['application/pdf', 
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                             'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                             'text/plain',
                             'application/vnd.google-apps.presentation']:
                return await self._export_file_as_text(access_token, document_id, mime_type)
            
            else:
                logger.warning(f"Unsupported MIME type: {mime_type}")
                return f"Content extraction not supported for file type: {mime_type}"
                
        except Exception as e:
            logger.error(f"Error getting document content for {document_id}: {e}", exc_info=True)
            raise
    
    async def get_document_metadata(self, access_token: str, document_id: str) -> Dict[str, Any]:
        try:
            return await self._get_file_info(access_token, document_id)
        except Exception as e:
            logger.error(f"Error getting document metadata for {document_id}: {e}", exc_info=True)
            return None
    
    async def _get_file_info(self, access_token: str, file_id: str, fields: str = None) -> Dict[str, Any]:
        url = f"{self.drive_api_base}/files/{file_id}"
        headers = {'Authorization': f'Bearer {access_token}'}
        
        # Use connection pooling
        client = await get_http_client()
        params = {}
        if fields:
            params['fields'] = fields
        response = await client.get(url, headers=headers, params=params)
            
        if response.status_code != 200:
            raise Exception(f"Failed to get file info: {response.status_code}")
            
        return response.json()
    
    async def _get_google_doc_content(self, access_token: str, document_id: str) -> str:
        url = f"{self.docs_api_base}/documents/{document_id}"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Use connection pooling
        client = await get_http_client()
        response = await client.get(url, headers=headers)
            
        if response.status_code != 200:
            logger.error(f"Docs API error: {response.status_code} - {response.text}")
            raise Exception(f"Failed to fetch document content: {response.status_code}")
        
        document = response.json()
        content = self._extract_text_from_document(document)
        return content
    
    async def _export_file_as_text(self, access_token: str, file_id: str, mime_type: str) -> str:
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            content = None
            client = await get_http_client()
            
            if mime_type == 'text/plain':
                url = f"{self.drive_api_base}/files/{file_id}?alt=media"
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    content = response.text
            
            if not content:
                url = f"{self.drive_api_base}/files/{file_id}/export?mimeType=text/plain"
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    content = response.text
            
            if not content and mime_type == 'application/pdf':
                url = f"{self.drive_api_base}/files/{file_id}?alt=media"
                response = await client.get(url, headers=headers)
                if response.status_code == 200 and PDF_AVAILABLE:
                    try:
                        pdf_content = response.content
                        pdf_reader = PdfReader(io.BytesIO(pdf_content))
                        text_parts = []
                        for page in pdf_reader.pages:
                            text_parts.append(page.extract_text())
                        content = "\n\n".join(text_parts)
                    except Exception as e:
                        logger.error(f"PDF error: {e}")
            
            if not content and mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                url = f"{self.drive_api_base}/files/{file_id}?alt=media"
                response = await client.get(url, headers=headers)
                if response.status_code == 200 and DOCX_AVAILABLE:
                    try:
                        docx_content = response.content
                        doc = DocxDocument(io.BytesIO(docx_content))
                        text_parts = [p.text for p in doc.paragraphs if p.text.strip()]
                        content = "\n\n".join(text_parts)
                    except Exception as e:
                        logger.error(f"DOCX error: {e}")
            
            if not content:
                return f"Content extraction not supported for {mime_type}"
            
            return content.strip()
                
        except Exception as e:
            logger.error(f"Error extracting content from {mime_type}: {e}", exc_info=True)
            return f"Error accessing file content"
    
    def _extract_text_from_document(self, document: Dict[str, Any]) -> str:
        try:
            content = document.get('body', {}).get('content', [])
            text_parts = []
            
            for element in content:
                if 'paragraph' in element:
                    paragraph = element['paragraph']
                    elements = paragraph.get('elements', [])
                    for elem in elements:
                        if 'textRun' in elem:
                            text_parts.append(elem['textRun'].get('content', ''))
                elif 'table' in element:
                    table = element['table']
                    for row in table.get('tableRows', []):
                        for cell in row.get('tableCells', []):
                            cell_content = cell.get('content', [])
                            for cell_elem in cell_content:
                                if 'paragraph' in cell_elem:
                                    paragraph = cell_elem['paragraph']
                                    elements = paragraph.get('elements', [])
                                    for elem in elements:
                                        if 'textRun' in elem:
                                            text_parts.append(elem['textRun'].get('content', ''))
            
            return ''.join(text_parts).strip()
            
        except Exception as e:
            logger.error(f"Error extracting text from document: {e}", exc_info=True)
            return ""