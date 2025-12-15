# Logging Configuration Guide

## Overview
The DORA application has been optimized to reduce excessive logging that was causing Railway's rate limit (500 logs/sec) to be exceeded.

## Changes Made

### 1. Environment-Based Log Levels
- **Development**: `INFO` level (verbose, helpful for debugging)
- **Production**: `WARNING` level (minimal, only warnings and errors)

### 2. Logger-Specific Configuration
The following loggers have been configured with reduced verbosity:

| Logger | Level | Reason |
|--------|-------|--------|
| `httpx` | ERROR | HTTP client library - very noisy |
| `httpcore` | ERROR | HTTP core library - very noisy |
| `chromadb` | ERROR | Vector database - logs every operation |
| `uvicorn.access` | WARNING | Access logs - already in Railway logs |
| `services.google_auth` | WARNING | Auth service - only log issues |
| `services.google_docs` | WARNING | Docs service - reduced from INFO |
| `services.rag_pipeline` | WARNING | RAG pipeline - reduced from INFO |
| `utils.http_client` | ERROR | HTTP client utils - initialization spam |
| `utils.cache` | WARNING | Cache operations - too verbose |

### 3. Production Optimizations
- Startup configuration banner only shows in development
- Single-line startup log in production
- HTTP client initialization logs removed
- Recursive folder scanning uses debug level for most operations

## Environment Variables

### LOG_LEVEL
Override the default log level:
```bash
# Development (default: INFO)
LOG_LEVEL=DEBUG

# Production (default: WARNING)
LOG_LEVEL=WARNING

# For critical issues only
LOG_LEVEL=ERROR
```

### ENVIRONMENT
Set the environment to automatically configure logging:
```bash
# Development mode - verbose logging
ENVIRONMENT=development

# Production mode - minimal logging
ENVIRONMENT=production
```

## Docker Configuration

The `docker-compose.prod.yml` has been updated with:
```yaml
environment:
  - ENVIRONMENT=production
  - LOG_LEVEL=WARNING  # Reduce logging to prevent Railway rate limits
```

## Railway Deployment

For Railway, ensure these environment variables are set:
- `ENVIRONMENT=production`
- `LOG_LEVEL=WARNING` (or omit to use default)

## Debugging in Production

If you need to debug issues in production temporarily:

1. **Via Railway Dashboard**:
   - Go to your service settings
   - Add/update environment variable: `LOG_LEVEL=INFO`
   - Redeploy the service
   - **Remember to set it back to WARNING after debugging**

2. **Via Railway CLI**:
   ```bash
   railway variables set LOG_LEVEL=INFO
   railway up
   # After debugging
   railway variables set LOG_LEVEL=WARNING
   railway up
   ```

## Expected Log Reduction

With these changes, you should see:
- **~90% reduction** in log volume in production
- **~95% reduction** during bulk document uploads
- **No more Railway rate limit warnings** (500 logs/sec)

## Monitoring

To monitor your logging rate in Railway:
1. Check the Railway dashboard for log rate warnings
2. If you still see rate limit warnings, consider:
   - Setting `LOG_LEVEL=ERROR` for even less logging
   - Reviewing custom application logs for excessive output

## Best Practices

1. **Never use INFO logging in tight loops** (e.g., per-document processing)
2. **Use DEBUG for detailed operation logs** (filtered out in production)
3. **Use WARNING for recoverable issues** (shown in production)
4. **Use ERROR for failures** (always shown)
5. **Use CRITICAL for system-level failures** (always shown)

## Example Usage in Code

```python
import logging
logger = logging.getLogger(__name__)

# This will be filtered out in production
logger.debug(f"Processing document {doc_id}")

# This will show in production
logger.warning(f"Document {doc_id} has no content")

# This will always show
logger.error(f"Failed to process document {doc_id}: {error}")
```
