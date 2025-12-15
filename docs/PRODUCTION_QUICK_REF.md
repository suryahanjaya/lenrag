# 🚀 Production Quick Reference

## Deploy Commands

### Windows
```powershell
.\deploy-production.ps1
```

### Linux/Mac
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

### Manual
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## Essential Commands

### Start/Stop
```bash
# Start production
docker-compose -f docker-compose.prod.yml up -d

# Stop production
docker-compose -f docker-compose.prod.yml down

# Restart production
docker-compose -f docker-compose.prod.yml restart

# Stop and remove volumes (⚠️ DATA LOSS!)
docker-compose -f docker-compose.prod.yml down -v
```

### Logs
```bash
# All logs (follow)
docker-compose -f docker-compose.prod.yml logs -f

# Backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Frontend logs
docker-compose -f docker-compose.prod.yml logs -f frontend

# Nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Status & Monitoring
```bash
# Container status
docker-compose -f docker-compose.prod.yml ps

# Resource usage (real-time)
docker stats

# Resource usage (snapshot)
docker stats --no-stream dora-backend-prod dora-frontend-prod

# Health check
curl http://localhost:8000/health
curl http://localhost:3000
curl http://localhost
```

### Configuration
```bash
# Check environment
docker exec dora-backend-prod env | grep ENVIRONMENT

# Check batch sizes
docker exec dora-backend-prod env | grep BATCH_SIZE

# Check thread config
docker exec dora-backend-prod env | grep NUM_THREADS
```

---

## Production URLs

| Service | URL | Notes |
|---------|-----|-------|
| **Nginx (HTTP)** | http://localhost | Main entry point |
| **Nginx (HTTPS)** | https://localhost | If SSL configured |
| **Frontend Direct** | http://localhost:3000 | Bypass Nginx |
| **Backend Direct** | http://localhost:8000 | Bypass Nginx |
| **API Docs** | http://localhost:8000/docs | Swagger UI |

---

## Configuration Matrix

| Setting | Development | Production |
|---------|------------|------------|
| **Fetch Batch** | 60 | 60 |
| **Embed Batch** | 15 | 15 |
| **CPU Threads** | 16 | 16 |
| **Workers** | 8 | 8 |
| **CPU Limit** | Unlimited | Unlimited |
| **RAM Limit** | Unlimited | Unlimited |
| **Restart Policy** | unless-stopped | always |
| **Logging** | Console | Compressed JSON |
| **Nginx** | ❌ | ✅ |
| **SSL** | ❌ | Optional |

---

## Troubleshooting Quick Fixes

### Container won't start
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml restart
```

### Out of memory
```bash
# Edit backend/.env
EMBEDDING_BATCH_SIZE=5

# Restart
docker-compose -f docker-compose.prod.yml restart backend
```

### Slow performance
```bash
# Check resources
docker stats

# Increase if you have resources (edit backend/.env)
BULK_UPLOAD_BATCH_SIZE=100
EMBEDDING_BATCH_SIZE=20

# Restart
docker-compose -f docker-compose.prod.yml restart backend
```

### Nginx 502 error
```bash
# Check backend
docker-compose -f docker-compose.prod.yml ps backend

# Restart all
docker-compose -f docker-compose.prod.yml restart
```

### Clean rebuild
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## Backup & Restore

### Backup
```bash
# Create backup directory
mkdir -p backups

# Backup ChromaDB
docker run --rm \
  -v dora-chroma-db-prod:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/chroma-$(date +%Y%m%d).tar.gz /data

# Backup cache
docker run --rm \
  -v dora-backend-cache-prod:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/cache-$(date +%Y%m%d).tar.gz /data
```

### Restore
```bash
# Restore ChromaDB
docker run --rm \
  -v dora-chroma-db-prod:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/chroma-YYYYMMDD.tar.gz -C /

# Restore cache
docker run --rm \
  -v dora-backend-cache-prod:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/cache-YYYYMMDD.tar.gz -C /
```

---

## Security Checklist

- [ ] SSL certificates configured
- [ ] Firewall rules set (ports 80, 443)
- [ ] Environment variables secured
- [ ] Nginx security headers enabled
- [ ] API keys in .env (not hardcoded)
- [ ] Regular backups scheduled
- [ ] Log rotation enabled
- [ ] Health checks configured

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **126 files upload** | 4-6 mins | ✅ |
| **CPU usage** | 80-95% | ✅ |
| **RAM usage** | 5-8GB | ✅ |
| **Uptime** | 99.9% | ✅ |
| **Response time** | <2s | ✅ |

---

## Update Procedure

```bash
# 1. Pull latest code
git pull origin main

# 2. Backup data
./backup.sh  # or manual backup commands

# 3. Stop services
docker-compose -f docker-compose.prod.yml down

# 4. Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache

# 5. Start services
docker-compose -f docker-compose.prod.yml up -d

# 6. Verify
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:8000/health
```

---

## Environment Variables

### Required
```bash
# backend/.env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GROQ_API_KEY=...
BULK_UPLOAD_BATCH_SIZE=60
EMBEDDING_BATCH_SIZE=15
ENVIRONMENT=production

# .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_BACKEND_URL=http://your-domain.com/api
```

### Optional
```bash
# backend/.env
GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
LOG_LEVEL=WARNING
```

---

## Monitoring Alerts

Set up alerts for:
- CPU usage > 95% for 5+ minutes
- RAM usage > 90%
- Disk usage > 85%
- Container restarts > 3 in 1 hour
- Response time > 5 seconds
- Error rate > 5%

---

## Support Contacts

- **Documentation**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Logs**: `docker-compose -f docker-compose.prod.yml logs -f`
- **Stats**: `docker stats`
- **Health**: `curl http://localhost:8000/health`

---

**Version**: 2.0.0  
**Last Updated**: 2025-12-14  
**Environment**: Production  
**Status**: ✅ Ready
