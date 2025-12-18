# 🚀 Deployment Guide - Railway & Vercel

## ✅ Security Fixes Applied

### Next.js Security Vulnerability Fixed
- **Previous Version**: 14.2.33 (HIGH severity vulnerabilities)
- **New Version**: 14.2.35
- **CVEs Fixed**:
  - CVE-2025-55184 (HIGH)
  - CVE-2025-67779 (HIGH)

## 📊 Environment-Specific Batch Sizes

### Docker/Localhost (High Performance)
- **Fetch Batch**: 60 documents in parallel
- **Embedding Batch**: 15 documents in parallel
- **Memory**: Unlimited (depends on your system)
- **Best for**: Bulk uploads (100+ documents)

### Railway (Memory Constrained - 512MB)
- **Fetch Batch**: 3 documents in parallel
- **Embedding Batch**: 1 document at a time
- **Memory**: 512MB (free tier)
- **Best for**: Small uploads (1-10 documents)
- **Config File**: `backend/.env.railway`

### Vercel (Memory Constrained - 512MB)
- **Fetch Batch**: 1 document at a time
- **Embedding Batch**: 1 document at a time
- **Memory**: 512MB (free tier)
- **Best for**: Frontend only (backend on Railway)
- **Config File**: `backend/.env.vercel`

## 🔧 Deployment Instructions

### 1. Railway Backend Deployment

#### Step 1: Update Environment Variables
Copy values from `backend/.env.railway` to Railway dashboard:

```bash
# Required API Keys
GROQ_API_KEY=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
GEMINI_API_KEY=AIzaSyAbKheqy2BnPMepiZeY8HshEVvUN7xj2Lg

# Google OAuth
GOOGLE_CLIENT_ID=1037561815320-nto28rqlmfj2os81om1mm6tgjpuk85gs.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Memory Optimization (CRITICAL!)
ENVIRONMENT=production
LOG_LEVEL=WARNING
RAILWAY_ENVIRONMENT=true
BULK_UPLOAD_BATCH_SIZE=3
EMBEDDING_BATCH_SIZE=1

# Update these with your actual URLs
GOOGLE_REDIRECT_URI=https://your-railway-backend.up.railway.app/auth/google
ALLOWED_ORIGINS=https://your-vercel-frontend.vercel.app
```

#### Step 2: Update Google OAuth Redirect URIs
Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
1. Select your OAuth 2.0 Client ID
2. Add Authorized redirect URIs:
   - `https://your-railway-backend.up.railway.app/auth/google`
   - `https://your-vercel-frontend.vercel.app/auth/callback`

#### Step 3: Deploy to Railway
```bash
# Railway will automatically detect and deploy
# No additional commands needed
```

### 2. Vercel Frontend Deployment

#### Step 1: Update Environment Variables
Add these in Vercel dashboard:

```bash
# Backend URL (Update with your Railway backend URL)
NEXT_PUBLIC_BACKEND_URL=https://your-railway-backend.up.railway.app

# Google OAuth (Same as Railway)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1037561815320-nto28rqlmfj2os81om1mm6tgjpuk85gs.apps.googleusercontent.com
```

#### Step 2: Deploy to Vercel
```bash
# Vercel will automatically detect and deploy
# Or manually trigger deployment
vercel --prod
```

### 3. Docker Production Deployment

#### Step 1: Use Production Environment
```bash
# Copy production environment file
cp backend/.env.production backend/.env

# Build and run with Docker Compose
docker-compose -f docker-compose.yml up -d --build
```

#### Step 2: Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## ⚠️ Important Notes

### Memory Constraints
1. **Railway/Vercel Free Tier**: 512MB RAM limit
   - Can only process 1-3 documents at a time
   - For bulk uploads (60+ files), use Docker/localhost
   
2. **Docker/Localhost**: No memory limit
   - Can process 60 documents in parallel
   - Recommended for bulk operations

### Batch Size Recommendations

| Environment | Documents | Fetch Batch | Embed Batch | Time Estimate |
|-------------|-----------|-------------|-------------|---------------|
| Docker      | 100 docs  | 60          | 15          | ~5-10 min     |
| Railway     | 10 docs   | 3           | 1           | ~5-10 min     |
| Vercel      | 1 doc     | 1           | 1           | ~30-60 sec    |

### OOM Prevention
If you still get OOM errors on Railway/Vercel:
1. Reduce `BULK_UPLOAD_BATCH_SIZE` to 1
2. Reduce `EMBEDDING_BATCH_SIZE` to 1
3. Set `LOG_LEVEL=ERROR` (less logging = less memory)
4. Consider upgrading to paid tier for more memory

## 🔍 Troubleshooting

### Railway OOM Errors
```bash
# Symptoms: "Out of Memory" error during bulk upload
# Solution: Reduce batch sizes
BULK_UPLOAD_BATCH_SIZE=1
EMBEDDING_BATCH_SIZE=1
```

### Vercel Deployment Errors
```bash
# Symptoms: Build fails or runtime errors
# Solution: Ensure environment variables are set
NEXT_PUBLIC_BACKEND_URL=https://your-railway-backend.up.railway.app
```

### Google OAuth Errors
```bash
# Symptoms: redirect_uri_mismatch
# Solution: Update Google Cloud Console with correct URIs
# Railway: https://your-railway-backend.up.railway.app/auth/google
# Vercel: https://your-vercel-frontend.vercel.app/auth/callback
```

## 📝 Post-Deployment Checklist

- [ ] Next.js upgraded to 14.2.35 (security fix)
- [ ] Railway environment variables configured
- [ ] Vercel environment variables configured
- [ ] Google OAuth redirect URIs updated
- [ ] CORS origins configured correctly
- [ ] Test login flow
- [ ] Test document upload (1-3 documents on Railway)
- [ ] Test chat functionality
- [ ] Monitor Railway logs for OOM errors

## 🎯 Recommended Workflow

1. **Development**: Use Docker/localhost for development and bulk uploads
2. **Production (Small Scale)**: Use Railway + Vercel for small-scale production
3. **Production (Large Scale)**: Use Docker on VPS/cloud for bulk operations

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)
