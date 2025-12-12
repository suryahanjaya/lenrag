# Cara Memperbaiki Error "invalid_grant" Google OAuth

## Masalah
Error `invalid_grant` dengan pesan "Bad Request" terjadi saat mencoba menukar authorization code dengan access token.

## Penyebab Umum

### 1. **Redirect URI Mismatch** (Paling Sering)
Authorization code yang diterima dari Google OAuth dikaitkan dengan redirect URI tertentu. Jika redirect URI yang digunakan saat menukar code tidak PERSIS sama dengan yang digunakan saat mendapatkan code, Google akan menolak dengan error `invalid_grant`.

**Solusi:**
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project Anda
3. Pergi ke **APIs & Services** → **Credentials**
4. Klik pada OAuth 2.0 Client ID Anda
5. Di bagian **Authorized redirect URIs**, pastikan ada entry yang PERSIS:
   ```
   http://localhost:3000/auth/callback
   ```
   ⚠️ **PENTING**: 
   - Tidak boleh ada trailing slash (`/`)
   - Harus `http://` bukan `https://` untuk localhost
   - Port harus sama (3000)
   - Path harus sama persis (`/auth/callback`)

### 2. **Authorization Code Sudah Digunakan**
Authorization code hanya bisa digunakan SATU KALI. Jika Anda mencoba menggunakan code yang sama lagi, akan error.

**Solusi:**
- Lakukan login ulang dari awal
- Jangan refresh halaman callback

### 3. **Authorization Code Expired**
Authorization code memiliki masa berlaku yang sangat singkat (biasanya 10 menit).

**Solusi:**
- Pastikan proses dari login sampai callback tidak terlalu lama
- Jika terlalu lama, lakukan login ulang

### 4. **Client ID/Secret Tidak Cocok**
Code yang diterima dikaitkan dengan Client ID tertentu. Jika Client ID atau Secret yang digunakan untuk menukar code berbeda, akan error.

**Solusi:**
1. Pastikan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di file `.env` backend cocok dengan yang ada di Google Cloud Console
2. Pastikan `NEXT_PUBLIC_GOOGLE_CLIENT_ID` di file `.env.local` frontend sama dengan `GOOGLE_CLIENT_ID` di backend

## Langkah-Langkah Perbaikan

### Step 1: Verifikasi Environment Variables

**Backend** (`backend/.env`):
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

**Frontend** (`frontend/.env.local` atau `.env.local` di root):
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

⚠️ **PENTING**: Client ID harus SAMA di backend dan frontend!

### Step 2: Verifikasi Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project Anda
3. **APIs & Services** → **Credentials**
4. Klik OAuth 2.0 Client ID Anda
5. Verifikasi:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/auth/callback`

### Step 3: Restart Backend Server

Setelah mengubah environment variables, restart backend:

```bash
cd backend
# Stop server (Ctrl+C)
python main.py
```

### Step 4: Clear Browser Cache & Cookies

1. Buka DevTools (F12)
2. Application → Storage → Clear site data
3. Atau gunakan Incognito/Private mode

### Step 5: Test Login Ulang

1. Buka `http://localhost:3000`
2. Klik "Sign in with Google"
3. Pilih akun Google
4. Berikan permission
5. Tunggu redirect ke callback

### Step 6: Check Logs

Dengan update terbaru, backend akan menampilkan log yang lebih detail:

```
INFO:services.google_auth:GoogleAuthService initialized with redirect_uri: http://localhost:3000/auth/callback
INFO:services.google_auth:Exchanging authorization code for tokens...
INFO:services.google_auth:Redirect URI: http://localhost:3000/auth/callback
```

Jika masih error, akan muncul:
```
ERROR:services.google_auth:INVALID_GRANT ERROR - Possible causes:
ERROR:services.google_auth:1. Authorization code already used or expired
ERROR:services.google_auth:2. Redirect URI mismatch between request and Google Console
ERROR:services.google_auth:3. Code was issued to a different client_id
ERROR:services.google_auth:   Current redirect_uri: http://localhost:3000/auth/callback
```

## Debugging Checklist

- [ ] Client ID sama di backend dan frontend
- [ ] Client Secret benar di backend
- [ ] Redirect URI di Google Console: `http://localhost:3000/auth/callback`
- [ ] Tidak ada trailing slash di redirect URI
- [ ] Backend server sudah di-restart setelah ubah .env
- [ ] Browser cache sudah di-clear
- [ ] Login dilakukan dari awal (tidak pakai code lama)
- [ ] Proses login tidak terlalu lama (< 10 menit)

## Jika Masih Error

1. **Cek terminal backend** untuk melihat log detail
2. **Cek browser console** untuk melihat error dari frontend
3. **Coba buat OAuth Client ID baru** di Google Cloud Console
4. **Pastikan API sudah enabled**:
   - Google Drive API
   - Google Docs API
   - Google OAuth2 API

## Kontak

Jika masih ada masalah setelah mengikuti semua langkah di atas, silakan share:
1. Screenshot error dari terminal backend
2. Screenshot error dari browser console
3. Screenshot konfigurasi OAuth di Google Cloud Console (sensor sensitive data)
