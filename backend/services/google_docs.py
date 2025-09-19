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
        """List all document files (.docx, .pdf, .txt, .pptx, Google Docs) and folders for the user"""
        try:
            # Query for various document types AND folders using Drive API
            # Include: Word docs, PDFs, text files, PowerPoint, Google Docs, and folders
            query = ("(mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or "
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
                'pageSize': 1000,  # Increased to get more files and folders
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
                    'is_folder': mime_type == 'application/vnd.google-apps.folder'
                }
                documents.append(doc)
            
            logger.info(f"Processed {len(documents)} Google Docs successfully")
            return documents
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            raise
    
    async def get_folder_hierarchy(self, access_token: str) -> Dict[str, Any]:
        """Get folder hierarchy and organize documents by folders"""
        try:
            # Get all documents and folders
            all_items = await self.list_documents(access_token)
            
            # Separate folders and documents
            folders = [item for item in all_items if item.get('is_folder', False)]
            documents = [item for item in all_items if not item.get('is_folder', False)]
            
            # Build folder hierarchy
            folder_map = {folder['id']: folder for folder in folders}
            
            # Build folder tree structure
            def build_folder_tree(parent_id=None, level=0):
                children = []
                for folder in folders:
                    if folder.get('parent_id') == parent_id:
                        folder_info = {
                            'id': folder['id'],
                            'name': folder['name'],
                            'parent_id': folder.get('parent_id'),
                            'level': level,
                            'children': build_folder_tree(folder['id'], level + 1)
                        }
                        children.append(folder_info)
                return children
            
            # Get root folders (folders with no parent or parent not in our list)
            root_folders = build_folder_tree()
            
            # Organize documents by folder
            documents_by_folder = {}
            for doc in documents:
                parent_id = doc.get('parent_id')
                if parent_id not in documents_by_folder:
                    documents_by_folder[parent_id] = []
                documents_by_folder[parent_id].append(doc)
            
            return {
                'folders': folders,
                'documents': documents,
                'folder_tree': root_folders,
                'documents_by_folder': documents_by_folder,
                'folder_map': folder_map
            }
            
        except Exception as e:
            logger.error(f"Error getting folder hierarchy: {e}")
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
    
    async def get_document_content(self, access_token: str, document_id: str, mime_type: str = None) -> str:
        """Get the content of a document based on its type"""
        try:
            # First get file metadata to determine the type
            if not mime_type:
                file_info = await self._get_file_info(access_token, document_id)
                mime_type = file_info.get('mimeType', '')
            
            logger.info(f"Extracting content for document {document_id} with MIME type: {mime_type}")
            
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
                'pageSize': 100,
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
                'pageSize': 100,
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