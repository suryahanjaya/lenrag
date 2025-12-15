# 🚀 Quick Start Guide - Docker Deployment

## TL;DR - Cara Cepat Deploy

### Windows (PowerShell):
```powershell
.\deploy-docker.ps1
```

### Linux/Mac (Bash):
```bash
chmod +x deploy-docker.sh
./deploy-docker.sh
```

### Manual (All Platforms):
```bash
docker-compose build
docker-compose up -d
```

---

## 📊 Konfigurasi Saat Ini

| Parameter | Value | Keterangan |
|-----------|-------|------------|
| **Fetch Batch** | 60 files | Download 60 file secara bersamaan |
| **Embedding Batch** | 15 files | Embed 15 file secara bersamaan |
| **CPU Threads** | 16 threads | Thread untuk NumPy/PyTorch |
| **Uvicorn Workers** | 8 workers | Handle concurrent requests |
| **Docker CPU** | Unlimited | Tidak ada limit |
| **Docker RAM** | Unlimited | Tidak ada limit |
| **Shared Memory** | 4GB | Untuk batch operations |

---

## ⚙️ Cara Mengubah Konfigurasi

### 1. Ubah Batch Size

Edit file `backend/.env`:
```bash
# Fetch batch (Network Bound)
BULK_UPLOAD_BATCH_SIZE=60

# Embedding batch (CPU Bound)
EMBEDDING_BATCH_SIZE=15
```

### 2. Ubah CPU Threads

Edit file `docker-compose.yml`:
```yaml
environment:
  - OMP_NUM_THREADS=16
  - MKL_NUM_THREADS=16
  - OPENBLAS_NUM_THREADS=16
  - NUMEXPR_NUM_THREADS=16
  - TORCH_NUM_THREADS=16
```

### 3. Ubah Jumlah Workers

Edit file `Dockerfile.backend`:
```dockerfile
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "8"]
```

### 4. Set Resource Limits (Jika Diperlukan)

Edit file `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '8'    # Limit to 8 cores (0 = unlimited)
      memory: 8G   # Limit to 8GB (0 = unlimited)
```

---

## 🎯 Preset Konfigurasi

### 🚀 Maximum Speed (16GB+ RAM, 16+ cores)
```bash
# backend/.env
BULK_UPLOAD_BATCH_SIZE=100
EMBEDDING_BATCH_SIZE=20

# docker-compose.yml
- OMP_NUM_THREADS=32
# ... (all thread counts to 32)

# Dockerfile.backend
--workers 12
```

### ⚡ Balanced (8GB RAM, 8 cores) - **DEFAULT**
```bash
# backend/.env
BULK_UPLOAD_BATCH_SIZE=60
EMBEDDING_BATCH_SIZE=15

# docker-compose.yml
- OMP_NUM_THREADS=16
# ... (all thread counts to 16)

# Dockerfile.backend
--workers 8
```

### 💻 Limited Resources (4GB RAM, 4 cores)
```bash
# backend/.env
BULK_UPLOAD_BATCH_SIZE=30
EMBEDDING_BATCH_SIZE=5

# docker-compose.yml
- OMP_NUM_THREADS=4
# ... (all thread counts to 4)

# Dockerfile.backend
--workers 2
```

---

## 📋 Command Cheat Sheet

### Deployment
```bash
# Build images
docker-compose build

# Build without cache
docker-compose build --no-cache

# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View status
docker-compose ps
```

### Monitoring
```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View frontend logs only
docker-compose logs -f frontend

# View resource usage
docker stats

# View specific container stats
docker stats dora-backend
```

### Debugging
```bash
# Enter backend container
docker exec -it dora-backend bash

# Enter frontend container
docker exec -it dora-frontend sh

# Check environment variables
docker exec dora-backend env | grep BATCH_SIZE

# Check ChromaDB size
docker exec dora-backend du -sh /app/chroma_db

# Test backend health
curl http://localhost:8000/health
```

### Cleanup
```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v

# Remove images
docker rmi lenrag-backend lenrag-frontend

# Remove all unused Docker resources
docker system prune -a
```

---

## 🔍 Troubleshooting

### Problem: Container won't start
```bash
# Check logs
docker-compose logs backend

# Check if port is already in use
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# Restart Docker Desktop
```

### Problem: Out of memory
```bash
# Reduce batch sizes in backend/.env
BULK_UPLOAD_BATCH_SIZE=30
EMBEDDING_BATCH_SIZE=5

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Problem: Slow performance
```bash
# Check resource usage
docker stats

# Increase batch sizes if you have resources
# Edit backend/.env
BULK_UPLOAD_BATCH_SIZE=100
EMBEDDING_BATCH_SIZE=20

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Problem: Network timeout
```bash
# Reduce fetch batch size
# Edit backend/.env
BULK_UPLOAD_BATCH_SIZE=30

# Restart
docker-compose restart backend
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend is running: http://localhost:8000
- [ ] Frontend is running: http://localhost:3000
- [ ] API docs accessible: http://localhost:8000/docs
- [ ] Health check passes: `curl http://localhost:8000/health`
- [ ] Environment variables correct:
  ```bash
  docker exec dora-backend env | grep BATCH_SIZE
  # Should show:
  # BULK_UPLOAD_BATCH_SIZE=60
  # EMBEDDING_BATCH_SIZE=15
  ```
- [ ] Resource usage is normal: `docker stats`

---

## 📈 Expected Performance

| Files | Time (Balanced Config) | Time (Max Speed) |
|-------|----------------------|------------------|
| 50    | ~2-3 mins           | ~1-2 mins        |
| 126   | ~4-6 mins           | ~3-4 mins        |
| 500   | ~15-20 mins         | ~10-12 mins      |
| 1000  | ~30-40 mins         | ~20-25 mins      |

*Times are approximate and depend on file sizes and system resources*

---

## 🆘 Need Help?

1. Check logs: `docker-compose logs -f backend`
2. Check resource usage: `docker stats`
3. Read full documentation: `DOCKER_PARALLEL_CONFIG.md`
4. Restart services: `docker-compose restart`
5. Clean rebuild: `docker-compose down && docker-compose build --no-cache && docker-compose up -d`

---

## 🎉 Success Indicators

You'll know it's working when you see in the logs:

```
📊 Found 126 files - ULTRA FAST MODE: 60 parallel fetch + 15 parallel embedding!
⚡ Batch 1/3: Downloading 60 files (RAW)...
✅ Downloaded 60 files. Starting Batch Extraction & Embedding (15 at a time)...
✅ Batch 1/3 complete: 60/126 files
```

---

**Last Updated**: 2025-12-14
**Version**: 2.0.0
**Configuration**: 60 Fetch + 15 Embed + Unlimited Resources
