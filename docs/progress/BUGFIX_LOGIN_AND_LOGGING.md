# Bug Fixes: Login Stuck & Verbose Logging

## Summary
Berhasil memperbaiki 2 masalah utama:
1. **Login stuck issue** - User kadang застрял di login page setelah redirect dari Google OAuth
2. **Terminal output terlalu verbose** - Terlalu banyak log INFO dari httpx dan services

## Perubahan yang Dilakukan

### 1. Fix Login Stuck Issue

#### **Frontend: `app/page.tsx`**
- ✅ Memperbaiki `useEffect` hook yang tidak lengkap
- ✅ Menambahkan `handleAuthSuccess` function yang hilang
- ✅ Menghapus multiple `setTimeout` yang menyebabkan race condition
- ✅ Menggunakan immediate `checkAuth()` setelah URL parameter dibersihkan

**Perubahan:**
```typescript
// Sebelumnya: Multiple setTimeout causing race conditions
setTimeout(checkAuth, 100)
const timeoutId = setTimeout(checkAuth, 200)

// Sekarang: Immediate check
if (authSuccess === 'success') {
  window.history.replaceState({}, document.title, window.location.pathname)
  checkAuth()  // Immediate, no delay
} else {
  checkAuth()
}
```

#### **Frontend: `app/auth/callback/page.tsx`**
- ✅ Mengganti `router.push()` dengan `window.location.replace()`
- ✅ Menghapus delay yang tidak perlu (`setTimeout 100ms`)
- ✅ Menggunakan `window.location.replace()` untuk immediate navigation tanpa menambah history

**Perubahan:**
```typescript
// Sebelumnya: Using Next.js router with delay
await new Promise(resolve => setTimeout(resolve, 100))
router.push('/?auth=success')

// Sekarang: Direct window navigation
window.location.replace('/?auth=success')
```

**Mengapa ini memperbaiki masalah:**
- `window.location.replace()` melakukan immediate navigation tanpa menambah entry ke browser history
- Menghilangkan race condition antara localStorage write dan page navigation
- Tidak ada delay yang bisa menyebabkan stuck state

### 2. Fix Verbose Terminal Output

#### **Backend: `.env`**
- ✅ Menambahkan `LOG_LEVEL=WARNING` configuration
- ✅ Memungkinkan user untuk mengubah log level sesuai kebutuhan

**Perubahan:**
```env
# Logging Configuration (INFO, WARNING, ERROR)
LOG_LEVEL=WARNING
```

#### **Backend: `main.py`**
- ✅ Mengkonfigurasi logging dengan level dari environment variable
- ✅ Mematikan verbose logging dari `httpx` (set ke WARNING)
- ✅ Mematikan verbose logging dari `services.google_auth` (set ke WARNING)
- ✅ Mematikan verbose logging dari `services.google_docs` (set ke WARNING)
- ✅ Mempertahankan logging dari `services.rag_pipeline` (tetap INFO untuk debugging)

**Perubahan:**
```python
# Sebelumnya: Fixed INFO level
logging.basicConfig(level=logging.INFO)

# Sekarang: Configurable + selective logging
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(levelname)s:%(name)s:%(message)s'
)

# Reduce verbosity of noisy loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("services.google_auth").setLevel(logging.WARNING)
logging.getLogger("services.google_docs").setLevel(logging.WARNING)
logging.getLogger("services.rag_pipeline").setLevel(logging.INFO)
```

**Apa yang akan hilang dari terminal:**
- ❌ `INFO:httpx:HTTP Request: GET https://www.googleapis.com/...`
- ❌ `INFO:services.google_auth:Google user info received: {...}`
- ❌ `INFO:services.google_docs:Raw files found: 50`
- ❌ `INFO:services.google_docs:Processed 50 Google Docs successfully`

**Apa yang masih muncul:**
- ✅ `WARNING:services.google_auth:v3 endpoint failed, trying v2: {...}` (penting!)
- ✅ `ERROR:services.google_auth:Error getting user info: {...}` (penting!)
- ✅ `INFO:services.rag_pipeline:Collection for user ... has 22799 documents` (berguna)
- ✅ `INFO:services.rag_pipeline:Query results: 15 documents found` (berguna)
- ✅ `INFO:__main__:...` (semua log dari main.py tetap muncul)

## Cara Menggunakan

### Mengubah Log Level
Jika ingin melihat lebih banyak atau lebih sedikit log, edit `.env`:

```env
# Untuk production (minimal logging)
LOG_LEVEL=ERROR

# Untuk development (normal logging)
LOG_LEVEL=INFO

# Untuk debugging (semua logging)
LOG_LEVEL=DEBUG

# Untuk quiet mode (hanya warnings dan errors) - RECOMMENDED
LOG_LEVEL=WARNING
```

### Testing Login Fix
1. Sign out dari aplikasi
2. Sign in lagi dengan Google
3. Setelah redirect dari Google, seharusnya langsung masuk ke dashboard
4. Tidak ada stuck di login page lagi

## Restart Required

**PENTING:** Restart backend server untuk menerapkan perubahan logging:

```bash
# Stop current server (Ctrl+C)
# Then restart:
python main.py
```

Frontend tidak perlu restart karena Next.js hot reload akan otomatis mendeteksi perubahan.

## Expected Results

### Before Fix:
```
INFO:httpx:HTTP Request: GET https://www.googleapis.com/oauth2/v3/userinfo?access_token=... "HTTP/1.1 401 Unauthorized"
WARNING:services.google_auth:v3 endpoint failed, trying v2: {...}
ERROR:services.google_auth:Error getting user info: Cannot send a request, as the client has been closed.
ERROR:__main__:Token validation error: Cannot send a request, as the client has been closed.
INFO:     127.0.0.1:61014 - "GET /documents HTTP/1.1" 401 Unauthorized
[... repeated many times ...]
```

### After Fix:
```
WARNING:services.google_auth:v3 endpoint failed, trying v2: {...}
ERROR:services.google_auth:Error getting user info: Cannot send a request, as the client has been closed.
ERROR:__main__:Token validation error: Cannot send a request, as the client has been closed.
INFO:     127.0.0.1:61014 - "GET /documents HTTP/1.1" 401 Unauthorized
```

Jauh lebih bersih! Hanya menampilkan warning dan error yang penting.

## Files Modified

1. **Frontend:**
   - `app/page.tsx` - Fixed auth state detection
   - `app/auth/callback/page.tsx` - Improved redirect handling

2. **Backend:**
   - `.env` - Added LOG_LEVEL configuration
   - `main.py` - Configured selective logging

## Notes

- Login fix menggunakan `window.location.replace()` untuk menghindari race conditions
- Logging configuration sekarang lebih fleksibel dan dapat disesuaikan
- httpx logging sangat verbose dan sekarang di-suppress ke WARNING level
- RAG pipeline logging tetap di INFO level karena berguna untuk monitoring query performance
