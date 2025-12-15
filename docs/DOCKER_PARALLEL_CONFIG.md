# 🚀 Docker Configuration - Optimized for Parallel Processing

## Overview
Konfigurasi Docker ini dioptimalkan untuk:
- **60 file fetch secara bersamaan** (Network Bound - Fast!)
- **15 file embedding & store secara bersamaan** (CPU/GPU Bound - Optimal!)
- **Unlimited resources** - Docker tidak membatasi CPU/RAM

## ⚙️ Konfigurasi Utama

### 1. **Fetch Batch Size: 60 files**
- **Lokasi**: `BULK_UPLOAD_BATCH_SIZE=60`
- **Fungsi**: Mengunduh 60 file secara paralel dari Google Drive
- **Optimasi**: Network-bound operation, sangat cepat karena hanya download bytes
- **Resource**: Minimal CPU, moderate network bandwidth

### 2. **Embedding Batch Size: 15 files**
- **Lokasi**: `EMBEDDING_BATCH_SIZE=15`
- **Fungsi**: Extract text + embedding + save ke ChromaDB untuk 15 file secara paralel
- **Optimasi**: CPU/GPU-bound operation, memerlukan processing power
- **Resource**: High CPU, moderate RAM

### 3. **Unlimited Docker Resources**
```yaml
deploy:
  resources:
    limits:
      cpus: '0'  # 0 = unlimited CPU cores
      memory: 0  # 0 = unlimited memory
```
- Docker akan menggunakan **semua CPU dan RAM yang tersedia**
- Tidak ada bottleneck dari Docker resource limits
- System akan mengatur resource allocation secara otomatis

## 📊 Performance Metrics

### Expected Performance:
- **126 files**: ~4-6 minutes total
- **500 files**: ~15-20 minutes total
- **1000+ files**: ~30-40 minutes total

### Resource Usage:
- **CPU**: 60-80% utilization during fetch, 90-100% during embedding
- **RAM**: 4-8GB peak usage (depends on file sizes)
- **Network**: High bandwidth during fetch phase
- **Disk I/O**: Moderate during ChromaDB writes

## 🔧 Configuration Files

### 1. `Dockerfile.backend`
```dockerfile
# CPU Threads: 16 (increased from 8)
ENV OMP_NUM_THREADS=16
ENV MKL_NUM_THREADS=16
ENV OPENBLAS_NUM_THREADS=16
ENV NUMEXPR_NUM_THREADS=16
ENV TORCH_NUM_THREADS=16

# Batch Configuration
ENV BULK_UPLOAD_BATCH_SIZE=60
ENV EMBEDDING_BATCH_SIZE=15

# Workers: 8 (increased from 4)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "8"]
```

### 2. `docker-compose.yml`
```yaml
environment:
  - BULK_UPLOAD_BATCH_SIZE=60
  - EMBEDDING_BATCH_SIZE=15
  - OMP_NUM_THREADS=16
  - MKL_NUM_THREADS=16
  - OPENBLAS_NUM_THREADS=16
  - NUMEXPR_NUM_THREADS=16
  - TORCH_NUM_THREADS=16

deploy:
  resources:
    limits:
      cpus: '0'  # unlimited
      memory: 0  # unlimited

shm_size: '4gb'  # increased from 2gb
```

### 3. `backend/.env`
```bash
BULK_UPLOAD_BATCH_SIZE=60
EMBEDDING_BATCH_SIZE=15
```

## 🚀 How It Works

### Phase 1: Parallel Fetch (60 files at once)
```
[File 1] [File 2] [File 3] ... [File 60]
   ↓        ↓        ↓            ↓
Download Download Download ... Download
   ↓        ↓        ↓            ↓
[Raw Bytes Buffer] (in memory)
```
- **Duration**: ~10-30 seconds for 60 files
- **Bottleneck**: Network bandwidth
- **CPU Usage**: Low (5-10%)

### Phase 2: Parallel Embedding (15 files at once)
```
[Raw 1] [Raw 2] ... [Raw 15]
   ↓       ↓           ↓
Extract Extract ... Extract (PDF/PPTX/DOCX parsing)
   ↓       ↓           ↓
Chunk   Chunk   ... Chunk
   ↓       ↓           ↓
Embed   Embed   ... Embed (AI model)
   ↓       ↓           ↓
Save    Save    ... Save (ChromaDB)
```
- **Duration**: ~2-4 minutes for 60 files (4 batches of 15)
- **Bottleneck**: CPU/GPU for embedding
- **CPU Usage**: High (80-100%)

### Complete Flow:
```
Fetch Batch 1 (60 files) → Embed Batch 1.1 (15 files)
                         → Embed Batch 1.2 (15 files)
                         → Embed Batch 1.3 (15 files)
                         → Embed Batch 1.4 (15 files)

Fetch Batch 2 (60 files) → Embed Batch 2.1 (15 files)
                         → ...
```

## 🎯 Tuning Guide

### If you have **MORE resources** (16GB+ RAM, 16+ CPU cores):
```bash
# In backend/.env
BULK_UPLOAD_BATCH_SIZE=100  # fetch 100 at once
EMBEDDING_BATCH_SIZE=20     # embed 20 at once

# In docker-compose.yml
- OMP_NUM_THREADS=32
- MKL_NUM_THREADS=32
# ... (all thread counts to 32)

# In Dockerfile.backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "12"]
```

### If you have **LESS resources** (4GB RAM, 4 CPU cores):
```bash
# In backend/.env
BULK_UPLOAD_BATCH_SIZE=30   # fetch 30 at once
EMBEDDING_BATCH_SIZE=5      # embed 5 at once

# In docker-compose.yml
- OMP_NUM_THREADS=4
- MKL_NUM_THREADS=4
# ... (all thread counts to 4)

# In Dockerfile.backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

## 📝 Deployment Instructions

### 1. Build Docker Images
```bash
docker-compose build --no-cache
```

### 2. Start Services
```bash
docker-compose up -d
```

### 3. Monitor Performance
```bash
# View logs
docker-compose logs -f backend

# Monitor resource usage
docker stats dora-backend

# Check health
docker-compose ps
```

### 4. Stop Services
```bash
docker-compose down
```

### 5. Clean Up (if needed)
```bash
# Remove containers and volumes
docker-compose down -v

# Remove images
docker rmi lenrag-backend lenrag-frontend
```

## 🔍 Troubleshooting

### Issue: "Out of Memory" errors
**Solution**: Reduce batch sizes
```bash
BULK_UPLOAD_BATCH_SIZE=30
EMBEDDING_BATCH_SIZE=5
```

### Issue: Slow embedding performance
**Solution**: Increase thread counts and embedding batch size
```bash
OMP_NUM_THREADS=32
EMBEDDING_BATCH_SIZE=20
```

### Issue: Network timeouts during fetch
**Solution**: Reduce fetch batch size
```bash
BULK_UPLOAD_BATCH_SIZE=30
```

### Issue: Docker using too much CPU
**Solution**: Set CPU limits (not recommended for max speed)
```yaml
deploy:
  resources:
    limits:
      cpus: '8'  # limit to 8 cores
```

## 📈 Monitoring Commands

### Real-time CPU/RAM usage:
```bash
docker stats dora-backend --no-stream
```

### View upload progress:
```bash
docker-compose logs -f backend | grep "Processing batch"
```

### Check ChromaDB size:
```bash
docker exec dora-backend du -sh /app/chroma_db
```

## ✅ Verification

After deployment, verify the configuration:

```bash
# Check environment variables
docker exec dora-backend env | grep BATCH_SIZE

# Expected output:
# BULK_UPLOAD_BATCH_SIZE=60
# EMBEDDING_BATCH_SIZE=15

# Check thread configuration
docker exec dora-backend env | grep NUM_THREADS

# Expected output:
# OMP_NUM_THREADS=16
# MKL_NUM_THREADS=16
# OPENBLAS_NUM_THREADS=16
# NUMEXPR_NUM_THREADS=16
# TORCH_NUM_THREADS=16
```

## 🎉 Summary

Konfigurasi ini memberikan:
- ✅ **60 parallel fetch** - Download cepat dari Google Drive
- ✅ **15 parallel embedding** - Optimal CPU/GPU utilization
- ✅ **Unlimited Docker resources** - No bottlenecks
- ✅ **8 Uvicorn workers** - Handle concurrent requests
- ✅ **16 CPU threads** - Maximum parallel processing
- ✅ **4GB shared memory** - Large batch operations

**Result**: Upload 126 files dalam ~4-6 menit! 🚀
