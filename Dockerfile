# ReliefLink FastAPI backend — root build-context Dockerfile
# Works on Koyeb / Render / Fly / any host that builds from the repo root.
# Build context = repository root, so COPY paths are prefixed with relieflink/backend.
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Install dependencies first for layer caching
COPY relieflink/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY relieflink/backend/app ./app

# Koyeb/Render/Fly inject $PORT; default to 8000 otherwise.
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
