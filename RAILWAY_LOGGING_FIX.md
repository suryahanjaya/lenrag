# Railway Logging Rate Limit Fix - Summary

## Problem
Railway was dropping 94 messages due to exceeding the 500 logs/second rate limit. This was caused by:
1. Excessive INFO-level logging in production
2. Verbose logging in recursive folder operations
3. HTTP client initialization logs firing repeatedly
4. Per-document and per-chunk logging during bulk operations

## Solution Implemented

### 1. Environment-Based Logging (main.py)
- **Production**: Defaults to `WARNING` level (only warnings and errors)
- **Development**: Defaults to `INFO` level (verbose for debugging)
- Configurable via `LOG_LEVEL` environment variable

### 2. Aggressive Logger Suppression
Reduced verbosity for noisy loggers:
- `httpx`, `httpcore`: ERROR only
- `chromadb`: ERROR only
- `uvicorn.access`: WARNING only
- All service loggers: WARNING only
- All utility loggers: WARNING/ERROR only

### 3. Production Optimizations
- Startup banner only shows in development
- Single-line startup log in production
- HTTP client initialization logs removed (http_client.py)

### 4. Docker Configuration (docker-compose.prod.yml)
Added environment variable:
```yaml
- LOG_LEVEL=WARNING  # Reduce logging to prevent Railway rate limits
```

## Files Modified

1. **backend/main.py**
   - Environment-based log level configuration
   - Aggressive logger suppression
   - Conditional startup banner

2. **backend/utils/http_client.py**
   - Removed verbose initialization logs
   - Changed to debug-level logging

3. **docker-compose.prod.yml**
   - Added `LOG_LEVEL=WARNING` environment variable

4. **LOGGING.md** (new)
   - Comprehensive logging documentation
   - Debugging guide
   - Best practices

## Expected Results

- **~90% reduction** in log volume
- **~95% reduction** during bulk uploads
- **No more Railway rate limit warnings**
- Logs/second should drop from 500+ to <50

## Deployment Instructions

### For Railway:
1. Ensure environment variables are set:
   ```
   ENVIRONMENT=production
   LOG_LEVEL=WARNING
   ```

2. Redeploy your service:
   ```bash
   railway up
   ```

3. Monitor logs to confirm reduction

### For Docker:
1. Rebuild and restart:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

2. Check logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f backend
   ```

## Temporary Debugging in Production

If you need verbose logs temporarily:

```bash
# Railway
railway variables set LOG_LEVEL=INFO
railway up

# Docker
docker-compose -f docker-compose.prod.yml exec backend sh -c "export LOG_LEVEL=INFO && ..."
```

**Remember to set it back to WARNING after debugging!**

## Monitoring

Check Railway dashboard for:
- Log rate warnings (should disappear)
- Application health (should remain healthy)
- Error logs (should still appear)

## Rollback Plan

If issues occur, you can rollback by:

1. Setting `LOG_LEVEL=INFO` in Railway
2. Or reverting the changes in `main.py` and `http_client.py`

## Additional Notes

- The application will still log all WARNING, ERROR, and CRITICAL messages
- Debug information is available by setting `LOG_LEVEL=DEBUG` when needed
- This change does not affect error reporting or monitoring capabilities
- Health check endpoints remain unchanged

## Related Documentation

- See `LOGGING.md` for detailed logging configuration guide
- See `docker-compose.prod.yml` for production Docker configuration
