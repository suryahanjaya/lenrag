# 🚨 Railway Logging Rate Limit - Quick Fix

## Problem
```
Railway rate limit of 500 logs/sec reached for replica
Messages dropped: 94
```

## ✅ Solution Applied

### Changes Made:
1. ✅ Set production log level to WARNING (was INFO)
2. ✅ Suppressed noisy loggers (httpx, chromadb, etc.)
3. ✅ Removed verbose HTTP client logs
4. ✅ Conditional startup banner (dev only)
5. ✅ Updated docker-compose.prod.yml

### Expected Result:
- **90% reduction** in log volume
- **No more rate limit warnings**
- Logs/sec: 500+ → <50

## 🚀 Deploy to Railway

### Option 1: Environment Variables (Recommended)
Set in Railway dashboard:
```
ENVIRONMENT=production
LOG_LEVEL=WARNING
```

### Option 2: Use Updated docker-compose.prod.yml
The file already includes `LOG_LEVEL=WARNING`

## 📊 Verify Fix

After deployment, check Railway logs for:
- ✅ Single startup line: "DORA Backend Started..."
- ✅ Only WARNING/ERROR messages
- ✅ No rate limit warnings
- ❌ No INFO-level spam

## 🐛 Debug Mode (Temporary)

If you need verbose logs:
```bash
# In Railway dashboard, set:
LOG_LEVEL=INFO

# Or via CLI:
railway variables set LOG_LEVEL=INFO
railway up

# REMEMBER TO SET BACK TO WARNING!
```

## 📝 Log Levels

| Level | When to Use | Shows in Production? |
|-------|-------------|---------------------|
| DEBUG | Development only | ❌ No |
| INFO | Development only | ❌ No (with our fix) |
| WARNING | Recoverable issues | ✅ Yes |
| ERROR | Failures | ✅ Yes |
| CRITICAL | System failures | ✅ Yes |

## 📚 More Info

- Full guide: `LOGGING.md`
- Summary: `RAILWAY_LOGGING_FIX.md`
- Example config: `backend/.env.example`

## ⚡ One-Liner Summary

**Set `LOG_LEVEL=WARNING` in Railway to reduce logs by 90% and fix rate limit issues.**
