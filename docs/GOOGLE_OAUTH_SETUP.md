# 🔐 Google OAuth Consent Screen Configuration Guide

## 📋 Informasi yang Harus Diisi

### 1️⃣ **App Information**

| Field | Value | Status |
|-------|-------|--------|
| **App name** | `dora` | ✅ Sudah benar |
| **User support email** | `suryahanajaya76@gmail.com` | ✅ Sudah benar |
| **App logo** | `2.png` (120px x 120px, max 1MB) | ✅ Upload file logo Anda |

---

### 2️⃣ **App Domain** (PENTING - Harus Diisi!)

| Field | Value | Penjelasan |
|-------|-------|------------|
| **Application home page** | `https://dora-j.vercel.app` | URL homepage aplikasi Anda |
| **Application privacy policy link** | `https://dora-j.vercel.app/privacy` | ✅ Sudah dibuat! |
| **Application terms of service link** | `https://dora-j.vercel.app/terms` | ✅ Sudah dibuat! |

---

### 3️⃣ **Authorized Domains**

| Domain | Penjelasan | Status |
|--------|------------|--------|
| `dora-j.vercel.app` | Frontend Vercel Anda | ✅ Sudah benar |
| `rpwxiscfrlsfvkytzuuu.supabase.co` | Database Supabase Anda | ✅ Sudah benar |

**Tambahan yang Mungkin Diperlukan:**
- Jika backend di Railway: tambahkan `your-backend.railway.app`
- Jika ada custom domain: tambahkan juga

---

### 4️⃣ **Developer Contact Information**

| Field | Value |
|-------|-------|
| **Email addresses** | `suryahanajaya76@gmail.com` |

---

## 🚀 Langkah-Langkah Setup

### **Step 1: Buka Google Cloud Console**
1. Pergi ke [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project Anda atau buat project baru
3. Navigasi ke **APIs & Services** → **OAuth consent screen**

### **Step 2: Pilih User Type**
- **External**: Jika aplikasi untuk publik (recommended)
- **Internal**: Jika hanya untuk organisasi Google Workspace Anda

### **Step 3: Isi App Information**
```
App name: dora
User support email: suryahanajaya76@gmail.com
App logo: Upload 2.png (120x120px)
```

### **Step 4: Isi App Domain**
```
Application home page: https://dora-j.vercel.app
Application privacy policy link: https://dora-j.vercel.app/privacy
Application terms of service link: https://dora-j.vercel.app/terms
```

### **Step 5: Tambahkan Authorized Domains**
```
1. dora-j.vercel.app
2. rpwxiscfrlsfvkytzuuu.supabase.co
```

### **Step 6: Developer Contact Information**
```
Email: suryahanajaya76@gmail.com
```

### **Step 7: Scopes (OAuth Scopes)**
Tambahkan scopes berikut:
```
✅ https://www.googleapis.com/auth/userinfo.email
✅ https://www.googleapis.com/auth/userinfo.profile
✅ https://www.googleapis.com/auth/drive.readonly
✅ https://www.googleapis.com/auth/documents.readonly
```

### **Step 8: Test Users (Jika Status "Testing")**
Tambahkan email untuk testing:
```
suryahanajaya76@gmail.com
(tambahkan email lain jika perlu)
```

---

## 🔑 OAuth Credentials Configuration

### **Step 1: Buat OAuth 2.0 Client ID**
1. Pergi ke **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth client ID**
3. Pilih **Web application**

### **Step 2: Konfigurasi Authorized Redirect URIs**

**Untuk Development (Localhost):**
```
http://localhost:3000/auth/callback
http://localhost:3000
```

**Untuk Production (Vercel):**
```
https://dora-j.vercel.app/auth/callback
https://dora-j.vercel.app
```

### **Step 3: Copy Credentials**
Setelah dibuat, copy:
- **Client ID**: `your_client_id_here.apps.googleusercontent.com`
- **Client Secret**: `your_client_secret_here`

---

## 📝 Environment Variables Setup

### **Frontend (.env.local)**
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### **Backend (backend/.env)**
```bash
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
ALLOWED_ORIGINS=https://dora-j.vercel.app,http://localhost:3000
```

### **Vercel Environment Variables**
Tambahkan di Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
```

### **Railway Environment Variables**
Tambahkan di Railway Dashboard → Variables:
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
ALLOWED_ORIGINS=https://dora-j.vercel.app
```

---

## ✅ Checklist Verifikasi

- [ ] App name diisi: `dora`
- [ ] User support email diisi: `suryahanajaya76@gmail.com`
- [ ] App logo uploaded (120x120px)
- [ ] Application home page: `https://dora-j.vercel.app`
- [ ] Privacy policy link: `https://dora-j.vercel.app/privacy`
- [ ] Terms of service link: `https://dora-j.vercel.app/terms`
- [ ] Authorized domains ditambahkan:
  - [ ] `dora-j.vercel.app`
  - [ ] `rpwxiscfrlsfvkytzuuu.supabase.co`
- [ ] Developer contact email diisi
- [ ] OAuth scopes ditambahkan (Drive, Docs, Profile, Email)
- [ ] OAuth Client ID dibuat
- [ ] Authorized redirect URIs dikonfigurasi
- [ ] Environment variables di-update (Frontend & Backend)
- [ ] Privacy & Terms pages sudah di-deploy ke Vercel

---

## 🚨 Troubleshooting

### **Error: redirect_uri_mismatch**
**Solusi:**
1. Pastikan redirect URI di Google Console sama persis dengan yang digunakan aplikasi
2. Format: `https://dora-j.vercel.app/auth/callback` (tanpa trailing slash)
3. Tunggu 5-10 menit setelah update untuk propagasi

### **Error: Access blocked - App not verified**
**Solusi:**
1. Tambahkan email Anda sebagai test user
2. Atau submit app untuk verification (jika sudah production-ready)

### **Error: Invalid client**
**Solusi:**
1. Periksa GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET
2. Pastikan tidak ada spasi atau karakter tambahan
3. Regenerate credentials jika perlu

### **Privacy Policy / Terms Not Found**
**Solusi:**
1. Deploy ulang aplikasi ke Vercel: `git push`
2. Pastikan file `app/privacy/page.tsx` dan `app/terms/page.tsx` sudah ter-commit
3. Akses manual: `https://dora-j.vercel.app/privacy` dan `/terms`

---

## 📚 Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Scopes](https://developers.google.com/drive/api/guides/api-specific-auth)
- [OAuth Consent Screen Guide](https://support.google.com/cloud/answer/10311615)

---

## 📞 Support

Jika ada masalah, hubungi:
- **Email**: suryahanajaya76@gmail.com
- **GitHub Issues**: [lenrag/issues](https://github.com/suryahanjaya/lenrag/issues)

---

**Last Updated**: December 16, 2025
**Author**: Surya Hanjaya
