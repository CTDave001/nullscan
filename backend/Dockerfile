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

# Install Strix — PINNED. The current integration uses the 0.x Python API
# (strix.agents.StrixAgent, strix.telemetry.tracer.Tracer, agents_graph_actions).
# strix-agent 1.0.0 (2026-05-26) is a breaking rewrite that deletes all of those, so an
# unpinned install silently upgrades and makes every scan fail at import. Do NOT unpin
# until the headless-CLI/SARIF rebuild lands (see docs/plans/2026-07-13-...).
RUN pip install "strix-agent==0.7.0"

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
