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
    EMBEDDING_BATCH_SIZE=15

# Create necessary directories
RUN mkdir -p /app/chroma_db /app/cache

# Copy backend code
COPY backend/ .

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Expose port (Railway will set $PORT)
EXPOSE $PORT

# Start command - Railway uses $PORT environment variable
CMD uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
