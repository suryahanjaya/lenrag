# Panduan Deployment: Vercel (Frontend) & Railway (Backend)

Karena aplikasi Anda terdiri dari **Frontend (Next.js)** dan **Backend (Python FastAPI + ChromaDB)**, strategi deployment terbaik adalah memisahkannya:

1.  **Backend** ➡️ **Railway** (Karena butuh persistent storage untuk Database & Docker)
2.  **Frontend** ➡️ **Vercel** (Terbaik untuk Next.js)

---

## 🚀 Bagian 1: Deploy Backend di Railway

Kita harus deploy Backend dulu untuk mendapatkan **URL Backend** yang akan dipakai oleh Frontend.

1.  **Push Kode ke GitHub**
    *   Pastikan semua kode terbaru sudah ada di repository GitHub Anda.

2.  **Buka Railway (railway.app)**
    *   Login dan klik **"New Project"** -> **"Deploy from GitHub repo"**.
    *   Pilih repository `lenrag`.

3.  **Konfigurasi Service**
    *   Klik kartu service repository Anda di canvas Railway.
    *   Pergi ke tab **Settings**.
    *   Scroll ke **Service** -> **Builder**.
    *   Pilih **Dockerconfig**.
    *   **Dockerfile Path**: Masukkan `Dockerfile.backend` (PENTING!).
    *   **Context**: Biarkan `.` atau `/`.

4.  **Setup Environment Variables**
    *   Pergi ke tab **Variables**.
    *   Masukkan semua variable dari file `backend/.env` Anda, contoh:
        *   `GOOGLE_CLIENT_ID`: ...
        *   `GOOGLE_CLIENT_SECRET`: ...
        *   `GROQ_API_KEY`: ...
        *   `GEMINI_API_KEY`: ...
        *   `ALLOWED_ORIGINS`: `https://your-vercel-app.vercel.app,http://localhost:3000` (Nanti update ini setelah deploy Vercel).

5.  **Setup Persistent Storage (Wajib untuk Knowledge Base)**
    *   Pergi ke tab **Volumes**.
    *   Klik **Add Volume**.
    *   Mount Path: `/app/chroma_db`.
    *   *Tanpa ini, data Knowledge Base akan hilang setiap kali restart.*

6.  **Jalankan (Deploy)**
    *   Railway akan mulai build. Tunggu sampai sukses.
    *   Pergi ke tab **Settings** -> **Networking**.
    *   Klik **Generate Domain** (Nanti Anda akan dapat URL seperti `lenrag-backend-production.up.railway.app`).
    *   **Copy URL ini**, kita butuh untuk Frontend.

---

## 🎨 Bagian 2: Deploy Frontend di Vercel

1.  **Buka Vercel (vercel.com)**
    *   Login -> **"Add New..."** -> **"Project"**.
    *   Import repository `lenrag` dari GitHub.

2.  **Konfigurasi Project**
    *   **Framework Preset**: Next.js (Otomatis terdeteksi).
    *   **Root Directory**: `.` (Default).

3.  **Environment Variables**
    *   Buka bagian **Environment Variables**.
    *   Tambahkan variable berikut:
        *   `NEXT_PUBLIC_BACKEND_URL`: **Paste URL Railway tadi** (Contoh: `https://lenrag-backend-production.up.railway.app`). ⚠️ **Jangan pakai slash (/) di akhir**.
        *   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: ID Google Client Anda.
        *   `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET`: Secret Google Client Anda.

4.  **Deploy**
    *   Klik **Deploy**.
    *   Tunggu sampai selesai. Vercel akan memberikan URL Frontend (Contoh: `lenrag-frontend.vercel.app`).

---

## 🔗 Bagian 3: Finalisasi (Connecting the Dots)

1.  **Update Google Cloud Console**
    *   Pergi ke Google Cloud Console -> Credentials.
    *   Edit OAuth Client ID Anda.
    *   **Authorized JavaScript origins**: Tambahkan URL Vercel (`https://lenrag-frontend.vercel.app`).
    *   **Authorized redirect URIs**: Tambahkan URL Vercel + `/auth/callback` (Contoh: `https://lenrag-frontend.vercel.app/auth/callback`).

2.  **Update Railway Backend**
    *   Kembali ke Railway -> Tab **Variables**.
    *   Update `ALLOWED_ORIGINS` supaya menerima request dari Vercel.
    *   Isi: `http://localhost:3000,https://lenrag-frontend.vercel.app` (Pisahkan dengan koma).
    *   Railway akan redeploy otomatis.

---

## ✅ Selesai!

Sekarang aplikasi Anda sudah live:
*   Frontend: `https://lenrag-frontend.vercel.app`
*   Backend: `https://lenrag-backend.railway.app`
*   Database: Tersimpan aman di Railway Volume.
