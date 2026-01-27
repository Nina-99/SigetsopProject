# Use Python 3.10 slim as base image
FROM python:3.10-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBIAN_FRONTEND noninteractive

# Set working directory
WORKDIR /app

# Install system dependencies for OCR and Image processing
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
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --default-timeout=100 --upgrade pip && \
    pip install --no-cache-dir --default-timeout=100 "numpy>=1.24.4,<2.0.0" "setuptools<70.0.0" "opencv-python-headless<4.7" && \
    pip install --no-cache-dir --default-timeout=100 -r requirements.txt

# Copy project files
COPY . /app/

# Create necessary directories
RUN mkdir -p /app/media /app/static /app/temp_uploads

# Expose port 8000
EXPOSE 8000

# Entrypoint for running migrations and starting Daphne
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "server.asgi:application"]
