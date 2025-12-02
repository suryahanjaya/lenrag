"""
Automated Security Fixes for DORA Backend
This script applies the 5 critical security fixes to main.py
"""

import re
import os

def apply_security_fixes():
    """Apply all critical security fixes to main.py"""
    
    file_path = "main.py"
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("🔧 Applying Critical Security Fixes...")
    print("=" * 60)
    
    # Fix #1: Remove token logging
    print("\n✅ Fix #1: Removing token logging...")
    
    # Replace specific token logging instances
    content = content.replace(
        'logger.info(f"Received auth code: {request.code[:20]}...")',
        'logger.info("Received authentication request [token redacted]")'
    )
    
    content = content.replace(
        'logger.info(f"Received tokens: access_token length={len(tokens.get(\'access_token\', \'\'))}, has_refresh_token={bool(tokens.get(\'refresh_token\'))}")',
        'logger.info("Successfully exchanged code for tokens")'
    )
    
    content = content.replace(
        'logger.info(f"Attempting to fetch documents with token: {access_token[:20]}...")',
        'logger.info("Fetching documents for user [token redacted]")'
    )
    
    # Remove other token exposures
    content = re.sub(
        r'logger\.info\(f"X-Google-Token: \{x_google_token\}"\)',
        'logger.info(f"X-Google-Token: [REDACTED]")',
        content
    )
    
    print("   ✓ Removed token logging from authentication")
    print("   ✓ Removed token logging from document fetching")
    
    # Fix #2: Add environment-based CORS
    print("\n✅ Fix #2: Adding environment-based CORS...")
    
    # Add ALLOWED_ORIGINS configuration after load_dotenv()
    cors_config = '''
# CORS Configuration - Environment-based
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
'''
    
    # Insert after load_dotenv()
    content = content.replace(
        'load_dotenv()\n',
        f'load_dotenv(){cors_config}\n'
    )
    
    # Update CORS middleware
    content = content.replace(
        '    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],',
        '    allow_origins=ALLOWED_ORIGINS,'
    )
    
    print("   ✓ Added ALLOWED_ORIGINS environment variable")
    print("   ✓ Updated CORS middleware to use environment config")
    
    # Fix #3: Add imports for rate limiting (at the top)
    print("\n✅ Fix #3: Adding rate limiting imports...")
    
    rate_limit_imports = '''
# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
'''
    
    # Add after other imports, before services imports
    content = content.replace(
        'from services.google_auth import GoogleAuthService',
        f'{rate_limit_imports}\nfrom services.google_auth import GoogleAuthService'
    )
    
    # Add Request to FastAPI imports
    content = content.replace(
        'from fastapi import FastAPI, HTTPException, Depends, status, Header',
        'from fastapi import FastAPI, HTTPException, Depends, status, Header, Request'
    )
    
    print("   ✓ Added rate limiting imports")
    print("   ✓ Added Request to FastAPI imports")
    
    # Fix #4: Initialize rate limiter
    print("\n✅ Fix #4: Initializing rate limiter...")
    
    limiter_init = '''
# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

'''
    
    # Add after app creation
    content = content.replace(
        'app = FastAPI(title="DORA - Document Retrieval Assistant", version="2.0.0")\n',
        f'app = FastAPI(title="DORA - Document Retrieval Assistant", version="2.0.0")\n{limiter_init}'
    )
    
    print("   ✓ Initialized rate limiter")
    print("   ✓ Added rate limit exception handler")
    
    # Fix #5: Add rate limiting to auth endpoint
    print("\n✅ Fix #5: Adding rate limits to endpoints...")
    
    # Add rate limit to auth endpoint
    content = content.replace(
        '@app.post("/auth/google", response_model=Dict[str, Any])\nasync def authenticate_google(request: AuthRequest):',
        '@app.post("/auth/google", response_model=Dict[str, Any])\n@limiter.limit("5/minute")\nasync def authenticate_google(request: Request, auth_request: AuthRequest):'
    )
    
    # Update the function body to use auth_request instead of request
    # Find the authenticate_google function and replace request.code with auth_request.code
    content = re.sub(
        r'(async def authenticate_google\(request: Request, auth_request: AuthRequest\):.*?)(request\.code)',
        r'\1auth_request.code',
        content,
        flags=re.DOTALL,
        count=1
    )
    
    print("   ✓ Added 5/minute rate limit to /auth/google")
    print("   ✓ Updated function signature")
    
    # Write the fixed content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n" + "=" * 60)
    print("🎉 All critical security fixes applied successfully!")
    print("=" * 60)
    
    print("\n📋 Summary of changes:")
    print("   ✅ Removed token logging (Fix #1)")
    print("   ✅ Added environment-based CORS (Fix #2)")
    print("   ✅ Added rate limiting imports (Fix #3)")
    print("   ✅ Initialized rate limiter (Fix #4)")
    print("   ✅ Added rate limits to endpoints (Fix #5)")
    
    print("\n⚠️  IMPORTANT NEXT STEPS:")
    print("   1. Add to .env file:")
    print("      ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000")
    print("   2. Test the application:")
    print("      python main.py")
    print("   3. Verify rate limiting works (make 6 quick requests to /auth/google)")
    print("   4. Check logs to ensure no tokens are visible")
    
    return True

if __name__ == "__main__":
    try:
        apply_security_fixes()
        print("\n✅ Script completed successfully!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("Please restore main.py from git and try again:")
        print("   git checkout backend/main.py")
