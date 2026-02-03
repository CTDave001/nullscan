# Security Scanner SaaS

Automated black-box security testing for web applications.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
uvicorn app.main:app --reload
```

### Worker

```bash
cd backend
venv\Scripts\activate
python -m app.worker
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Requirements

- Python 3.11+
- Node.js 18+
- Docker (for Strix)
- Strix CLI installed (`pipx install strix-agent`)

## Environment Variables

See `.env.example` files in backend and frontend directories.

## Architecture

- **Backend:** FastAPI + SQLite
- **Frontend:** Next.js + Tailwind + shadcn/ui
- **Scanner:** Strix (AI-powered penetration testing)
- **Email:** Resend
- **Payments:** Stripe
