# 🚀 Deployment Guide - Vercel & Railway

## 📋 Overview

Panduan lengkap untuk deploy DORA ke:
- **Vercel** - Frontend (Next.js)
- **Railway** - Backend (FastAPI)

---

## 🎯 Vercel Deployment (Frontend)

### **Step 1: Connect Repository**

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import repository: `lenrag`
4. Vercel akan auto-detect Next.js

### **Step 2: Configure Build Settings**

Vercel akan auto-detect, tapi pastikan:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### **Step 3: Environment Variables**

Tambahkan di **Settings** → **Environment Variables**:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your_google_client_id>
NEXT_PUBLIC_API_URL=<your_railway_backend_url>
```

**Contoh:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

### **Step 4: Deploy**

1. Click **"Deploy"**
2. Tunggu build selesai (~2-3 menit)
3. Vercel akan memberikan URL: `https://your-app.vercel.app`

### **Step 5: Update Google OAuth**

Setelah dapat URL Vercel, update di [Google Cloud Console](https://console.cloud.google.com/):

1. **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   ```

2. **Authorized redirect URIs**:
   ```
   https://your-app.vercel.app/auth/callback
   ```

---

## 🚂 Railway Deployment (Backend)

### **Step 1: Create New Project**

1. Buka [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose repository: `lenrag`

### **Step 2: Configure Service**

1. Railway akan detect Python app
2. Set **Root Directory**: `backend`
3. Set **Start Command**: 
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### **Step 3: Environment Variables**

Tambahkan di **Variables** tab:

```env
# API Keys
GROQ_API_KEY=<your_groq_api_key>
GEMINI_API_KEY=<your_gemini_api_key>

# Google OAuth
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_REDIRECT_URI=https://your-vercel-app.vercel.app/auth/callback

# Environment
ENVIRONMENT=production
LOG_LEVEL=INFO

# CORS - IMPORTANT!
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-app.vercel.app

# ChromaDB
CHROMA_PERSIST_DIRECTORY=./chroma_db

# RAG Configuration
CHUNK_SIZE=850
CHUNK_OVERLAP=85
BULK_UPLOAD_BATCH_SIZE=60
EMBEDDING_BATCH_SIZE=15

# LLM Provider (groq or gemini)
LLM_PROVIDER=groq
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=2048
```

### **Step 4: Deploy**

1. Click **"Deploy"**
2. Railway akan build dan deploy (~3-5 menit)
3. Railway akan memberikan URL: `https://your-app.up.railway.app`

### **Step 5: Update Vercel Environment**

Setelah dapat Railway URL, update di Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

Redeploy Vercel untuk apply changes.

---

## ✅ Verification Checklist

### **Frontend (Vercel)**
- [ ] Build successful
- [ ] Environment variables set
- [ ] Google OAuth configured
- [ ] Can access homepage
- [ ] Can login with Google

### **Backend (Railway)**
- [ ] Build successful
- [ ] All environment variables set
- [ ] Health endpoint works: `https://your-app.up.railway.app/health`
- [ ] CORS configured correctly
- [ ] Can authenticate from frontend

### **Integration**
- [ ] Frontend can connect to backend
- [ ] Google OAuth flow works end-to-end
- [ ] Can upload documents
- [ ] Can chat with documents

---

## 🔧 Troubleshooting

### **Vercel Build Fails**

**Error**: Missing environment variables
**Solution**: Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_API_URL`

**Error**: Build timeout
**Solution**: Check `package.json` dependencies, remove unused packages

### **Railway Build Fails**

**Error**: Missing dependencies
**Solution**: Check `backend/requirements.txt` is complete

**Error**: Port binding error
**Solution**: Ensure start command uses `--port $PORT`

### **CORS Errors**

**Error**: "Access-Control-Allow-Origin" error
**Solution**: 
1. Check `ALLOWED_ORIGINS` in Railway includes Vercel URL
2. Format: `https://app1.vercel.app,https://app2.vercel.app` (no spaces!)

### **Google OAuth Fails**

**Error**: "redirect_uri_mismatch"
**Solution**:
1. Update Google Cloud Console with exact Vercel URL
2. Update `GOOGLE_REDIRECT_URI` in Railway
3. Both must match exactly (including https://)

---

## 🔄 Continuous Deployment

### **Auto-Deploy on Push**

Both Vercel and Railway support auto-deploy:

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "feat: Add new feature"
   git push origin main
   ```

2. **Vercel** will auto-deploy frontend
3. **Railway** will auto-deploy backend

### **Monitor Deployments**

- **Vercel**: https://vercel.com/dashboard → Deployments
- **Railway**: https://railway.app/dashboard → Deployments

---

## 📊 Post-Deployment

### **Monitor Logs**

**Vercel Logs**:
- Dashboard → Project → Logs
- Real-time function logs

**Railway Logs**:
- Dashboard → Service → Logs
- Real-time application logs

### **Performance Monitoring**

**Vercel Analytics**:
- Enable in Project Settings
- Track page views, performance

**Railway Metrics**:
- CPU, Memory, Network usage
- Available in dashboard

---

## 💰 Pricing Notes

### **Vercel**
- **Free Tier**: 
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Perfect for this project!

### **Railway**
- **Free Trial**: $5 credit
- **Hobby Plan**: $5/month
- **Pay as you go**: ~$0.000463/GB-hour

**Estimated Cost**: $5-10/month for Railway (backend)

---

## 🆘 Need Help?

1. **Vercel Docs**: https://vercel.com/docs
2. **Railway Docs**: https://docs.railway.app
3. **Check logs** for specific error messages
4. **GitHub Issues**: Create issue in repository

---

## 🎉 Success!

Jika semua checklist ✅, aplikasi Anda sudah live!

**Frontend**: `https://your-app.vercel.app`
**Backend**: `https://your-app.up.railway.app`

Selamat! 🎊
