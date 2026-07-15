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

# Install Strix — PINNED to 1.1.0 for the headless-CLI adapter (CUTOVER: strix_use_cli=True).
# The adapter shells out to `strix -n` and parses run.json/vulnerabilities.json. Pin + flag
# change together so there's no broken window. Rollback = `git revert` this commit (returns to
# 0.7.0 + strix_use_cli=False). Requires the runtime to pull the ~11GB strix-sandbox:1.0.0
# image on first scan. See docs/STRIX_CUTOVER.md.
RUN pip install "strix-agent==1.1.0"

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
