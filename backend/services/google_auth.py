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
        # Use environment variable for redirect_uri, fallback to localhost
        self.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/callback")
        self.scopes = [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/documents.readonly'
        ]
        
        # Log configuration (without sensitive data)
        logger.info(f"GoogleAuthService initialized with redirect_uri: {self.redirect_uri}")
        logger.info(f"Client ID configured: {bool(self.client_id)}")
        logger.info(f"Client Secret configured: {bool(self.client_secret)}")
    
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
            
            # Log request details (without sensitive data)
            logger.info(f"Exchanging authorization code for tokens...")
            logger.info(f"Token URL: {token_url}")
            logger.info(f"Redirect URI: {self.redirect_uri}")
            logger.info(f"Code length: {len(code)} characters")
            logger.info(f"Grant type: authorization_code")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(token_url, data=data)
                
            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"Token exchange failed with status {response.status_code}")
                logger.error(f"Error response: {error_detail}")
                logger.error(f"Request redirect_uri: {self.redirect_uri}")
                logger.error(f"Client ID (first 20 chars): {self.client_id[:20] if self.client_id else 'None'}...")
                
                # Parse error for more details
                try:
                    error_json = response.json()
                    error_type = error_json.get('error', 'unknown')
                    error_desc = error_json.get('error_description', 'No description')
                    
                    if error_type == 'invalid_grant':
                        logger.error("INVALID_GRANT ERROR - Possible causes:")
                        logger.error("1. Authorization code already used or expired")
                        logger.error("2. Redirect URI mismatch between request and Google Console")
                        logger.error("3. Code was issued to a different client_id")
                        logger.error(f"   Current redirect_uri: {self.redirect_uri}")
                        logger.error(f"   Please verify this matches EXACTLY in Google Cloud Console")
                except:
                    pass
                
                raise Exception(f"Token exchange failed: {response.text}")
            
            tokens = response.json()
            logger.info("Successfully exchanged code for tokens")
            logger.info(f"Received access_token: {bool(tokens.get('access_token'))}")
            logger.info(f"Received refresh_token: {bool(tokens.get('refresh_token'))}")
            return tokens
            
        except Exception as e:
            logger.error(f"Error exchanging code for tokens: {e}")
            raise
    
    async def get_user_info(self, access_token: str) -> dict:
        """Get user information from Google using access token"""
        try:
            # Try the newer endpoint first
            user_info_url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={access_token}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(user_info_url)
                
                if response.status_code != 200:
                    # Use DEBUG instead of WARNING - this is normal fallback behavior
                    logger.debug(f"v3 endpoint failed, trying v2: {response.text}")
                    # Fallback to v2 endpoint (still within same client context)
                    user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
                    response = await client.get(user_info_url)
                    
                    if response.status_code != 200:
                        # Don't log if it's just invalid/expired token
                        if "UNAUTHENTICATED" not in response.text and "Invalid Credentials" not in response.text:
                            logger.error(f"Failed to get user info from both endpoints: {response.text}")
                        raise Exception(f"Failed to get user info: {response.text}")
                
                user_info = response.json()
            
            logger.info(f"Google user info received: {user_info}")
            
            # Ensure picture field exists
            if 'picture' not in user_info or not user_info.get('picture'):
                logger.warning("No picture field in user info, trying to get from People API")
                # Try to get profile picture from Google People API
                try:
                    people_url = f"https://people.googleapis.com/v1/people/me?personFields=photos&access_token={access_token}"
                    async with httpx.AsyncClient() as client:
                        people_response = await client.get(people_url)
                        if people_response.status_code == 200:
                            people_data = people_response.json()
                            if 'photos' in people_data and people_data['photos']:
                                # Get the first photo URL
                                photo_url = people_data['photos'][0].get('url')
                                if photo_url:
                                    user_info['picture'] = photo_url
                                    logger.info(f"Got profile picture from People API: {photo_url}")
                except Exception as people_error:
                    logger.warning(f"Failed to get picture from People API: {people_error}")
                
                if 'picture' not in user_info:
                    user_info['picture'] = None
            
            return user_info
            
        except Exception as e:
            # Don't log common auth failures (expired/invalid tokens) - too verbose
            error_msg = str(e)
            if "UNAUTHENTICATED" not in error_msg and "Invalid Credentials" not in error_msg:
                # Only log unexpected errors
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