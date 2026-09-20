# DocAssist backend — FastAPI + Uvicorn (CPU). PyTorch / embedding stack is heavy; expect multi‑GB pulls.
#
# OCR: installs Tesseract runtime for pytesseract.
# Build: docker build -t docassist-backend .

FROM python:3.11-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# CPU-only torch first, so Docling's torch dependency doesn't pull the NVIDIA/CUDA packages.
RUN pip install --upgrade pip \
    && pip install torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install -r requirements.txt

COPY src ./src

RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
