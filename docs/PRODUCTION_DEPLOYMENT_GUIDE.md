# 🚀 Production Deployment Guide

## Overview

Panduan lengkap untuk deploy DORA ke production environment dengan konfigurasi optimal:
- **60 parallel fetch** dari Google Drive
- **15 parallel embedding** untuk AI processing
- **Unlimited Docker resources** untuk performa maksimal
- **Auto-restart** on failure
- **Nginx reverse proxy** untuk load balancing
- **Compressed logging** untuk efisiensi storage

---

## 📋 Pre-Deployment Checklist

### 1. Environment Files

Pastikan file-file berikut sudah dikonfigurasi:

#### `backend/.env`
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# AI/LLM
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Performance
BULK_UPLOAD_BATCH_SIZE=60
EMBEDDING_BATCH_SIZE=15

# Environment
ENVIRONMENT=production
LOG_LEVEL=WARNING
```

#### `.env.local`
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
NEXT_PUBLIC_BACKEND_URL=http://your-domain.com/api
```

### 2. SSL Certificates (Optional but Recommended)

Jika menggunakan HTTPS:
```bash
# Create SSL directory
mkdir -p ssl

# Copy your certificates
cp /path/to/your/cert.pem ssl/
cp /path/to/your/key.pem ssl/
```

### 3. Nginx Configuration

Edit `nginx.conf` untuk domain Anda:
```nginx
server_name your-domain.com www.your-domain.com;
```

---

## 🚀 Deployment Methods

### Method 1: Automated Script (Recommended)

#### Windows (PowerShell):
```powershell
.\deploy-production.ps1
```

#### Linux/Mac:
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

### Method 2: Manual Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build --no-cache

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📊 Production Configuration

### Docker Compose Production Settings

| Component | Configuration | Value |
|-----------|--------------|-------|
| **Backend** | | |
| - CPU Limit | Unlimited | `cpus: '0'` |
| - Memory Limit | Unlimited | `memory: 0` |
| - Shared Memory | 4GB | `shm_size: '4gb'` |
| - Workers | 8 | Uvicorn workers |
| - Threads | 16 | CPU threads |
| - Restart Policy | Always | Auto-restart |
| **Frontend** | | |
| - Build Mode | Production | Next.js optimized |
| - Output | Standalone | Minimal size |
| - Restart Policy | Always | Auto-restart |
| **Nginx** | | |
| - Ports | 80, 443 | HTTP, HTTPS |
| - Restart Policy | Always | Auto-restart |

### Performance Settings

```yaml
# In docker-compose.prod.yml
environment:
  - BULK_UPLOAD_BATCH_SIZE=60      # Fetch 60 files parallel
  - EMBEDDING_BATCH_SIZE=15        # Embed 15 files parallel
  - OMP_NUM_THREADS=16             # NumPy threads
  - MKL_NUM_THREADS=16             # MKL threads
  - OPENBLAS_NUM_THREADS=16        # OpenBLAS threads
  - NUMEXPR_NUM_THREADS=16         # NumExpr threads
  - TORCH_NUM_THREADS=16           # PyTorch threads
```

---

## 🔍 Verification

### 1. Check Container Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

Expected output:
```
NAME                  STATUS              PORTS
dora-backend-prod     Up (healthy)        0.0.0.0:8000->8000/tcp
dora-frontend-prod    Up (healthy)        0.0.0.0:3000->3000/tcp
dora-nginx            Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 2. Verify Configuration

```bash
# Check batch sizes
docker exec dora-backend-prod env | grep BATCH_SIZE

# Expected:
# BULK_UPLOAD_BATCH_SIZE=60
# EMBEDDING_BATCH_SIZE=15

# Check environment
docker exec dora-backend-prod env | grep ENVIRONMENT

# Expected:
# ENVIRONMENT=production
```

### 3. Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000

# Via Nginx
curl http://localhost
```

### 4. Resource Usage

```bash
docker stats dora-backend-prod dora-frontend-prod dora-nginx
```

---

## 📈 Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Backend only
docker-compose -f docker-compose.prod.yml logs -f backend

# Frontend only
docker-compose -f docker-compose.prod.yml logs -f frontend

# Nginx only
docker-compose -f docker-compose.prod.yml logs -f nginx

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Log Files

Production logs are automatically compressed and rotated:
- **Max size**: 10MB per file
- **Max files**: 5 files (backend/frontend), 3 files (nginx)
- **Compression**: Enabled
- **Location**: Docker managed

### Resource Monitoring

```bash
# Real-time stats
docker stats

# Specific container
docker stats dora-backend-prod

# One-time snapshot
docker stats --no-stream
```

---

## 🔧 Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Data

```bash
# Backup ChromaDB
docker run --rm -v dora-chroma-db-prod:/data -v $(pwd)/backups:/backup alpine tar czf /backup/chroma-db-$(date +%Y%m%d).tar.gz /data

# Backup cache
docker run --rm -v dora-backend-cache-prod:/data -v $(pwd)/backups:/backup alpine tar czf /backup/cache-$(date +%Y%m%d).tar.gz /data
```

### Restore Data

```bash
# Restore ChromaDB
docker run --rm -v dora-chroma-db-prod:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/chroma-db-YYYYMMDD.tar.gz -C /

# Restore cache
docker run --rm -v dora-backend-cache-prod:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/cache-YYYYMMDD.tar.gz -C /
```

### Clean Up

```bash
# Remove stopped containers
docker-compose -f docker-compose.prod.yml down

# Remove containers and volumes (⚠️ DATA LOSS!)
docker-compose -f docker-compose.prod.yml down -v

# Remove unused images
docker image prune -a

# Full cleanup
docker system prune -a --volumes
```

---

## 🔒 Security Best Practices

### 1. Environment Variables

❌ **Don't**:
```bash
# Hardcode secrets in docker-compose.yml
environment:
  - GOOGLE_CLIENT_SECRET=abc123
```

✅ **Do**:
```bash
# Use .env file or environment variables
environment:
  - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
```

### 2. SSL/TLS

```bash
# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# For production, use Let's Encrypt
certbot certonly --standalone -d your-domain.com
```

### 3. Firewall Rules

```bash
# Allow only necessary ports
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 22/tcp    # SSH (if needed)
ufw enable
```

### 4. Update nginx.conf

```nginx
# Enable HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 🆘 Troubleshooting

### Issue: Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if port is in use
netstat -tulpn | grep :8000

# Restart Docker
sudo systemctl restart docker
```

### Issue: Out of Memory

```bash
# Check current usage
docker stats

# Reduce batch sizes in backend/.env
BULK_UPLOAD_BATCH_SIZE=30
EMBEDDING_BATCH_SIZE=5

# Restart
docker-compose -f docker-compose.prod.yml restart backend
```

### Issue: Slow Performance

```bash
# Check resource limits
docker inspect dora-backend-prod | grep -A 10 Resources

# Increase batch sizes if you have resources
# Edit backend/.env
BULK_UPLOAD_BATCH_SIZE=100
EMBEDDING_BATCH_SIZE=20

# Restart
docker-compose -f docker-compose.prod.yml restart backend
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check backend is running
docker-compose -f docker-compose.prod.yml ps backend

# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Issue: Database Corruption

```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Remove corrupted volume
docker volume rm dora-chroma-db-prod

# Restore from backup
docker run --rm -v dora-chroma-db-prod:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/chroma-db-YYYYMMDD.tar.gz -C /

# Restart
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Performance Benchmarks

### Expected Performance (Production)

| Files | Time (60+15 Config) | CPU Usage | RAM Usage |
|-------|-------------------|-----------|-----------|
| 50    | ~2-3 mins        | 80-90%    | 4-6GB     |
| 126   | ~4-6 mins        | 85-95%    | 5-8GB     |
| 500   | ~15-20 mins      | 90-100%   | 6-10GB    |
| 1000  | ~30-40 mins      | 90-100%   | 8-12GB    |

### Optimization Tips

1. **More CPU cores** → Increase thread counts to 32
2. **More RAM** → Increase batch sizes to 100/20
3. **SSD storage** → Faster ChromaDB writes
4. **Fast network** → Faster Google Drive downloads

---

## 🎯 Production Checklist

Before going live:

- [ ] Environment variables configured
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Nginx configured for your domain
- [ ] Firewall rules set
- [ ] Backup strategy in place
- [ ] Monitoring tools configured
- [ ] Health checks passing
- [ ] Resource limits appropriate
- [ ] Logs rotating properly
- [ ] Auto-restart enabled
- [ ] Security headers configured
- [ ] API keys secured
- [ ] Database backed up

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Check resources: `docker stats`
3. Verify configuration: `docker exec dora-backend-prod env`
4. Restart services: `docker-compose -f docker-compose.prod.yml restart`
5. Clean rebuild: `docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml build --no-cache && docker-compose -f docker-compose.prod.yml up -d`

---

**Last Updated**: 2025-12-14  
**Version**: 2.0.0  
**Environment**: Production  
**Configuration**: 60 Fetch + 15 Embed + Unlimited Resources
