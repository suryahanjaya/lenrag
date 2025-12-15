# Railway Deployment - Manual Configuration

## ⚠️ IMPORTANT: Railway Dashboard Settings

Jika deployment gagal dengan error "The executable `cd` could not be found", 
lakukan langkah berikut di Railway Dashboard:

### Fix di Railway Dashboard:

1. **Buka Project Settings**
   - Railway Dashboard → Your Project → Settings

2. **Build Settings**
   - Builder: **Dockerfile**
   - Dockerfile Path: **`railway.dockerfile`**

3. **Deploy Settings**
   - ⚠️ **PENTING**: Pastikan field "Custom Start Command" atau "Start Command" **KOSONG**
   - Jangan isi apapun di field ini
   - Railway akan otomatis pakai CMD dari Dockerfile

4. **Health Check**
   - Health Check Path: **`/health`**
   - Health Check Timeout: **100**

5. **Save & Redeploy**
   - Klik Save
   - Klik Redeploy

### Kenapa Error "cd not found"?

Railway mencoba run custom start command yang mungkin tersimpan dari deployment sebelumnya:
```bash
cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Command `cd` tidak tersedia di Docker container sebagai executable.

### Solusi:

Hapus custom start command, biarkan Railway pakai CMD dari Dockerfile:
```dockerfile
CMD uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
```

### Screenshot Lokasi Settings:

Di Railway Dashboard:
```
Settings
  ├── Build
  │   ├── Builder: Dockerfile ✅
  │   └── Dockerfile Path: railway.dockerfile ✅
  │
  └── Deploy
      ├── Start Command: [KOSONGKAN INI] ⚠️
      ├── Health Check Path: /health ✅
      └── Health Check Timeout: 100 ✅
```

### Jika Masih Error:

1. Delete deployment
2. Create new deployment
3. Pastikan tidak ada custom start command
