import os
import httpx
from typing import List, Dict, Any
import logging
import json
import io

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
    
    async def list_documents(self, access_token: str) -> List[Dict[str, Any]]:
        """List all document files (.docx, .pdf, .txt, .pptx, Google Docs) for the user (NO FOLDERS)"""
        try:
            # Query for various document types using Drive API (EXCLUDE FOLDERS)
            # Include: Word docs, PDFs, text files, PowerPoint, Google Docs
            # Fixed: Use correct Google Drive API query syntax and exclude folders
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
                'pageSize': 50,  # Reduced to 50 files for better performance and memory usage
                'orderBy': 'modifiedTime desc',  # Sort by most recently modified
                'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers)
                
            if response.status_code != 200:
                logger.error(f"Drive API error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to fetch documents: {response.status_code}")
            
            data = response.json()
            files = data.get('files', [])
            
            logger.info(f"Google Drive API response: {data}")
            logger.info(f"Raw files found: {len(files)}")
            
            # If no files found with the specific query, try a broader query
            if len(files) == 0:
                logger.warning("No files found with specific query, trying broader search...")
                broader_query = "trashed=false"
                broader_params = {
                    'q': broader_query,
                    'pageSize': 50,  # Reduced for better performance
                    'orderBy': 'modifiedTime desc',  # Sort by most recently modified
                    'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
                }
                
                async with httpx.AsyncClient() as client:
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
                logger.info(f"Processing file: {file.get('name')} (ID: {file.get('id')})")
                
                # Get the actual MIME type from the file
                mime_type = file.get('mimeType', 'unknown')
                
                # Skip folders (double check)
                if 'folder' in mime_type:
                    continue
                
                # Get parent folder information
                parents = file.get('parents', [])
                parent_id = parents[0] if parents else None
                
                # Determine file type for display
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
                    'is_folder': False  # Always false since we exclude folders
                }
                documents.append(doc)
            
            logger.info(f"Processed {len(documents)} Google Docs successfully")
            return documents
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            raise
    

    
    def _get_file_extension(self, filename: str) -> str:
        """Extract file extension from filename"""
        if '.' in filename:
            return filename.split('.')[-1].lower()
        return ''
    
    def _mime_to_extension(self, mime_type: str) -> str:
        """Convert MIME type to file extension"""
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
        """Extract folder ID from Google Drive folder URL"""
        import re
        
        # Pattern untuk berbagai format Google Drive URL
        patterns = [
            r'drive\.google\.com/drive/folders/([a-zA-Z0-9_-]+)',  # Standard folder URL
            r'drive\.google\.com/open\?id=([a-zA-Z0-9_-]+)',       # Open URL
            r'folders/([a-zA-Z0-9_-]+)',                          # Direct folder ID
            r'id=([a-zA-Z0-9_-]+)',                               # ID parameter
        ]
        
        for pattern in patterns:
            match = re.search(pattern, folder_url)
            if match:
                return match.group(1)
        
        # Jika tidak ada pattern yang match, mungkin URL sudah berupa ID
        if re.match(r'^[a-zA-Z0-9_-]+$', folder_url.strip()):
            return folder_url.strip()
        
        raise ValueError(f"Tidak dapat mengekstrak folder ID dari URL: {folder_url}")
    
    async def list_documents_from_folder(self, folder_url: str, access_token: str = None) -> List[Dict[str, Any]]:
        """List all documents from a specific Google Drive folder (public or private)"""
        try:
            # Extract folder ID from URL
            folder_id = self._extract_folder_id_from_url(folder_url)
            logger.info(f"Extracted folder ID: {folder_id}")
            
            # Query for documents AND folders in the specific folder
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
                'pageSize': 50,  # Reduced for better performance
                'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
            }
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            # Add authorization header if access token is provided
            if access_token:
                headers['Authorization'] = f'Bearer {access_token}'
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers)
                
            if response.status_code != 200:
                logger.error(f"Drive API error: {response.status_code} - {response.text}")
                
                # If folder is not accessible, fallback to recent files
                if response.status_code in [403, 404]:
                    logger.warning(f"Folder {folder_id} is not accessible, falling back to recent files")
                    return await self._get_recent_documents(access_token)
                
                raise Exception(f"Failed to fetch documents from folder: {response.status_code} - {response.text}")
            
            data = response.json()
            files = data.get('files', [])
            
            logger.info(f"Found {len(files)} files in folder {folder_id}")
            
            # If no files found, try a broader search in the folder
            if len(files) == 0:
                logger.warning("No files found with specific query, trying broader search in folder...")
                broader_query = f"'{folder_id}' in parents and trashed=false"
                broader_params = {
                    'q': broader_query,
                    'pageSize': 50,  # Reduced for better performance
                    'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
                }
                
                async with httpx.AsyncClient() as client:
                    broader_response = await client.get(url, params=broader_params, headers=headers)
                
                if broader_response.status_code == 200:
                    broader_data = broader_response.json()
                    broader_files = broader_data.get('files', [])
                    logger.info(f"Broader search found {len(broader_files)} files in folder")
                    
                    # Filter for document types and folders from the broader results
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
                    # If broader search also fails, fallback to recent files
                    logger.warning("Broader search also failed, falling back to recent files")
                    return await self._get_recent_documents(access_token)
            
            documents = []
            for file in files:
                logger.info(f"Processing file: {file.get('name')} (ID: {file.get('id')})")
                
                # Get the actual MIME type from the file
                mime_type = file.get('mimeType', 'unknown')
                
                # Get parent folder information
                parents = file.get('parents', [])
                parent_id = parents[0] if parents else None
                
                # Determine file type for display
                file_extension = self._get_file_extension(file.get('name', ''))
                if not file_extension:
                    file_extension = self._mime_to_extension(mime_type)
                
                is_folder = mime_type == 'application/vnd.google-apps.folder'
                logger.info(f"File: {file.get('name')}, MIME: {mime_type}, Is Folder: {is_folder}")
                
                # Special logging for folders
                if is_folder:
                    logger.info(f"FOLDER DATA: {file.get('name')}, webViewLink: {file.get('webViewLink', '')}, id: {file['id']}")
                
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
                    'is_folder': is_folder,  # Include folders
                    'source_folder_id': folder_id,
                    'source_folder_url': folder_url
                }
                documents.append(doc)
            
            logger.info(f"Processed {len(documents)} documents from folder successfully")
            return documents
            
        except Exception as e:
            logger.error(f"Error listing documents from folder: {e}")
            # If any error occurs, fallback to recent files
            logger.warning("Falling back to recent files due to error")
            try:
                return await self._get_recent_documents(access_token)
            except Exception as fallback_error:
                logger.error(f"Fallback to recent files also failed: {fallback_error}")
                raise e
    
    async def _get_recent_documents(self, access_token: str = None) -> List[Dict[str, Any]]:
        """Get recent documents from Google Drive (fallback when folder is not accessible)"""
        try:
            logger.info("Fetching recent documents as fallback")
            
            # Query for recent documents (exclude folders)
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
                'pageSize': 50,  # Limit to 50 recent files
                'orderBy': 'modifiedTime desc',  # Order by most recent first
                'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
            }
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            # Add authorization header if access token is provided
            if access_token:
                headers['Authorization'] = f'Bearer {access_token}'
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers)
                
            if response.status_code != 200:
                logger.error(f"Recent documents API error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to fetch recent documents: {response.status_code} - {response.text}")
            
            data = response.json()
            files = data.get('files', [])
            
            logger.info(f"Found {len(files)} recent files")
            
            documents = []
            for file in files:
                # Get the actual MIME type from the file
                mime_type = file.get('mimeType', 'unknown')
                
                # Skip folders (double check)
                if 'folder' in mime_type:
                    continue
                
                # Get parent folder information
                parents = file.get('parents', [])
                parent_id = parents[0] if parents else None
                
                # Determine file type for display
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
                    'is_recent_fallback': True  # Mark as recent fallback
                }
                documents.append(doc)
            
            logger.info(f"Processed {len(documents)} recent documents successfully")
            return documents
            
        except Exception as e:
            logger.error(f"Error fetching recent documents: {e}")
            raise
    
    async def list_all_documents_from_folder(self, folder_url: str, access_token: str = None) -> List[Dict[str, Any]]:
        """List ALL documents from a folder and its subfolders (recursive) - NO FOLDERS in result"""
        try:
            logger.info(f"=== LIST ALL DOCUMENTS FROM FOLDER ===")
            logger.info(f"Folder URL: {folder_url}")
            logger.info(f"Access token available: {bool(access_token)}")
            
            # Extract folder ID from URL
            folder_id = self._extract_folder_id_from_url(folder_url)
            logger.info(f"Extracted folder ID: {folder_id}")
            
            # Get all documents recursively
            all_documents = []
            await self._get_documents_recursive(folder_id, access_token, all_documents, "")
            
            logger.info(f"Found {len(all_documents)} total documents in folder and subfolders")
            logger.info(f"Documents: {[doc.get('name') for doc in all_documents]}")
            return all_documents
            
        except Exception as e:
            logger.error(f"Error fetching all documents from folder: {e}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error details: {str(e)}")
            raise Exception(f"Failed to fetch all documents from folder: {str(e)}")
    
    async def _get_documents_recursive(self, folder_id: str, access_token: str, all_documents: List[Dict[str, Any]], current_folder_name: str = ""):
        """Recursively get all documents from a folder and its subfolders"""
        try:
            logger.info(f"=== RECURSIVE SEARCH IN FOLDER {folder_id} ===")
            logger.info(f"Current folder name: {current_folder_name}")
            
            # Query for documents and folders in the current folder
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
                'pageSize': 50,  # Reduced for better performance
                'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents)'
            }
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            # Add authorization header if access token is provided
            if access_token:
                headers['Authorization'] = f'Bearer {access_token}'
            
            logger.info(f"Making API request to: {url}")
            logger.info(f"Query: {query}")
            logger.info(f"Headers: {headers}")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers)
            
            logger.info(f"API Response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Drive API error: {response.status_code} - {response.text}")
                return
            
            data = response.json()
            files = data.get('files', [])
            
            logger.info(f"Found {len(files)} items in folder {folder_id}")
            logger.info(f"Files: {[f.get('name') for f in files]}")
            
            # Process each file
            for file in files:
                mime_type = file.get('mimeType', '')
                file_name = file.get('name', '')
                file_id = file.get('id', '')
                
                logger.info(f"Processing file: {file_name} (ID: {file_id}, MIME: {mime_type})")
                
                if mime_type == 'application/vnd.google-apps.folder':
                    # It's a folder, recurse into it
                    logger.info(f"Found subfolder: {file_name} (ID: {file_id}) - recursing...")
                    await self._get_documents_recursive(file_id, access_token, all_documents, file_name)
                else:
                    # It's a document, add to results
                    logger.info(f"Found document: {file_name} (ID: {file_id}) - adding to results")
                    
                    # Get parent folder information
                    parents = file.get('parents', [])
                    parent_id = parents[0] if parents else None
                    
                    # Determine file type for display
                    file_extension = self._get_file_extension(file_name)
                    if not file_extension:
                        file_extension = self._mime_to_extension(mime_type)
                    
                    # Create document object with subfolder info
                    document = {
                        'id': file_id,
                        'name': file_name,
                        'mime_type': mime_type,
                        'created_time': file.get('createdTime'),
                        'modified_time': file.get('modifiedTime'),
                        'web_view_link': file.get('webViewLink'),
                        'size': file.get('size'),
                        'parent_id': parent_id,
                        'is_folder': False,  # Always False for this function
                        'file_extension': file_extension,
                        'source_subfolder': current_folder_name if current_folder_name else None  # Only for subfolder documents
                    }
                    
                    all_documents.append(document)
                    logger.info(f"Added document to results: {file_name} from subfolder: {current_folder_name}")
            
        except Exception as e:
            logger.error(f"Error in recursive document fetch for folder {folder_id}: {e}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error details: {str(e)}")
            # Continue with other folders even if one fails
    
    async def get_document_content(self, access_token: str, document_id: str, mime_type: str = None) -> str:
        """Get the content of a document based on its type - optimized for memory usage"""
        try:
            # First get file metadata to determine the type
            if not mime_type:
                file_info = await self._get_file_info(access_token, document_id)
                mime_type = file_info.get('mimeType', '')
            
            logger.info(f"Extracting content for document {document_id} with MIME type: {mime_type}")
            
            # Memory optimization: Limit content size for very large documents
            MAX_CONTENT_SIZE = 1000000  # 1MB limit for content extraction
            
            # Handle different document types
            if mime_type == 'application/vnd.google-apps.document':
                # Google Docs - use Docs API
                return await self._get_google_doc_content(access_token, document_id)
            
            elif mime_type in ['application/pdf', 
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                             'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                             'text/plain',
                             'application/vnd.google-apps.presentation']:
                # Other file types - export as plain text
                return await self._export_file_as_text(access_token, document_id, mime_type)
            
            else:
                logger.warning(f"Unsupported MIME type: {mime_type}")
                return f"Content extraction not supported for file type: {mime_type}"
                
        except Exception as e:
            logger.error(f"Error getting document content for {document_id}: {e}")
            raise
    
    async def get_document_metadata(self, access_token: str, document_id: str) -> Dict[str, Any]:
        """Get document metadata for a specific document"""
        try:
            return await self._get_file_info(access_token, document_id)
        except Exception as e:
            logger.error(f"Error getting document metadata for {document_id}: {e}")
            return None
    
    async def _get_file_info(self, access_token: str, file_id: str) -> Dict[str, Any]:
        """Get file metadata from Drive API"""
        url = f"{self.drive_api_base}/files/{file_id}"
        headers = {'Authorization': f'Bearer {access_token}'}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
        if response.status_code != 200:
            raise Exception(f"Failed to get file info: {response.status_code}")
            
        return response.json()
    
    async def _get_google_doc_content(self, access_token: str, document_id: str) -> str:
        """Get content from Google Docs format"""
        url = f"{self.docs_api_base}/documents/{document_id}"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
        if response.status_code != 200:
            logger.error(f"Docs API error: {response.status_code} - {response.text}")
            raise Exception(f"Failed to fetch document content: {response.status_code}")
        
        document = response.json()
        
        # Extract text content
        content = self._extract_text_from_document(document)
        
        return content
    
    async def _export_file_as_text(self, access_token: str, file_id: str, mime_type: str) -> str:
        """Export file as plain text using Drive API"""
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            
            # Try multiple methods to extract content
            content = None
            
            # Method 1: For text files, download directly
            if mime_type == 'text/plain':
                url = f"{self.drive_api_base}/files/{file_id}?alt=media"
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    content = response.text
                    logger.info(f"Successfully extracted text file content: {len(content)} characters")
            
            # Method 2: Try exporting as plain text (works for Google Docs, Sheets, some PDFs)
            if not content:
                url = f"{self.drive_api_base}/files/{file_id}/export?mimeType=text/plain"
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    content = response.text
                    logger.info(f"Successfully exported as text: {len(content)} characters")
                else:
                    logger.warning(f"Export as text failed. Status: {response.status_code}, Response: {response.text[:200]}")
            
            # Method 3: For PDFs, try downloading and extracting with PyPDF
            if not content and mime_type == 'application/pdf':
                url = f"{self.drive_api_base}/files/{file_id}?alt=media"
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, headers=headers)
                if response.status_code == 200 and PDF_AVAILABLE:
                    try:
                        # Use PyPDF to extract text from PDF
                        pdf_content = response.content
                        pdf_reader = PdfReader(io.BytesIO(pdf_content))
                        
                        text_parts = []
                        for page_num, page in enumerate(pdf_reader.pages):
                            try:
                                page_text = page.extract_text()
                                if page_text.strip():
                                    text_parts.append(f"Page {page_num + 1}:\\n{page_text.strip()}")
                            except Exception as page_error:
                                logger.warning(f"Could not extract text from page {page_num + 1}: {page_error}")
                        
                        if text_parts:
                            content = "\\n\\n".join(text_parts)
                            logger.info(f"Successfully extracted PDF text: {len(content)} characters from {len(text_parts)} pages")
                        else:
                            # PDF exists but no text could be extracted (might be image-based)
                            file_info = await self._get_file_info(access_token, file_id)
                            file_name = file_info.get('name', 'Unknown')
                            content = f"""This is a PDF document named '{file_name}' with {len(pdf_reader.pages)} pages.

The PDF appears to contain images, scanned content, or complex formatting that prevents automatic text extraction. 
The document is available but may require manual review to access its content.

Based on the document structure, it likely contains information that could include:
- Scanned text or images
- Charts, graphs, or diagrams  
- Complex layouts or tables
- Non-standard fonts or formatting

Please describe what specific information you're looking for, and I can help guide you on how to access this content."""
                            logger.info(f"PDF found but text extraction yielded no results: {file_name}")
                    
                    except Exception as pdf_error:
                        logger.error(f"Error processing PDF with PyPDF: {pdf_error}")
                        file_info = await self._get_file_info(access_token, file_id)
                        file_name = file_info.get('name', 'Unknown')
                        content = f"PDF document '{file_name}' - text extraction encountered an error: {str(pdf_error)}"
                
                elif response.status_code == 200 and not PDF_AVAILABLE:
                    # PyPDF not available, create enhanced placeholder
                    file_info = await self._get_file_info(access_token, file_id)
                    file_name = file_info.get('name', 'Unknown')
                    content = f"PDF document '{file_name}' - PDF text extraction library not available. Please install pypdf for full PDF support."
                    logger.warning("PDF file found but pypdf library not available for text extraction")
                else:
                    logger.warning(f"Could not download PDF file. Status: {response.status_code}")
            
            # Method 4: For DOCX files, try downloading and extracting with python-docx
            elif not content and mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                url = f"{self.drive_api_base}/files/{file_id}?alt=media"
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, headers=headers)
                if response.status_code == 200 and DOCX_AVAILABLE:
                    try:
                        docx_content = response.content
                        doc = DocxDocument(io.BytesIO(docx_content))
                        
                        text_parts = []
                        for paragraph in doc.paragraphs:
                            if paragraph.text.strip():
                                text_parts.append(paragraph.text.strip())
                        
                        if text_parts:
                            content = "\\n\\n".join(text_parts)
                            logger.info(f"Successfully extracted DOCX text: {len(content)} characters")
                        else:
                            file_info = await self._get_file_info(access_token, file_id)
                            file_name = file_info.get('name', 'Unknown')
                            content = f"DOCX document '{file_name}' appears to be empty or contains only formatting."
                    
                    except Exception as docx_error:
                        logger.error(f"Error processing DOCX: {docx_error}")
                        file_info = await self._get_file_info(access_token, file_id)
                        file_name = file_info.get('name', 'Unknown')
                        content = f"DOCX document '{file_name}' - text extraction error: {str(docx_error)}"
                
                elif response.status_code == 200 and not DOCX_AVAILABLE:
                    file_info = await self._get_file_info(access_token, file_id)
                    file_name = file_info.get('name', 'Unknown')
                    content = f"DOCX document '{file_name}' - python-docx library not available for text extraction."
                    logger.warning("DOCX file found but python-docx library not available")
            
            # Method 5: Enhanced placeholders for other file types
            if not content:
                file_info = await self._get_file_info(access_token, file_id)
                file_name = file_info.get('name', 'Unknown')
                file_extension = self._mime_to_extension(mime_type).upper()
                
                content = f"""This is a {file_extension} document named '{file_name}'.
                
The document contains information that may include text, data, formatting, or other content typical of {file_extension} files.
While automatic text extraction is not available for this file format, the document is available in your Google Drive.

Please ask specific questions about what information you're looking for in this document, and I can help guide you 
on how to access or work with this type of file."""
                
                logger.info(f"Created enhanced placeholder for {file_extension}: {file_name}")
            
            # Validate content
            if content and len(content.strip()) > 20:
                return content.strip()
            else:
                # Last resort - basic placeholder
                file_extension = self._mime_to_extension(mime_type).upper()
                return f"Document of type {file_extension} - content extraction requires manual review"
                
        except Exception as e:
            logger.error(f"Error extracting content from {mime_type}: {e}")
            file_extension = self._mime_to_extension(mime_type).upper()
            return f"Error accessing {file_extension} file content - please check file accessibility"
    
    def _extract_text_from_document(self, document: Dict[str, Any]) -> str:
        """Extract plain text from Google Docs document structure"""
        try:
            content = document.get('body', {}).get('content', [])
            text_parts = []
            
            for element in content:
                if 'paragraph' in element:
                    paragraph = element['paragraph']
                    elements = paragraph.get('elements', [])
                    
                    for elem in elements:
                        if 'textRun' in elem:
                            text_content = elem['textRun'].get('content', '')
                            text_parts.append(text_content)
                
                elif 'table' in element:
                    # Handle tables
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
                                            text_content = elem['textRun'].get('content', '')
                                            text_parts.append(text_content)
            
            return ''.join(text_parts).strip()
            
        except Exception as e:
            logger.error(f"Error extracting text from document: {e}")
            return ""
    
    async def list_sheets(self, access_token: str) -> List[Dict[str, Any]]:
        """List all Google Sheets for the user (bonus feature)"""
        try:
            # Query for Google Sheets files using Drive API
            query = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
            url = f"{self.drive_api_base}/files"
            
            params = {
                'q': query,
                'pageSize': 50,  # Reduced for better performance
                'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size)'
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers)
                
            if response.status_code != 200:
                logger.error(f"Drive API error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to fetch sheets: {response.status_code}")
            
            data = response.json()
            files = data.get('files', [])
            
            documents = []
            for file in files:
                doc = {
                    'id': file['id'],
                    'name': file['name'],
                    'created_time': file.get('createdTime', ''),
                    'modified_time': file.get('modifiedTime', ''),
                    'web_view_link': file.get('webViewLink', ''),
                    'size': file.get('size'),
                    'mime_type': 'application/vnd.google-apps.spreadsheet'
                }
                documents.append(doc)
            
            return documents
            
        except Exception as e:
            logger.error(f"Error listing sheets: {e}")
            raise
    
    async def list_slides(self, access_token: str) -> List[Dict[str, Any]]:
        """List all Google Slides for the user (bonus feature)"""
        try:
            # Query for Google Slides files using Drive API
            query = "mimeType='application/vnd.google-apps.presentation' and trashed=false"
            url = f"{self.drive_api_base}/files"
            
            params = {
                'q': query,
                'pageSize': 50,  # Reduced for better performance
                'fields': 'files(id,name,createdTime,modifiedTime,webViewLink,size)'
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers)
                
            if response.status_code != 200:
                logger.error(f"Drive API error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to fetch slides: {response.status_code}")
            
            data = response.json()
            files = data.get('files', [])
            
            documents = []
            for file in files:
                doc = {
                    'id': file['id'],
                    'name': file['name'],
                    'created_time': file.get('createdTime', ''),
                    'modified_time': file.get('modifiedTime', ''),
                    'web_view_link': file.get('webViewLink', ''),
                    'size': file.get('size'),
                    'mime_type': 'application/vnd.google-apps.presentation'
                }
                documents.append(doc)
            
            return documents
            
        except Exception as e:
            logger.error(f"Error listing slides: {e}")
            raise