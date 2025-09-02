# Build stage
FROM python:3.11-slim AS builder

# Set environment variables
ENV VENV=/opt/venv
ENV PATH="$VENV/bin:$PATH"

# Install dependencies
RUN python -m venv $VENV
COPY requirements.txt .
RUN $VENV/bin/pip install --upgrade pip && \
    $VENV/bin/pip install --no-cache-dir -r requirements.txt

# Final stage
FROM gcr.io/distroless/python3

# Set environment variables
ENV VENV=/opt/venv
ENV PATH="$VENV/bin:$PATH"

# Copy application and virtual environment
WORKDIR /app
COPY --from=builder $VENV $VENV
COPY . .

# Expose port and set entrypoint
EXPOSE 5000
ENTRYPOINT ["python3", "app.py"]
