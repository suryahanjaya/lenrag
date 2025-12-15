# Health Check Optimization

## Problem
Banyak pemanggilan `/health` endpoint yang terjadi selama proses embedding, menyebabkan:
- Overhead pada ChromaDB connection
- Resource contention dengan proses embedding yang CPU-intensive
- Log spam yang tidak perlu

## Root Cause
Docker health check terlalu agresif:
- **Interval**: 10 detik (terlalu sering)
- **ChromaDB Test**: Setiap health check membuat koneksi ke ChromaDB
- **Multiple Sources**: Docker Compose + Dockerfile healthcheck

## Solution Applied

### 1. Simplified Health Check Endpoint (`backend/main.py`)
**Before:**
```python
@app.get("/health")
async def health_check():
    try:
        # Test ChromaDB connection
        test_collection = dora_pipeline._get_user_collection("test_user")
        chroma_status = "operational"
    except Exception as e:
        chroma_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "services": {
            "google_auth": "operational",
            "dora_pipeline": "operational",
            "database": "operational",
            "chromadb": chroma_status
        }
    }
```

**After:**
```python
@app.get("/health")
async def health_check():
    """Lightweight health check endpoint - optimized to not interfere with heavy operations"""
    # Simple status check without testing ChromaDB to avoid resource contention
    # during embedding operations
    return {
        "status": "healthy",
        "services": {
            "api": "operational"
        }
    }
```

### 2. Reduced Health Check Frequency

#### `docker-compose.yml` & `docker-compose.prod.yml`
**Before:**
```yaml
healthcheck:
  test: [ "CMD", "curl", "-f", "http://localhost:8000/health" ]
  interval: 10s
  timeout: 10s
  retries: 5/10
```

**After:**
```yaml
healthcheck:
  test: [ "CMD", "curl", "-f", "http://localhost:8000/health" ]
  interval: 60s  # Reduced frequency to avoid interfering with embedding
  timeout: 5s
  retries: 3
```

## Impact

### Performance Improvements:
- ✅ **86% reduction** in health check frequency (10s → 60s)
- ✅ **No ChromaDB overhead** during embedding operations
- ✅ **Cleaner logs** - 86% less health check spam
- ✅ **Better resource allocation** for embedding tasks

### Trade-offs:
- ⚠️ Slower failure detection (60s vs 10s)
- ℹ️ This is acceptable because:
  - Health checks are for Docker orchestration, not critical monitoring
  - 60s is still fast enough for container health management
  - Embedding operations can take 10+ minutes, so 60s interval is negligible

## Testing
To verify the optimization:
1. Start the backend
2. Monitor logs during bulk upload
3. You should see health check logs only once per minute instead of 6 times per minute

## Rollback
If needed, revert to previous settings:
```yaml
interval: 10s
timeout: 10s
retries: 5
```

And restore ChromaDB test in health check endpoint.
