# 🐳 DEPLOY DOCKER KE RAILWAY & VERCEL

**Panduan lengkap deploy aplikasi DORA menggunakan Docker ke Railway (Backend) dan Vercel (Frontend)**

---

## ✅ PERSIAPAN

### Yang Anda Butuhkan:
1. ✅ Docker sudah jalan di local (sudah tested)
2. ✅ Akun GitHub (repository: `suryahanjaya/lenrag`)
3. ✅ Akun Railway (gratis $5/bulan)
4. ✅ Akun Vercel (gratis unlimited)
5. ✅ Google OAuth credentials
6. ✅ Groq API key

---

## 🚂 BAGIAN 1: DEPLOY BACKEND DOCKER KE RAILWAY

### **Step 1: Login ke Railway**
1. Buka browser: **https://railway.app**
2. Klik **"Login"**
3. Pilih **"Login with GitHub"**
4. Authorize Railway

### **Step 2: Create New Project**
1. Klik **"New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repository: **`suryahanjaya/lenrag`**
4. Railway akan auto-detect Dockerfile

### **Step 3: Configure Railway**

#### A. Settings
1. Klik project Anda
2. Klik **"Settings"** tab
3. Di **"Build"** section:
   - Build Method: **Dockerfile**
   - Dockerfile Path: **`railway.dockerfile`** (sudah dikonfigurasi)
4. Di **"Deploy"** section:
   - Health Check Path: **`/health`**

#### B. Environment Variables
1. Klik **"Variables"** tab
2. Tambahkan variables berikut (klik **"New Variable"** untuk setiap item):

```bash
# === REQUIRED - API Keys ===
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

# === REQUIRED - Google OAuth ===
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx

# === AKAN DIUPDATE NANTI (setelah dapat Vercel URL) ===
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/auth/callback
ALLOWED_ORIGINS=https://your-app.vercel.app

# === Environment Config ===
ENVIRONMENT=production
LOG_LEVEL=INFO

# === ChromaDB Settings ===
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION_NAME=documents

# === Embedding Model ===
EMBEDDING_MODEL_NAME=all-mpnet-base-v2
EMBEDDING_BATCH_SIZE=32
EMBEDDING_MAX_WORKERS=4

# === Document Processing ===
MAX_PARALLEL_FETCH=60
MAX_PARALLEL_EMBEDDING=15
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# === API Settings ===
MAX_UPLOAD_SIZE=104857600
RATE_LIMIT=100/minute
```

**CATATAN:** 
- Untuk `GOOGLE_REDIRECT_URI` dan `ALLOWED_ORIGINS`, gunakan placeholder dulu
- Nanti akan kita update setelah dapat URL Vercel

### **Step 4: Deploy Backend**
1. Klik **"Deployments"** tab
2. Railway akan otomatis build Docker image (5-10 menit pertama kali)
3. Tunggu sampai status: **"Success"** ✅

### **Step 5: Generate Domain**
1. Klik **"Settings"** tab
2. Scroll ke **"Networking"** section
3. Klik **"Generate Domain"**
4. **COPY URL Railway Anda** (contoh: `lenrag-production.up.railway.app`)

### **Step 6: Test Backend**
Buka browser, test endpoint:
```
https://your-railway-url.railway.app/health
```

Expected response:
```json
{"status": "healthy"}
```

✅ **Backend DONE!** Railway URL: `https://your-railway-url.railway.app`

---

## ▲ BAGIAN 2: DEPLOY FRONTEND KE VERCEL

Vercel **tidak support Docker** untuk Next.js, tapi itu OK! Vercel punya Next.js optimization yang lebih bagus.

### **Step 1: Login ke Vercel**
1. Buka browser: **https://vercel.com**
2. Klik **"Sign Up"** atau **"Login"**
3. Pilih **"Continue with GitHub"**
4. Authorize Vercel

### **Step 2: Import Project**
1. Klik **"Add New..."** → **"Project"**
2. Cari repository: **`suryahanjaya/lenrag`**
3. Klik **"Import"**

### **Step 3: Configure Project**

#### A. Framework Settings (Auto-detected)
- Framework Preset: **Next.js**
- Root Directory: **`.`** (root)
- Build Command: **`npm run build`**
- Output Directory: **`.next`**

#### B. Environment Variables
Klik **"Environment Variables"**, tambahkan 2 variables:

```bash
# Variable 1
Name:  NEXT_PUBLIC_GOOGLE_CLIENT_ID
Value: xxxxx.apps.googleusercontent.com

# Variable 2
Name:  NEXT_PUBLIC_API_URL
Value: https://your-railway-url.railway.app
```

**PENTING:** Ganti `your-railway-url.railway.app` dengan URL Railway yang Anda dapat di Step 5 tadi!

### **Step 4: Deploy Frontend**
1. Klik **"Deploy"**
2. Tunggu build process (2-5 menit)
3. Setelah selesai: **"Congratulations!"** 🎉
4. **COPY URL Vercel Anda** (contoh: `lenrag.vercel.app`)

✅ **Frontend DONE!** Vercel URL: `https://your-app.vercel.app`

---

## 🔄 BAGIAN 3: UPDATE CROSS-REFERENCES

Sekarang kita punya kedua URL, kita perlu update environment variables!

### **Update Railway (Backend)**

1. Buka **Railway Dashboard** → Project Anda
2. Klik **"Variables"** tab
3. Update 2 variables:

```bash
GOOGLE_REDIRECT_URI=https://your-vercel-url.vercel.app/auth/callback
ALLOWED_ORIGINS=https://your-vercel-url.vercel.app
```

4. Railway akan auto-redeploy (tunggu 1-2 menit)

### **Update Google OAuth Console**

1. Buka **Google Cloud Console**: https://console.cloud.google.com
2. Pilih project Anda
3. **APIs & Services** → **Credentials**
4. Klik OAuth 2.0 Client ID Anda
5. Di **"Authorized redirect URIs"**, tambahkan:
   ```
   https://your-vercel-url.vercel.app/auth/callback
   ```
6. Di **"Authorized JavaScript origins"**, tambahkan:
   ```
   https://your-vercel-url.vercel.app
   https://your-railway-url.railway.app
   ```
7. Klik **"Save"**

---

## ✅ BAGIAN 4: TESTING

### Test 1: Backend Health
```bash
# Buka di browser:
https://your-railway-url.railway.app/health

# Expected:
{"status": "healthy"}
```

### Test 2: Frontend
```bash
# Buka di browser:
https://your-vercel-url.vercel.app

# Expected: Login page muncul
```

### Test 3: Google Login
1. Klik **"Login with Google"**
2. Pilih akun Google
3. Authorize
4. Redirect ke dashboard ✅

### Test 4: Upload & Chat
1. Upload dokumen
2. Tunggu embedding selesai
3. Chat dengan dokumen ✅

---

## 📊 MONITORING

### Railway (Backend)
- **Logs**: Dashboard → Logs tab
- **Metrics**: Dashboard → Metrics tab
- **Restart**: Settings → Restart

### Vercel (Frontend)
- **Logs**: Dashboard → Deployments → View Function Logs
- **Analytics**: Analytics tab
- **Redeploy**: Deployments → ... → Redeploy

---

## 🔄 AUTO-DEPLOY

Setiap kali Anda `git push` ke `main` branch:
- ✅ Railway auto-rebuild Docker image
- ✅ Vercel auto-rebuild frontend
- ✅ Zero downtime deployment

---

## 🐛 TROUBLESHOOTING

### Problem: Railway Build Failed
**Solution:**
1. Check Logs di Railway Dashboard
2. Pastikan `railway.dockerfile` ada
3. Pastikan `backend/requirements.txt` ada

### Problem: Vercel Build Failed
**Solution:**
1. Check Build Logs
2. Pastikan `package.json` ada
3. Pastikan Node.js version compatible

### Problem: CORS Error
**Solution:**
1. Check `ALLOWED_ORIGINS` di Railway
2. Format: `https://your-app.vercel.app` (no trailing slash)
3. Redeploy Railway

### Problem: Google Login Failed
**Solution:**
1. Check Google OAuth Console
2. Pastikan redirect URI sudah ditambahkan
3. Tunggu 5-10 menit untuk propagasi

---

## 💰 PRICING

### Railway (Backend)
- **Free Tier**: $5 credit/month
- **Usage**: ~$5-10/month untuk production
- **Upgrade**: Jika perlu lebih banyak resources

### Vercel (Frontend)
- **Free Tier**: 
  - Unlimited deployments
  - 100GB bandwidth/month
  - Perfect untuk personal/small projects

---

## 📝 CHECKLIST DEPLOYMENT

### Railway Backend ✅
- [ ] Project created
- [ ] Repository connected
- [ ] Dockerfile detected
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Domain generated
- [ ] Health check works: `/health`

### Vercel Frontend ✅
- [ ] Project imported
- [ ] Environment variables added:
  - [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - [ ] `NEXT_PUBLIC_API_URL`
- [ ] Deployment successful
- [ ] Frontend accessible

### Integration ✅
- [ ] Railway URL updated di Vercel
- [ ] Vercel URL updated di Railway
- [ ] Google OAuth redirect URIs updated
- [ ] Google login works
- [ ] Document upload works
- [ ] Chat works

---

## 🎯 NEXT STEPS

1. **Custom Domain** (Optional):
   - Railway: Settings → Domains
   - Vercel: Settings → Domains

2. **Monitoring**:
   - Set up alerts di Railway
   - Enable Analytics di Vercel

3. **Scaling**:
   - Railway: Upgrade plan jika perlu
   - Vercel: Auto-scales

---

## 📚 USEFUL LINKS

- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Google Cloud Console: https://console.cloud.google.com
- Groq Console: https://console.groq.com

---

**🎉 Selamat! Aplikasi DORA Anda sudah live di production!**

Backend (Docker): Railway  
Frontend: Vercel  
Database: ChromaDB (persistent di Railway)
