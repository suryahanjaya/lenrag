# ✅ Pre-Deployment Checklist

## 🔒 Security Fixes

- [x] **Next.js Security Vulnerability Fixed**
  - Upgraded from 14.2.33 to 14.2.35
  - Fixed CVE-2025-55184 (HIGH)
  - Fixed CVE-2025-67779 (HIGH)
  - Run: `npm install` to update package-lock.json

## 📝 Environment Configuration

### Railway Backend
- [ ] Copy API keys from `.env.railway` to Railway dashboard
- [ ] Set `RAILWAY_ENVIRONMENT=true`
- [ ] Set `BULK_UPLOAD_BATCH_SIZE=3`
- [ ] Set `EMBEDDING_BATCH_SIZE=1`
- [ ] Set `LOG_LEVEL=WARNING`
- [ ] Update `GOOGLE_REDIRECT_URI` with Railway backend URL
- [ ] Update `ALLOWED_ORIGINS` with Vercel frontend URL

### Vercel Frontend
- [ ] Set `NEXT_PUBLIC_BACKEND_URL` to Railway backend URL
- [ ] Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] Trigger redeployment after environment variable changes

### Google OAuth
- [ ] Add Railway backend redirect URI: `https://your-railway-backend.up.railway.app/auth/google`
- [ ] Add Vercel frontend redirect URI: `https://your-vercel-frontend.vercel.app/auth/callback`
- [ ] Verify CORS origins match in both Railway and Google Console

## 🧪 Testing

### Local Testing (Docker)
```bash
# 1. Build and run Docker
docker-compose up -d --build

# 2. Test login
# - Go to http://localhost:3000
# - Click "Sign in with Google"
# - Verify successful login

# 3. Test document upload (bulk)
# - Upload 10+ documents
# - Should process 60 at a time (fetch)
# - Should embed 15 at a time
# - Check logs for "HIGH PERFORMANCE MODE"

# 4. Test chat
# - Ask questions about uploaded documents
# - Verify responses are accurate
```

### Railway Testing
```bash
# 1. Deploy to Railway
# - Push to GitHub
# - Railway auto-deploys

# 2. Check logs
# - Should see "MEMORY CONSTRAINED MODE ACTIVE"
# - Should see "Bulk Upload Batch: 3 files"
# - Should see "Embedding Batch: 1 files"

# 3. Test small upload (1-5 documents)
# - Upload 3 documents
# - Should complete without OOM
# - Monitor Railway logs for memory usage

# 4. Test chat
# - Verify chat works with uploaded documents
```

### Vercel Testing
```bash
# 1. Deploy to Vercel
# - Push to GitHub or run `vercel --prod`

# 2. Test frontend
# - Verify UI loads correctly
# - Test login flow
# - Verify backend connection

# 3. Test document list
# - Should fetch from Railway backend
# - Verify CORS is working
```

## 🚨 Common Issues

### Issue 1: Railway OOM During Upload
**Symptoms**: "Out of Memory" error when uploading 5+ documents

**Solution**:
```bash
# Reduce batch sizes even more
BULK_UPLOAD_BATCH_SIZE=1
EMBEDDING_BATCH_SIZE=1
LOG_LEVEL=ERROR
```

### Issue 2: Vercel Can't Connect to Railway
**Symptoms**: CORS errors, 401 unauthorized

**Solution**:
```bash
# Railway: Update ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app

# Vercel: Update NEXT_PUBLIC_BACKEND_URL
NEXT_PUBLIC_BACKEND_URL=https://your-railway-backend.up.railway.app
```

### Issue 3: Google OAuth Redirect Mismatch
**Symptoms**: `redirect_uri_mismatch` error

**Solution**:
1. Go to Google Cloud Console
2. Add both URIs:
   - Railway: `https://your-railway-backend.up.railway.app/auth/google`
   - Vercel: `https://your-vercel-frontend.vercel.app/auth/callback`

### Issue 4: Slow Upload on Railway
**Symptoms**: Upload takes 30+ minutes for 10 documents

**Expected Behavior**:
- Railway processes 1 document at a time (embedding)
- 10 documents = ~10-15 minutes
- This is normal for free tier
- For faster uploads, use Docker/localhost

## 📊 Performance Expectations

### Docker (Local)
- 10 documents: ~1-2 minutes
- 100 documents: ~6-9 minutes
- 1000 documents: ~60-90 minutes

### Railway (Free Tier)
- 1 document: ~30-60 seconds
- 5 documents: ~3-5 minutes
- 10 documents: ~8-12 minutes
- **Max recommended**: 20 documents per upload

### Vercel (Frontend Only)
- Should not process documents
- Only serves UI
- Backend on Railway

## 🎯 Deployment Steps

### Step 1: Update Code
```bash
# 1. Ensure Next.js is updated
npm install

# 2. Commit changes
git add .
git commit -m "Security fix: Upgrade Next.js to 14.2.35"
git push origin main
```

### Step 2: Deploy Railway Backend
```bash
# 1. Railway auto-deploys from GitHub
# 2. Wait for deployment to complete
# 3. Copy Railway backend URL
# 4. Update environment variables in Railway dashboard
```

### Step 3: Deploy Vercel Frontend
```bash
# 1. Update NEXT_PUBLIC_BACKEND_URL in Vercel
# 2. Trigger redeployment
# 3. Wait for deployment to complete
# 4. Copy Vercel frontend URL
```

### Step 4: Update Google OAuth
```bash
# 1. Go to Google Cloud Console
# 2. Update redirect URIs with Railway and Vercel URLs
# 3. Save changes
```

### Step 5: Test Production
```bash
# 1. Visit Vercel frontend URL
# 2. Test login
# 3. Upload 1-3 documents
# 4. Test chat
# 5. Monitor Railway logs
```

## ✅ Final Verification

- [ ] Next.js version is 14.2.35 (check `package.json`)
- [ ] Railway shows "MEMORY CONSTRAINED MODE" in logs
- [ ] Railway batch sizes: 3 fetch, 1 embed
- [ ] Docker batch sizes: 60 fetch, 15 embed
- [ ] Google OAuth works on both Railway and Vercel
- [ ] CORS is configured correctly
- [ ] Small document upload works on Railway (1-5 docs)
- [ ] Bulk document upload works on Docker (50+ docs)
- [ ] Chat functionality works
- [ ] No OOM errors on Railway

## 📚 Reference Files

- `docs/DEPLOYMENT_GUIDE.md` - Full deployment instructions
- `docs/BATCH_SIZE_REFERENCE.md` - Batch size configurations
- `backend/.env.production` - Docker configuration
- `backend/.env.railway` - Railway configuration
- `backend/.env.vercel` - Vercel configuration

## 🎉 Success Criteria

Your deployment is successful when:
1. ✅ No security vulnerabilities in Railway deployment
2. ✅ Railway can upload 5-10 documents without OOM
3. ✅ Vercel frontend connects to Railway backend
4. ✅ Google OAuth works end-to-end
5. ✅ Chat functionality works with uploaded documents
6. ✅ Docker can handle bulk uploads (60+ documents)

## 🚀 Ready to Deploy?

If all checklist items are complete, you're ready to push to Railway and Vercel!

```bash
# Final command
git add .
git commit -m "Ready for production deployment"
git push origin main
```

Railway and Vercel will automatically deploy your changes.
