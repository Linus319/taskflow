# Builder stage: install dependencies
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Final stage: minimal runtime
FROM gcr.io/distroless/python3.11
WORKDIR /app

# Copy installed dependencies
COPY --from=builder /install /usr/local

# Copy app code
COPY . .

EXPOSE 8000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
