FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (docker + weasyprint libs)
RUN apt-get update && apt-get install -y \
    docker.io \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    libcairo2 \
    libglib2.0-0 \
    libgobject-2.0-0 \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Strix — PINNED to 1.1.0 for the headless-CLI adapter (this branch runs the rebuild).
# The adapter shells out to `strix -n` and parses run.json/vulnerabilities.json (validated
# against the 1.0.4 + 1.1.0 wheels and a live scan). Activating it REQUIRES: STRIX_USE_CLI=true
# and STRIX_LLM set, AND the runtime being able to pull the ~11GB strix-sandbox:1.0.0 image.
# See docs/STRIX_CUTOVER.md for the deploy + rollback runbook.
RUN pip install "strix-agent==1.1.0"

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
