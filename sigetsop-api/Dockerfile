# Use Python 3.10 slim as base image
FROM python:3.10-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Install system dependencies for OCR and Image processing in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    swig \
    libpq-dev \
    libgl1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    tesseract-ocr \
    ffmpeg \
    libssl-dev \
    libzbar0 \
    ccache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies efficiently
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir "numpy>=1.24.4,<2.0.0" "setuptools<70.0.0" "opencv-python-headless<4.7" && \
    pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /app/

# Create necessary directories and set permissions
RUN mkdir -p /app/media /app/static /app/temp_uploads

# Expose port 8000
EXPOSE 8000

# Healthcheck for backend
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.connect(('localhost', 8000))" || exit 1

# Entrypoint for starting Daphne
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "server.asgi:application"]
