# 🚀 QUICK START - Deploy Docker ke Railway & Vercel

**Panduan singkat untuk deploy DORA dengan Docker**

---

## 📋 CHECKLIST PERSIAPAN

Sebelum mulai, pastikan Anda punya:
- ✅ Akun GitHub (sudah ada: `suryahanjaya/lenrag`)
- ✅ Akun Railway → https://railway.app (login dengan GitHub)
- ✅ Akun Vercel → https://vercel.com (login dengan GitHub)
- ✅ Google OAuth credentials (Client ID & Secret)
- ✅ Groq API key → https://console.groq.com

---

## 🚂 RAILWAY (Backend Docker) - 5 Menit

### 1. Create Project
- Buka: https://railway.app/new
- Pilih: **"Deploy from GitHub repo"**
- Pilih: **`suryahanjaya/lenrag`**

### 2. Add Environment Variables
Klik **"Variables"** tab, tambahkan:

```bash
GROQ_API_KEY=gsk_xxxxxxxx
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=https://NANTI_GANTI_DENGAN_VERCEL_URL/auth/callback
ALLOWED_ORIGINS=https://NANTI_GANTI_DENGAN_VERCEL_URL
ENVIRONMENT=production
LOG_LEVEL=INFO
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION_NAME=documents
EMBEDDING_MODEL_NAME=all-mpnet-base-v2
EMBEDDING_BATCH_SIZE=32
EMBEDDING_MAX_WORKERS=4
MAX_PARALLEL_FETCH=60
MAX_PARALLEL_EMBEDDING=15
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_UPLOAD_SIZE=104857600
RATE_LIMIT=100/minute
```

### 3. Generate Domain
- Klik **"Settings"** → **"Networking"** → **"Generate Domain"**
- **COPY URL Railway**: `https://xxxxx.railway.app`

### 4. Test
Buka: `https://your-railway-url.railway.app/health`

✅ **Railway DONE!**

---

## ▲ VERCEL (Frontend) - 3 Menit

### 1. Import Project
- Buka: https://vercel.com/new
- Pilih: **`suryahanjaya/lenrag`**
- Klik: **"Import"**

### 2. Add Environment Variables
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
```

### 3. Deploy
- Klik **"Deploy"**
- Tunggu 2-5 menit
- **COPY URL Vercel**: `https://xxxxx.vercel.app`

✅ **Vercel DONE!**

---

## 🔄 UPDATE CROSS-REFERENCES - 2 Menit

### Railway
Update 2 variables dengan URL Vercel:
```bash
GOOGLE_REDIRECT_URI=https://your-vercel-url.vercel.app/auth/callback
ALLOWED_ORIGINS=https://your-vercel-url.vercel.app
```

### Google OAuth Console
Tambahkan redirect URI:
```
https://your-vercel-url.vercel.app/auth/callback
```

---

## ✅ TEST

1. **Backend**: `https://your-railway-url.railway.app/health`
2. **Frontend**: `https://your-vercel-url.vercel.app`
3. **Login**: Klik "Login with Google"
4. **Upload**: Upload dokumen
5. **Chat**: Chat dengan dokumen

---

## 🎯 TOTAL WAKTU: ~10 MENIT

**Railway**: 5 menit  
**Vercel**: 3 menit  
**Update**: 2 menit  

---

## 📚 DOKUMENTASI LENGKAP

Lihat: `DOCKER_DEPLOY_GUIDE.md` untuk panduan detail

---

## 🆘 HELP

**Railway Build Failed?**
- Check Logs di Railway Dashboard
- Pastikan `railway.dockerfile` ada di repository

**Vercel Build Failed?**
- Check Build Logs di Vercel
- Pastikan `package.json` ada

**CORS Error?**
- Check `ALLOWED_ORIGINS` di Railway
- Format: `https://your-app.vercel.app` (no trailing slash)

**Google Login Failed?**
- Check redirect URI di Google Console
- Tunggu 5-10 menit untuk propagasi

---

**🎉 Selamat! Aplikasi Anda sudah live!**
