# Railway Backend Dockerfile - Production Optimized
FROM python:3.11-slim

WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements and install Python dependencies
COPY backend/requirements.txt requirements.txt

# Install PyTorch CPU-only FIRST to avoid 900MB GPU version
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --timeout 300 --retries 10 \
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install other dependencies
RUN pip install --no-cache-dir --timeout 300 --retries 10 -r requirements.txt

# Set environment variables for MAXIMUM PERFORMANCE
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    OMP_NUM_THREADS=16 \
    MKL_NUM_THREADS=16 \
    OPENBLAS_NUM_THREADS=16 \
    NUMEXPR_NUM_THREADS=16 \
    TORCH_NUM_THREADS=16 \
    TF_CPP_MIN_LOG_LEVEL=2 \
    BULK_UPLOAD_BATCH_SIZE=60 \
    EMBEDDING_BATCH_SIZE=15 \
    PORT=8000

# Create necessary directories
RUN mkdir -p /app/chroma_db /app/cache

# Copy backend code
COPY backend/ .

# Health check - use PORT env var with default fallback
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Expose port (Railway will set $PORT dynamically)
EXPOSE ${PORT:-8000}

# Start command - use PORT env var with default fallback
# Use shell form to allow environment variable substitution
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --log-level info
