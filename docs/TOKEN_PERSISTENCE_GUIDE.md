# Token Persistence & Auto-Refresh Implementation

## ✅ Solusi untuk "Harus Login Terus"

Saya sudah implementasi sistem **auto-refresh token** yang akan:
1. ✅ Simpan refresh token di localStorage
2. ✅ Auto-refresh access token sebelum expired (5 menit sebelum)
3. ✅ Token bertahan bahkan setelah refresh page
4. ✅ Tidak perlu login ulang selama refresh token masih valid

## 📁 Files yang Ditambahkan/Diubah:

### 1. **Backend: `/auth/refresh` Endpoint**
File: `backend/main.py` (line 122-145)

Endpoint baru untuk refresh access token:
```python
@app.post("/auth/refresh")
async def refresh_token(request: Request, refresh_request: Dict[str, str]):
    # Refresh access token using refresh token
    tokens = await google_auth_service.refresh_access_token(refresh_token)
    return {
        "access_token": tokens['access_token'],
        "expires_in": tokens.get('expires_in', 3600)
    }
```

### 2. **Frontend: Token Manager Utility**
File: `utils/tokenManager.ts`

Utility class untuk manage tokens:
- `saveTokens()` - Simpan access & refresh token
- `refreshAccessToken()` - Refresh token otomatis
- `startAutoRefresh()` - Auto-refresh sebelum expired
- `initialize()` - Init saat app start

## 🚀 Cara Implementasi:

### Step 1: Update Login Page

File: `app/page.tsx`

Tambahkan import dan gunakan TokenManager:

```typescript
import { TokenManager } from '@/utils/tokenManager';

// Di dalam handleGoogleCallback function:
const handleGoogleCallback = async (code: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    
    // PENTING: Simpan tokens menggunakan TokenManager
    TokenManager.saveTokens(
      data.access_token,
      data.refresh_token,
      3600 // expires in 1 hour
    );
    
    setUser(data.user);
    router.push('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

### Step 2: Initialize di App Root

File: `app/layout.tsx` atau `_app.tsx`

```typescript
import { TokenManager } from '@/utils/tokenManager';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize token manager on app start
    TokenManager.initialize();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Step 3: Update Logout

File: `components/dashboard/dashboard.tsx`

```typescript
const handleLogout = () => {
  // Clear tokens using TokenManager
  TokenManager.clearTokens();
  
  // Redirect to login
  window.location.href = '/';
};
```

## 🔄 Cara Kerja Auto-Refresh:

1. **Saat Login:**
   - Backend return `access_token` + `refresh_token`
   - Frontend simpan keduanya di localStorage
   - Hitung waktu expiry (1 jam - 5 menit buffer = 55 menit)
   - Set timer untuk auto-refresh

2. **Auto-Refresh (55 menit kemudian):**
   - Timer trigger `refreshAccessToken()`
   - Call `/auth/refresh` endpoint dengan refresh_token
   - Dapat access_token baru
   - Simpan token baru
   - Set timer lagi untuk next refresh

3. **Saat Refresh Page:**
   - `TokenManager.initialize()` dipanggil
   - Check apakah ada tokens di localStorage
   - Jika ada dan belum expired → set auto-refresh timer
   - Jika expired → refresh immediately
   - Jika tidak ada refresh_token → redirect ke login

## ⏱️ Timeline:

```
Login
  ↓
Save tokens (expires in 60 min)
  ↓
Set timer (55 min)
  ↓
... 55 minutes later ...
  ↓
Auto-refresh triggered
  ↓
Get new access_token
  ↓
Save new token
  ↓
Set timer again (55 min)
  ↓
... repeat ...
```

## 🎯 Keuntungan:

✅ **Tidak perlu login ulang** - Token auto-refresh sebelum expired
✅ **Persistent** - Token tersimpan di localStorage
✅ **Auto-recovery** - Jika page di-refresh, token tetap ada
✅ **Graceful failure** - Jika refresh gagal, redirect ke login
✅ **No server restart needed** - Semua handled di client-side

## 🐛 Troubleshooting:

### Token masih expired?
- Check console log: "Token will auto-refresh in X minutes"
- Pastikan `TokenManager.initialize()` dipanggil di app root
- Pastikan `saveTokens()` dipanggil setelah login

### Refresh token tidak ada?
- Google hanya memberikan refresh_token pada **first login**
- Untuk testing: Revoke access di Google Account settings
- Login ulang → akan dapat refresh_token baru

### Auto-refresh tidak jalan?
- Check browser console untuk error
- Pastikan backend `/auth/refresh` endpoint running
- Check network tab untuk refresh request

## 📝 Testing:

1. Login ke aplikasi
2. Check localStorage: harus ada `google_token`, `refresh_token`, `token_expiry`
3. Check console: "Token will auto-refresh in 55 minutes"
4. Refresh page → token masih ada, tidak perlu login ulang
5. Tunggu 55 menit (atau set expiry lebih pendek untuk testing)
6. Check console: "Refreshing access token..."
7. Check console: "Access token refreshed successfully"
8. Token baru tersimpan, tidak perlu login ulang

## 🔐 Security Notes:

- Refresh token disimpan di localStorage (acceptable untuk web app)
- Untuk production: consider using httpOnly cookies
- Token auto-refresh 5 menit sebelum expired (buffer)
- Jika refresh gagal → clear tokens & redirect ke login

## 🎉 Result:

Setelah implementasi ini:
- ✅ Login 1x → bisa pakai sampai refresh token expired (biasanya 30-90 hari)
- ✅ Refresh page → tidak perlu login ulang
- ✅ Token auto-refresh setiap 55 menit
- ✅ Tidak perlu restart server
- ✅ Smooth user experience
