import os
import httpx
from utils.http_client import get_http_client
import traceback
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
            logger.info(f"Access token available: {bool(access_token)}")
            
            folder_id = self._extract_folder_id_from_url(folder_url)
            logger.info(f"Extracted ID: {folder_id}")
            
            # Check if it's a file or folder
            try:
                # Request specific fields to ensure we have all necessary data
                fields = 'id,name,createdTime,modifiedTime,webViewLink,size,mimeType,parents'
                file_info = await self._get_file_info(access_token, folder_id, fields=fields)
                
                if file_info.get('mimeType') != 'application/vnd.google-apps.folder':
                    logger.info(f"URL points to a single file, not a folder. Returning single document.")
                    
                    mime_type = file_info.get('mimeType', 'unknown')
                    file_name = file_info.get('name', '')
                    
                    file_extension = self._get_file_extension(file_name)
                    if not file_extension:
                        file_extension = self._mime_to_extension(mime_type)
                    
                    doc = {
                        'id': file_info.get('id'),
                        'name': file_name,
                        'mime_type': mime_type,
                        'created_time': file_info.get('createdTime'),
                        'modified_time': file_info.get('modifiedTime'),
                        'web_view_link': file_info.get('webViewLink'),
                        'size': file_info.get('size'),
                        'parent_id': None,
                        'is_folder': False,
                        'file_extension': file_extension,
                        'source_subfolder': None
                    }
                    return [doc]
            except Exception as e:
                logger.warning(f"Could not verify ID type, assuming folder: {e}")
            
            all_documents = []
            await self._get_documents_recursive(folder_id, access_token, all_documents, "")
            
            logger.info(f"Found {len(all_documents)} total documents in folder and subfolders")
            logger.debug(f"Documents: {[doc.get('name') for doc in all_documents]}")
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
            
            logger.info(f"Making API request to: {url}")
            
            # Use connection pooling
            client = await get_http_client()
            response = await client.get(url, params=params, headers=headers)
            
            logger.info(f"API Response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Drive API error: {response.status_code} - {response.text}")
                return
            
            data = response.json()
            files = data.get('files', [])
            
            logger.info(f"Found {len(files)} items in folder {folder_id}")
            
            for file in files:
                mime_type = file.get('mimeType', '')
                file_name = file.get('name', '')
                file_id = file.get('id', '')
                
                logger.debug(f"Processing file: {file_name} (ID: {file_id}, MIME: {mime_type})")
                
                if mime_type == 'application/vnd.google-apps.folder':
                    logger.info(f"Found subfolder: {file_name} (ID: {file_id}) - recursing...")
                    await self._get_documents_recursive(file_id, access_token, all_documents, file_name)
                else:
                    logger.debug(f"Found document: {file_name} (ID: {file_id}) - adding to results")
                    
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
                    logger.debug(f"Added document to results: {file_name} from subfolder: {current_folder_name}")
            
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