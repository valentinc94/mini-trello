FROM python:3.13-slim AS builder

WORKDIR /app/backend

COPY requirements/ requirements/
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements/base.txt -r requirements/local.txt

FROM python:3.13-slim

WORKDIR /app/backend

# Install required system dependencies for psycopg and other runtime needs
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/backend/requirements requirements/
RUN pip install --no-cache /wheels/*

COPY . /app/backend

# Ensure Python can find the 'backend' module since we are inside /app/backend
ENV PYTHONPATH=/app

EXPOSE 8000
