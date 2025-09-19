from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class AuthRequest(BaseModel):
    code: str = Field(..., description="Google OAuth authorization code")

class DocumentResponse(BaseModel):
    id: str
    name: str
    created_time: str
    modified_time: str
    web_view_link: str
    size: Optional[str] = None
    mime_type: str
    source_subfolder: Optional[str] = None

class AddDocumentsRequest(BaseModel):
    document_ids: List[str] = Field(..., description="List of Google Doc IDs to add")

class FolderRequest(BaseModel):
    folder_url: str = Field(..., description="Google Drive folder URL or folder ID")

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's chat message")

class SourceInfo(BaseModel):
    id: str
    name: str
    type: str
    link: Optional[str] = None

class ChatResponse(BaseModel):
    message: str
    sources: List[SourceInfo] = Field(default_factory=list)
    from_documents: bool = Field(default=False)
    fallback_used: bool = Field(default=False)

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

class DocumentChunk(BaseModel):
    chunk_id: str
    document_id: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SearchResult(BaseModel):
    document_id: str
    chunk_id: str
    content: str
    score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)