# 🚀 Quick Deploy - Vercel & Railway

## ⚡ Vercel (Frontend) - 3 Steps

### 1️⃣ Deploy
```
1. https://vercel.com/new
2. Import repository: lenrag
3. Click Deploy
```

### 2️⃣ Environment Variables
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your_client_id>
NEXT_PUBLIC_API_URL=<railway_backend_url>
```

### 3️⃣ Update Google OAuth
```
Authorized origins: https://your-app.vercel.app
Redirect URIs: https://your-app.vercel.app/auth/callback
```

---

## 🚂 Railway (Backend) - 3 Steps

### 1️⃣ Deploy
```
1. https://railway.app/new
2. Deploy from GitHub: lenrag
3. Root Directory: backend
4. Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 2️⃣ Environment Variables (Copy-Paste Ready)
```env
GROQ_API_KEY=your_groq_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-vercel-app.vercel.app/auth/callback
ENVIRONMENT=production
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHUNK_SIZE=850
CHUNK_OVERLAP=85
BULK_UPLOAD_BATCH_SIZE=60
EMBEDDING_BATCH_SIZE=15
LLM_PROVIDER=groq
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=2048
```

### 3️⃣ Get Railway URL
```
Copy Railway URL → Update Vercel NEXT_PUBLIC_API_URL → Redeploy Vercel
```

---

## ✅ Verification

### Test Backend
```bash
curl https://your-railway-app.up.railway.app/health
# Should return: {"status":"healthy"}
```

### Test Frontend
```
1. Open: https://your-vercel-app.vercel.app
2. Click "Login with Google"
3. Should redirect to Google OAuth
```

---

## 🔄 Update & Redeploy

```bash
git add .
git commit -m "Update: your changes"
git push origin main
```

Both Vercel & Railway will auto-deploy! 🎉

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| CORS Error | Update `ALLOWED_ORIGINS` in Railway with exact Vercel URL |
| OAuth Error | Update Google Cloud Console redirect URIs |
| Build Failed | Check logs in Vercel/Railway dashboard |
| 502 Error | Backend not running - check Railway logs |

---

## 📚 Full Guide

See `docs/DEPLOYMENT.md` for detailed instructions.
