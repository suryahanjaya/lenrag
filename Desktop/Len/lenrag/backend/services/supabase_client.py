import os
from supabase import create_client, Client
from typing import Dict, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for backend
        
        # Check if we have valid Supabase credentials
        if not supabase_url or not supabase_key or supabase_url == "your_supabase_url_here" or supabase_key == "your_supabase_service_role_key_here":
            logger.warning("Supabase credentials not found or are placeholders. Running in development mode.")
            self.supabase = None
        else:
            try:
                self.supabase: Client = create_client(supabase_url, supabase_key)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.supabase = None
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token and return user data"""
        try:
            if not self.supabase:
                # For development, create a mock user
                return {
                    'id': 'dev-user-123',
                    'email': 'dev@example.com',
                    'name': 'Development User'
                }
            
            user = self.supabase.auth.get_user(token)
            return user.user.model_dump() if user.user else None
            
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise
    
    async def create_or_update_user(
        self, 
        user_info: Dict[str, Any], 
        google_access_token: str,
        google_refresh_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create or update user in Supabase"""
        try:
            if not self.supabase:
                # For development, return mock user
                return {
                    'id': 'dev-user-123',
                    'email': user_info.get('email', 'dev@example.com'),
                    'name': user_info.get('name', 'Development User'),
                    'picture': user_info.get('picture'),
                    'created_at': datetime.utcnow().isoformat()
                }
            
            # Check if user exists
            existing_user = self.supabase.table('users').select('*').eq('email', user_info['email']).execute()
            
            user_data = {
                'email': user_info['email'],
                'name': user_info['name'],
                'picture': user_info.get('picture'),
                'google_access_token': google_access_token,
                'google_refresh_token': google_refresh_token,
                'last_login': datetime.utcnow().isoformat()
            }
            
            if existing_user.data:
                # Update existing user
                result = self.supabase.table('users').update(user_data).eq('email', user_info['email']).execute()
                return result.data[0] if result.data else existing_user.data[0]
            else:
                # Create new user
                user_data['created_at'] = datetime.utcnow().isoformat()
                result = self.supabase.table('users').insert(user_data).execute()
                return result.data[0] if result.data else user_data
            
        except Exception as e:
            logger.error(f"Error creating/updating user: {e}")
            # For development, return mock user
            return {
                'id': 'dev-user-123',
                'email': user_info.get('email', 'dev@example.com'),
                'name': user_info.get('name', 'Development User'),
                'picture': user_info.get('picture'),
                'created_at': datetime.utcnow().isoformat()
            }
    
    async def get_user_google_token(self, user_id: str) -> Optional[str]:
        """Get user's Google access token"""
        try:
            if not self.supabase:
                # For development mode, we need to get the token from the user session
                # This will be passed directly from the frontend
                return None  # Will be handled by the calling function
            
            result = self.supabase.table('users').select('google_access_token').eq('id', user_id).execute()
            
            if result.data:
                return result.data[0].get('google_access_token')
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user Google token: {e}")
            return None
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile information"""
        try:
            if not self.supabase:
                # For development, return mock profile
                return {
                    'id': user_id,
                    'email': 'dev@example.com',
                    'name': 'Development User',
                    'picture': None,
                    'created_at': datetime.utcnow().isoformat(),
                    'last_login': datetime.utcnow().isoformat()
                }
            
            result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            
            if result.data:
                return result.data[0]
            
            raise Exception("User not found")
            
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            raise
    
    async def store_document_metadata(
        self, 
        user_id: str, 
        document_id: str, 
        document_name: str,
        document_type: str = 'google_doc'
    ):
        """Store document metadata in Supabase"""
        try:
            if not self.supabase:
                logger.info(f"Mock: Storing document {document_id} for user {user_id}")
                return
            
            data = {
                'user_id': user_id,
                'document_id': document_id,
                'document_name': document_name,
                'document_type': document_type,
                'added_at': datetime.utcnow().isoformat()
            }
            
            # Check if document already exists
            existing = self.supabase.table('user_documents').select('*').eq('user_id', user_id).eq('document_id', document_id).execute()
            
            if not existing.data:
                self.supabase.table('user_documents').insert(data).execute()
            
        except Exception as e:
            logger.error(f"Error storing document metadata: {e}")
    
    async def remove_document_metadata(self, user_id: str, document_id: str):
        """Remove document metadata from Supabase"""
        try:
            if not self.supabase:
                logger.info(f"Mock: Removing document {document_id} for user {user_id}")
                return
            
            self.supabase.table('user_documents').delete().eq('user_id', user_id).eq('document_id', document_id).execute()
            
        except Exception as e:
            logger.error(f"Error removing document metadata: {e}")
    
    async def get_user_documents(self, user_id: str) -> list:
        """Get list of documents added by user"""
        try:
            if not self.supabase:
                return []  # Mock empty list for development
            
            result = self.supabase.table('user_documents').select('*').eq('user_id', user_id).execute()
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting user documents: {e}")
            return []