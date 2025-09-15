import os
import httpx
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
import json
import logging

logger = logging.getLogger(__name__)

class GoogleAuthService:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.redirect_uri = "http://localhost:3000/auth/callback"
        self.scopes = [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/documents.readonly'
        ]
    
    async def exchange_code_for_tokens(self, code: str) -> dict:
        """Exchange authorization code for access and refresh tokens"""
        try:
            token_url = "https://oauth2.googleapis.com/token"
            
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": self.redirect_uri
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(token_url, data=data)
                
            if response.status_code != 200:
                logger.error(f"Token exchange failed: {response.text}")
                raise Exception(f"Token exchange failed: {response.text}")
            
            tokens = response.json()
            return tokens
            
        except Exception as e:
            logger.error(f"Error exchanging code for tokens: {e}")
            raise
    
    async def get_user_info(self, access_token: str) -> dict:
        """Get user information from Google using access token"""
        try:
            user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(user_info_url)
            
            if response.status_code != 200:
                logger.error(f"Failed to get user info: {response.text}")
                raise Exception(f"Failed to get user info: {response.text}")
            
            user_info = response.json()
            return user_info
            
        except Exception as e:
            logger.error(f"Error getting user info: {e}")
            raise
    
    async def refresh_access_token(self, refresh_token: str) -> dict:
        """Refresh access token using refresh token"""
        try:
            token_url = "https://oauth2.googleapis.com/token"
            
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(token_url, data=data)
            
            if response.status_code != 200:
                logger.error(f"Token refresh failed: {response.text}")
                raise Exception(f"Token refresh failed: {response.text}")
            
            tokens = response.json()
            return tokens
            
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            raise
    
    def get_authorization_url(self) -> str:
        """Generate Google OAuth authorization URL"""
        auth_url = (
            f"https://accounts.google.com/o/oauth2/auth?"
            f"response_type=code&"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"scope={'+'.join(self.scopes)}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        return auth_url