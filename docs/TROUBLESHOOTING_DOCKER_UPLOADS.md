# 🔧 Troubleshooting Docker Upload Issues

## Problem: Upload Stuck or Error at File 96/126

### Symptoms
- Upload process freezes at a specific file (e.g., 96/126)
- Docker container runs out of memory
- Error: "Out of memory" or container crashes
- Last file is very large (>10MB)

### Root Causes
1. **Batch size too large** - Processing too many files in parallel
2. **Large files** - Some files are very large and consume too much memory
3. **Docker memory limit** - Container doesn't have enough memory allocated

---

## ✅ Solutions

### Solution 1: Adjust Batch Size (RECOMMENDED)

The batch size controls how many files are processed in parallel. Lower = more stable, higher = faster.

**Edit `backend/.env` file:**
```bash
# For Docker/Production (STABLE)
BULK_UPLOAD_BATCH_SIZE=20

# For Local with 16GB+ RAM (FASTER)
BULK_UPLOAD_BATCH_SIZE=50

# For systems with limited RAM
BULK_UPLOAD_BATCH_SIZE=10
```

**Then restart Docker:**
```bash
docker-compose down
docker-compose up -d --build
```

---

### Solution 2: Increase Docker Memory Limit

**Edit `docker-compose.yml`:**
```yaml
services:
  backend:
    # ... other config ...
    deploy:
      resources:
        limits:
          memory: 6G  # Increase from 4G to 6G
        reservations:
          memory: 3G  # Increase from 2G to 3G
    shm_size: '2gb'  # Increase from 1gb to 2gb
```

**Then restart:**
```bash
docker-compose down
docker-compose up -d
```

---

### Solution 3: Use Streaming Upload (BEST UX)

Instead of bulk upload, use the streaming endpoint which shows progress in real-time:

**Frontend change:**
Use `/documents/bulk-upload-from-folder-stream` instead of `/documents/bulk-upload-from-folder`

This endpoint:
- Shows progress as each file is saved
- More resilient to errors
- Better user experience
- Same memory usage but better feedback

---

### Solution 4: Split Large Uploads

If you have 126 files, split into smaller batches:
1. Upload first 50 files
2. Wait for completion
3. Upload next 50 files
4. Upload remaining files

---

## 🔍 Monitoring

### Check Docker Memory Usage
```bash
# See current memory usage
docker stats dora-backend

# See container logs
docker logs dora-backend -f
```

### Check for Large Files
Look for warnings in logs:
```
⚠️ Large document detected: filename.pdf (15.32 MB)
```

---

## 📊 Performance Benchmarks

| Batch Size | 126 Files | Memory Usage | Risk Level |
|------------|-----------|--------------|------------|
| 10         | ~5-8 min  | ~2GB         | ✅ Very Safe |
| 20         | ~3-5 min  | ~3GB         | ✅ Safe |
| **50**     | **~1-2 min**  | **~5GB**         | **✅ Balanced (DEFAULT)** |
| 100        | ~30-60s   | ~8GB         | ⚠️ High Risk (OOM) |

---

## 🎯 Recommended Settings

### For Docker Production (8GB+ RAM)
```bash
BULK_UPLOAD_BATCH_SIZE=50
```
```yaml
memory: 6G
reservations: 3G
```

### For Docker with Limited RAM (4-8GB)
```bash
BULK_UPLOAD_BATCH_SIZE=20
```
```yaml
memory: 4G
reservations: 2G
```

### For Local Development (16GB+ RAM)
```bash
BULK_UPLOAD_BATCH_SIZE=100
```

### For Limited RAM Systems
```bash
BULK_UPLOAD_BATCH_SIZE=10
```

---

## 🚨 Emergency Fix

If uploads keep failing:

1. **Stop Docker:**
   ```bash
   docker-compose down
   ```

2. **Clear Docker cache:**
   ```bash
   docker system prune -a
   ```

3. **Set conservative settings in `backend/.env`:**
   ```bash
   BULK_UPLOAD_BATCH_SIZE=10
   LOG_LEVEL=INFO
   ```

4. **Restart:**
   ```bash
   docker-compose up -d --build
   ```

---

## 📝 Notes

- **Default batch size changed from 100 to 20** for better stability
- **Memory limits added** to prevent OOM errors
- **Batch processing for embeddings** prevents memory overflow on large files
- **Streaming upload** recommended for better UX

---

## Need Help?

Check logs for specific errors:
```bash
docker logs dora-backend --tail 100
```

Look for:
- `⚠️ Large document detected` - File is very large
- `OOMKilled` - Out of memory error
- `Processing batch X/Y` - Shows progress
