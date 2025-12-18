# 📊 Batch Size Configuration Reference

## Quick Overview

| Environment | Memory | Fetch Batch | Embed Batch | Max Docs/Upload |
|-------------|--------|-------------|-------------|-----------------|
| **Docker**  | ∞      | 60          | 15          | 1000+           |
| **Railway** | 512MB  | 3           | 1           | 10-20           |
| **Vercel**  | 512MB  | 1           | 1           | 1-5             |

## Environment Detection

The backend automatically detects the environment and adjusts batch sizes:

```python
# config.py
@property
def is_memory_constrained(self) -> bool:
    """Detect if running on memory-constrained environment"""
    return self.is_railway or self.is_vercel or os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("VERCEL")

@property
def bulk_upload_batch_size(self) -> int:
    """Adaptive batch size based on environment"""
    if self.is_memory_constrained:
        return int(os.getenv("BULK_UPLOAD_BATCH_SIZE", "3"))  # Railway: 3 files
    return int(os.getenv("BULK_UPLOAD_BATCH_SIZE", "60"))  # Docker: 60 files

@property
def embedding_batch_size(self) -> int:
    """Adaptive embedding batch size based on environment"""
    if self.is_memory_constrained:
        return int(os.getenv("EMBEDDING_BATCH_SIZE", "1"))  # Railway: 1 file
    return int(os.getenv("EMBEDDING_BATCH_SIZE", "15"))  # Docker: 15 files
```

## Configuration Files

### Docker Production (`.env.production`)
```bash
ENVIRONMENT=production
BULK_UPLOAD_BATCH_SIZE=60
EMBEDDING_BATCH_SIZE=15
LOG_LEVEL=WARNING
```

### Railway (`.env.railway`)
```bash
ENVIRONMENT=production
RAILWAY_ENVIRONMENT=true
BULK_UPLOAD_BATCH_SIZE=3
EMBEDDING_BATCH_SIZE=1
LOG_LEVEL=WARNING
```

### Vercel (`.env.vercel`)
```bash
ENVIRONMENT=production
VERCEL=1
BULK_UPLOAD_BATCH_SIZE=1
EMBEDDING_BATCH_SIZE=1
LOG_LEVEL=WARNING
```

## How It Works

### 1. Document Fetching (Network Bound)
- **Docker**: Fetches 60 documents in parallel
- **Railway**: Fetches 3 documents in parallel
- **Vercel**: Fetches 1 document at a time

### 2. Text Extraction & Embedding (CPU/Memory Bound)
- **Docker**: Processes 15 documents in parallel
- **Railway**: Processes 1 document at a time
- **Vercel**: Processes 1 document at a time

### 3. Two-Stage Pipeline
```
Stage 1: FETCH (Fast - Network Bound)
├── Docker: 60 parallel downloads
├── Railway: 3 parallel downloads
└── Vercel: 1 download

Stage 2: EXTRACT + EMBED (Slow - CPU/Memory Bound)
├── Docker: 15 parallel processing
├── Railway: 1 sequential processing
└── Vercel: 1 sequential processing
```

## Performance Comparison

### 100 Documents Upload

**Docker (60 fetch, 15 embed)**
- Fetch: ~30 seconds (60 at a time)
- Process: ~5-8 minutes (15 at a time)
- **Total: ~6-9 minutes**

**Railway (3 fetch, 1 embed)**
- Fetch: ~2 minutes (3 at a time)
- Process: ~40-60 minutes (1 at a time)
- **Total: ~42-62 minutes**
- ⚠️ **Risk: OOM after 10-20 documents**

**Vercel (1 fetch, 1 embed)**
- Fetch: ~5 minutes (1 at a time)
- Process: ~80-100 minutes (1 at a time)
- **Total: ~85-105 minutes**
- ⚠️ **Risk: OOM after 3-5 documents**

## Recommendations

### For Bulk Uploads (50+ documents)
✅ **Use Docker/Localhost**
- Fastest processing
- No memory constraints
- Can handle 1000+ documents

### For Small Uploads (1-10 documents)
✅ **Use Railway**
- Acceptable performance
- Free tier friendly
- Good for production

### For Single Document
✅ **Use Any Environment**
- All environments handle single documents well
- Vercel is fine for 1-2 documents

## Troubleshooting

### OOM on Railway
```bash
# Current settings
BULK_UPLOAD_BATCH_SIZE=3
EMBEDDING_BATCH_SIZE=1

# If still OOM, reduce to:
BULK_UPLOAD_BATCH_SIZE=1
EMBEDDING_BATCH_SIZE=1
```

### OOM on Vercel
```bash
# Vercel should only run frontend
# Backend should be on Railway
# If you must run backend on Vercel:
BULK_UPLOAD_BATCH_SIZE=1
EMBEDDING_BATCH_SIZE=1
```

### Slow Performance on Docker
```bash
# Increase batch sizes (if you have enough RAM)
BULK_UPLOAD_BATCH_SIZE=100
EMBEDDING_BATCH_SIZE=30

# Or optimize CPU threads
OMP_NUM_THREADS=16
TORCH_NUM_THREADS=16
```

## Environment Variables Priority

1. **Explicit Environment Variable** (highest priority)
   ```bash
   BULK_UPLOAD_BATCH_SIZE=10
   ```

2. **Environment Detection** (automatic)
   ```python
   if is_memory_constrained:
       return 3  # Railway/Vercel
   return 60  # Docker
   ```

3. **Default Values** (fallback)
   ```python
   int(os.getenv("BULK_UPLOAD_BATCH_SIZE", "60"))
   ```

## Testing Batch Sizes

### Test on Docker
```bash
# Should see in logs:
# 🚀 HIGH PERFORMANCE MODE (Docker/Localhost)
# 🔧 Bulk Upload Batch Size: 60 (parallel fetch)
# 🧠 Embedding Batch Size: 15 (parallel embedding)
```

### Test on Railway
```bash
# Should see in logs:
# ⚠️ MEMORY CONSTRAINED MODE ACTIVE (Railway/Vercel)
# 🔧 Using optimized settings for limited memory:
#    - Bulk Upload Batch: 3 files (vs 60 on Docker)
#    - Embedding Batch: 1 files (vs 15 on Docker)
```

## Summary

- **Docker**: Fast & powerful (60/15 batches)
- **Railway**: Moderate & free (3/1 batches)
- **Vercel**: Slow & limited (1/1 batches)

**Best Practice**: Use Docker for bulk operations, Railway for production API.
