# Login Loop Fix - Docker Production

## Problem
After successful Google OAuth login, the application redirects back to the sign-in page without any error logs in Docker production environment.

## Root Cause
The `redirect_uri` parameter sent to the backend during OAuth token exchange was using the **backend URL** instead of the **frontend URL**. This caused a mismatch with the redirect URI registered in Google Cloud Console.

### What Was Wrong:
```typescript
// ❌ WRONG - Using backend URL
redirect_uri: `${backendUrl}/auth/callback`
```

Google OAuth expects the `redirect_uri` to match **exactly** what's registered in Google Cloud Console, which should be the frontend callback URL (e.g., `http://localhost:3000/auth/callback`), not the backend URL.

## Solution

### 1. Fixed Frontend Callback (`app/auth/callback/page.tsx`)
```typescript
// ✅ CORRECT - Using frontend URL
const frontendUrl = window.location.origin
redirect_uri: `${frontendUrl}/auth/callback`
```

### 2. Added Backend Environment Variable (`backend/.env.production`)
```bash
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

This ensures the backend's `GoogleAuthService` uses the correct redirect URI when exchanging the authorization code for tokens.

## Why This Happened
The confusion arose because:
1. The frontend sends the authorization code to the backend
2. The backend exchanges this code with Google OAuth
3. Google validates that the `redirect_uri` matches what was used during the initial authorization request
4. If they don't match, Google rejects the token exchange (silently in some cases)

## Verification Steps
1. Rebuild Docker containers:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

2. Check backend logs:
   ```bash
   docker logs dora-backend-prod -f
   ```

3. Test login flow:
   - Navigate to `http://localhost:3000`
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Should redirect to home page with user logged in

## Google Cloud Console Configuration
Ensure your Google Cloud Console has these redirect URIs:
- `http://localhost:3000/auth/callback` (for local Docker)
- `http://127.0.0.1:3000/auth/callback` (alternative localhost)
- Your production domain callback URL (when deploying)

## Related Files
- `app/auth/callback/page.tsx` - Frontend OAuth callback handler
- `backend/.env.production` - Backend production environment variables
- `backend/services/google_auth.py` - Google OAuth service (line 16)
- `docker-compose.prod.yml` - Docker production configuration

## Prevention
Always remember:
- `redirect_uri` = Frontend callback URL (where user lands after OAuth)
- Backend URL = API endpoint for token exchange
- These are **different** and should not be confused
