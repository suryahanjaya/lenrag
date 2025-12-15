# 📁 Environment Variables Structure

## 🎯 Struktur File `.env` yang Benar

Setelah update, struktur `.env` sudah **DISEDERHANAKAN**:

```
lenrag/
├── backend/.env          ← Backend environment variables (FastAPI/Python)
├── .env.local            ← Frontend environment variables (Next.js)
└── .env                  ← ❌ TIDAK DIPERLUKAN LAGI! (bisa dihapus)
```

---

## ✅ File yang DIPERLUKAN

### 1. **`backend/.env`** - Backend Configuration

**Lokasi**: `backend/.env`  
**Digunakan oleh**: Backend (FastAPI/Python) di Docker & Local  
**Berisi**:
- Google OAuth credentials
- AI/LLM API keys (Groq, Gemini)
- Performance settings (batch sizes)
- CORS configuration
- Logging level

**Contoh**:
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# AI/LLM
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Performance
BULK_UPLOAD_BATCH_SIZE=60
EMBEDDING_BATCH_SIZE=15

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging
LOG_LEVEL=WARNING

# Environment
ENVIRONMENT=development
```

---

### 2. **`.env.local`** - Frontend Configuration

**Lokasi**: `.env.local` (root directory)  
**Digunakan oleh**: Frontend (Next.js) di Docker & Local  
**Berisi**:
- Google OAuth credentials (dengan prefix `NEXT_PUBLIC_`)
- Backend URL
- Supabase credentials (jika digunakan)

**Contoh**:
```bash
# Google OAuth (Frontend)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_client_secret

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Supabase (Optional)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## ❌ File yang TIDAK DIPERLUKAN

### **`.env`** (root directory)

File ini **TIDAK DIPERLUKAN LAGI** karena:
- `docker-compose.yml` sudah menggunakan `env_file` yang membaca langsung dari `backend/.env` dan `.env.local`
- `docker-compose.prod.yml` sudah diupdate untuk menggunakan `env_file` juga
- Menghindari duplikasi dan konflik

**Anda bisa menghapus file ini!**

---

## 🐳 Bagaimana Docker Membaca Environment Variables?

### **Development** (`docker-compose.yml`)

```yaml
services:
  backend:
    env_file:
      - backend/.env    # ← Membaca dari sini
    environment:
      - BULK_UPLOAD_BATCH_SIZE=60  # Override jika perlu
      
  frontend:
    env_file:
      - .env.local      # ← Membaca dari sini
    environment:
      - NODE_ENV=development
```

### **Production** (`docker-compose.prod.yml`)

```yaml
services:
  backend:
    env_file:
      - backend/.env    # ← Membaca dari sini (SAMA seperti dev)
    environment:
      - ENVIRONMENT=production  # Override untuk production
      
  frontend:
    env_file:
      - .env.local      # ← Membaca dari sini (SAMA seperti dev)
    environment:
      - NODE_ENV=production
```

---

## 🔄 Perbedaan Development vs Production

| Aspek | Development | Production |
|-------|-------------|------------|
| **File `.env`** | `backend/.env` + `.env.local` | `backend/.env` + `.env.local` |
| **Docker Compose** | `docker-compose.yml` | `docker-compose.prod.yml` |
| **NODE_ENV** | `development` | `production` |
| **ENVIRONMENT** | `development` | `production` |
| **Container Names** | `dora-backend`, `dora-frontend` | `dora-backend-prod`, `dora-frontend-prod` |
| **Restart Policy** | `unless-stopped` | `always` |
| **Nginx** | ❌ Tidak ada | ✅ Ada (optional) |
| **Logging** | Standard | Compressed with rotation |

---

## 📋 Checklist Setup

### Untuk Development:

- [ ] Copy `backend/env.example` → `backend/.env`
- [ ] Copy `.env.example` → `.env.local`
- [ ] Isi credentials di `backend/.env`
- [ ] Isi credentials di `.env.local`
- [ ] Jalankan: `docker-compose up -d`

### Untuk Production:

- [ ] Pastikan `backend/.env` sudah terisi dengan benar
- [ ] Pastikan `.env.local` sudah terisi dengan benar
- [ ] Set `ENVIRONMENT=production` di `backend/.env`
- [ ] Jalankan: `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Atau gunakan script: `.\deploy-production.ps1`

---

## 🚀 Command untuk Deploy

### Development:
```powershell
# Menggunakan docker-compose.yml
docker-compose build
docker-compose up -d
```

### Production:
```powershell
# Menggunakan docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Atau gunakan script otomatis
.\deploy-production.ps1
```

---

## 🔍 Troubleshooting

### Problem: Environment variables tidak terbaca

**Solusi**:
1. Pastikan file `.env` ada di lokasi yang benar
2. Cek isi file dengan: `cat backend/.env` atau `cat .env.local`
3. Restart container: `docker-compose restart`

### Problem: Masih ada error tentang missing variables

**Solusi**:
1. Cek apakah semua required variables sudah diisi
2. Verifikasi di container: `docker exec dora-backend env | grep GROQ`
3. Rebuild jika perlu: `docker-compose build --no-cache`

---

## ✅ Kesimpulan

**Struktur yang BENAR**:
```
✅ backend/.env       → Backend config
✅ .env.local         → Frontend config
❌ .env (root)        → TIDAK DIPERLUKAN (bisa dihapus)
```

**Keuntungan**:
- ✅ Tidak ada duplikasi
- ✅ Konsisten antara dev & prod
- ✅ Lebih mudah di-maintain
- ✅ Menghindari konflik environment variables

---

**Last Updated**: 2025-12-15  
**Version**: 3.0.0  
**Status**: ✅ Simplified & Optimized
