# Perbaikan Error Google OAuth "invalid_grant"

## Apa yang Sudah Diperbaiki

1. **Backend Google Auth Service** (`backend/services/google_auth.py`):
   - Menambahkan support untuk environment variable `GOOGLE_REDIRECT_URI`
   - Menambahkan logging detail untuk debugging
   - Menambahkan penjelasan error yang lebih jelas saat terjadi `invalid_grant`

2. **Script Verifikasi** (`backend/verify_oauth_config.py`):
   - Script untuk memverifikasi konfigurasi OAuth Anda
   - Memeriksa semua environment variables yang diperlukan
   - Memberikan checklist untuk Google Cloud Console

3. **Dokumentasi** (`TROUBLESHOOTING_GOOGLE_AUTH.md`):
   - Panduan lengkap troubleshooting error `invalid_grant`
   - Penjelasan penyebab umum dan solusinya

## Langkah Perbaikan

### 1. Jalankan Script Verifikasi

```bash
cd backend
python verify_oauth_config.py
```

Script ini akan memeriksa:
- Apakah semua environment variables sudah ada
- Apakah Client ID sama di backend dan frontend
- Apakah Redirect URI sudah benar

### 2. Periksa Google Cloud Console

Buka [Google Cloud Console](https://console.cloud.google.com/) dan pastikan:

**Authorized redirect URIs** harus PERSIS:
```
http://localhost:3000/auth/callback
```

**PENTING**: 
- Tidak boleh ada trailing slash (/)
- Harus `http://` bukan `https://`
- Port harus 3000
- Path harus `/auth/callback`

### 3. Restart Backend Server

Setelah memastikan konfigurasi benar:

```bash
# Stop server yang sedang berjalan (Ctrl+C)
cd backend
python main.py
```

### 4. Clear Browser Cache

- Buka DevTools (F12)
- Application → Storage → Clear site data
- Atau gunakan Incognito/Private mode

### 5. Login Ulang

1. Buka `http://localhost:3000`
2. Klik "Sign in with Google"
3. Pilih akun Google
4. Berikan permission
5. Tunggu redirect

## Penyebab Umum Error "invalid_grant"

### 1. Redirect URI Mismatch (Paling Sering!)
Authorization code dikaitkan dengan redirect URI tertentu. Jika redirect URI yang digunakan saat menukar code tidak PERSIS sama, akan error.

**Solusi**: Pastikan redirect URI di Google Cloud Console PERSIS `http://localhost:3000/auth/callback`

### 2. Authorization Code Sudah Digunakan
Code hanya bisa digunakan SATU KALI.

**Solusi**: Login ulang dari awal, jangan refresh halaman callback

### 3. Authorization Code Expired
Code memiliki masa berlaku ~10 menit.

**Solusi**: Jangan terlalu lama di halaman OAuth, langsung selesaikan

### 4. Client ID/Secret Tidak Cocok
Code dikaitkan dengan Client ID tertentu.

**Solusi**: Pastikan Client ID dan Secret di `.env` cocok dengan Google Cloud Console

## Melihat Log Detail

Dengan update terbaru, backend akan menampilkan log yang lebih informatif:

```
INFO:services.google_auth:GoogleAuthService initialized with redirect_uri: http://localhost:3000/auth/callback
INFO:services.google_auth:Exchanging authorization code for tokens...
INFO:services.google_auth:Redirect URI: http://localhost:3000/auth/callback
```

Jika error:
```
ERROR:services.google_auth:INVALID_GRANT ERROR - Possible causes:
ERROR:services.google_auth:1. Authorization code already used or expired
ERROR:services.google_auth:2. Redirect URI mismatch between request and Google Console
ERROR:services.google_auth:3. Code was issued to a different client_id
```

## Checklist Debugging

- [ ] Jalankan `python verify_oauth_config.py` - semua OK
- [ ] Client ID sama di backend dan frontend
- [ ] Redirect URI di Google Console: `http://localhost:3000/auth/callback`
- [ ] Tidak ada trailing slash di redirect URI
- [ ] Backend server sudah di-restart
- [ ] Browser cache sudah di-clear
- [ ] Login dari awal (tidak pakai code lama)

## Dokumentasi Lengkap

Lihat `TROUBLESHOOTING_GOOGLE_AUTH.md` untuk panduan lengkap.

## Jika Masih Error

1. Cek terminal backend untuk log detail
2. Cek browser console (F12) untuk error
3. Screenshot error dan konfigurasi Google Console
4. Pastikan semua API sudah enabled:
   - Google Drive API
   - Google Docs API
   - Google OAuth2 API
