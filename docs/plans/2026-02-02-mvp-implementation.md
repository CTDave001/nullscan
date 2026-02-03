# Security Scanner SaaS - MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a SaaS that lets founders scan their apps for security issues using Strix, with free quick scans and paid deep analysis.

**Architecture:** FastAPI backend handles scan submission, job queue, and Stripe webhooks. Next.js frontend provides landing page, scan status, and results pages. Background worker polls DB for pending scans and invokes Strix CLI. Email notifications via Resend.

**Tech Stack:** Python/FastAPI, Next.js/Tailwind/shadcn, SQLite, Resend, Stripe, Docker (for Strix)

---

## Task 1: Backend Project Setup

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`

**Step 1: Create backend directory structure**

```bash
mkdir -p backend/app
cd backend
```

**Step 2: Create requirements.txt**

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-dotenv==1.0.0
aiosqlite==0.19.0
databases==0.8.0
httpx==0.26.0
resend==0.7.0
stripe==7.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
```

**Step 3: Create config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./scanner.db"
    resend_api_key: str = ""
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    frontend_url: str = "http://localhost:3000"
    strix_llm_quick: str = "openai/gpt-4o-mini"
    strix_llm_deep: str = "anthropic/claude-sonnet-4-5"
    llm_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
```

**Step 4: Create main.py with health check**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Security Scanner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

**Step 5: Verify it runs**

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Expected: Server starts, `http://localhost:8000/health` returns `{"status": "healthy"}`

**Step 6: Commit**

```bash
git add backend/
git commit -m "feat: initialize FastAPI backend with config"
```

---

## Task 2: Database Schema & Models

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/app/models.py`

**Step 1: Create database.py**

```python
import databases
import sqlalchemy
from app.config import settings

database = databases.Database(settings.database_url)
metadata = sqlalchemy.MetaData()

scans = sqlalchemy.Table(
    "scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.String(36), primary_key=True),
    sqlalchemy.Column("email", sqlalchemy.String(255), nullable=False),
    sqlalchemy.Column("target_url", sqlalchemy.String(2048), nullable=False),
    sqlalchemy.Column("status", sqlalchemy.String(20), default="pending"),
    sqlalchemy.Column("scan_type", sqlalchemy.String(20), default="quick"),
    sqlalchemy.Column("results_json", sqlalchemy.Text, nullable=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, server_default=sqlalchemy.func.now()),
    sqlalchemy.Column("completed_at", sqlalchemy.DateTime, nullable=True),
    sqlalchemy.Column("paid_tier", sqlalchemy.String(20), nullable=True),
    sqlalchemy.Column("stripe_payment_id", sqlalchemy.String(255), nullable=True),
    sqlalchemy.Column("retry_count", sqlalchemy.Integer, default=0),
)

rate_limits = sqlalchemy.Table(
    "rate_limits",
    metadata,
    sqlalchemy.Column("email", sqlalchemy.String(255), primary_key=True),
    sqlalchemy.Column("scan_count", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("month", sqlalchemy.String(7)),  # YYYY-MM
)

engine = sqlalchemy.create_engine(
    settings.database_url.replace("sqlite:///", "sqlite:///"),
    connect_args={"check_same_thread": False}
)
metadata.create_all(engine)
```

**Step 2: Create models.py with Pydantic schemas**

```python
from pydantic import BaseModel, EmailStr, HttpUrl
from datetime import datetime
from typing import Optional


class ScanCreate(BaseModel):
    email: EmailStr
    target_url: HttpUrl
    consent: bool


class ScanResponse(BaseModel):
    id: str
    email: str
    target_url: str
    status: str
    scan_type: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    paid_tier: Optional[str] = None


class ScanResultFinding(BaseModel):
    title: str
    severity: str  # Critical, High, Medium, Low
    endpoint: str
    impact: str
    owasp_category: Optional[str] = None
    reproduction_steps: Optional[str] = None
    poc: Optional[str] = None
    fix_guidance: Optional[str] = None


class ScanResults(BaseModel):
    scan_id: str
    target_url: str
    risk_level: str  # Critical, High, Medium, Low, Clean
    findings: list[ScanResultFinding]
    scan_type: str
    completed_at: datetime
    paid_tier: Optional[str] = None
```

**Step 3: Update main.py to connect database on startup**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import database

app = FastAPI(title="Security Scanner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

**Step 4: Verify database creates**

```bash
uvicorn app.main:app --reload
```

Expected: `scanner.db` file created in backend directory

**Step 5: Commit**

```bash
git add backend/app/database.py backend/app/models.py backend/app/main.py
git commit -m "feat: add database schema and Pydantic models"
```

---

## Task 3: Scan Submission API

**Files:**
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/scans.py`
- Modify: `backend/app/main.py`

**Step 1: Create routers directory**

```bash
mkdir -p backend/app/routers
touch backend/app/routers/__init__.py
```

**Step 2: Create scans.py router**

```python
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.database import database, scans, rate_limits
from app.models import ScanCreate, ScanResponse

router = APIRouter(prefix="/scans", tags=["scans"])

MAX_FREE_SCANS_PER_MONTH = 3


async def check_rate_limit(email: str) -> bool:
    current_month = datetime.now().strftime("%Y-%m")
    query = rate_limits.select().where(rate_limits.c.email == email)
    result = await database.fetch_one(query)

    if result is None:
        await database.execute(
            rate_limits.insert().values(
                email=email, scan_count=0, month=current_month
            )
        )
        return True

    if result["month"] != current_month:
        await database.execute(
            rate_limits.update()
            .where(rate_limits.c.email == email)
            .values(scan_count=0, month=current_month)
        )
        return True

    return result["scan_count"] < MAX_FREE_SCANS_PER_MONTH


async def increment_rate_limit(email: str):
    await database.execute(
        rate_limits.update()
        .where(rate_limits.c.email == email)
        .values(scan_count=rate_limits.c.scan_count + 1)
    )


@router.post("/", response_model=ScanResponse)
async def create_scan(scan: ScanCreate):
    if not scan.consent:
        raise HTTPException(status_code=400, detail="Consent is required")

    if not await check_rate_limit(scan.email):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 3 free scans per month."
        )

    scan_id = str(uuid.uuid4())

    await database.execute(
        scans.insert().values(
            id=scan_id,
            email=scan.email,
            target_url=str(scan.target_url),
            status="pending",
            scan_type="quick",
        )
    )

    await increment_rate_limit(scan.email)

    query = scans.select().where(scans.c.id == scan_id)
    result = await database.fetch_one(query)

    return ScanResponse(**dict(result))


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: str):
    query = scans.select().where(scans.c.id == scan_id)
    result = await database.fetch_one(query)

    if result is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    return ScanResponse(**dict(result))
```

**Step 3: Register router in main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import database
from app.routers import scans

app = FastAPI(title="Security Scanner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scans.router)


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

**Step 4: Test the endpoint**

```bash
uvicorn app.main:app --reload
```

Test with curl or httpie:

```bash
curl -X POST http://localhost:8000/scans/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "target_url": "https://example.com", "consent": true}'
```

Expected: Returns JSON with scan id, status "pending"

**Step 5: Commit**

```bash
git add backend/app/routers/ backend/app/main.py
git commit -m "feat: add scan submission API with rate limiting"
```

---

## Task 4: Background Worker - Strix Integration

**Files:**
- Create: `backend/app/worker.py`
- Create: `backend/app/strix_runner.py`

**Step 1: Create strix_runner.py**

```python
import subprocess
import json
import os
from pathlib import Path
from app.config import settings


def run_strix_scan(target_url: str, scan_type: str = "quick") -> dict:
    """
    Run Strix CLI against target URL.
    Returns parsed results or error dict.
    """
    if scan_type == "quick":
        llm_model = settings.strix_llm_quick
        timeout = 1200  # 20 minutes
        scan_mode = "quick"
    else:
        llm_model = settings.strix_llm_deep
        timeout = 14400  # 4 hours
        scan_mode = "deep"

    env = os.environ.copy()
    env["STRIX_LLM"] = llm_model
    env["LLM_API_KEY"] = settings.llm_api_key

    # Create unique output directory
    import uuid
    run_id = str(uuid.uuid4())[:8]
    output_dir = Path(f"strix_runs/{run_id}")
    output_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        "strix",
        "-n",  # non-interactive
        "--target", target_url,
        "--scan-mode", scan_mode,
    ]

    try:
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(output_dir.parent),
        )

        # Parse Strix output - look for results JSON
        results_file = output_dir / "results.json"
        if results_file.exists():
            with open(results_file) as f:
                return json.load(f)

        # If no results file, parse stdout for findings
        return parse_strix_output(result.stdout, result.stderr)

    except subprocess.TimeoutExpired:
        return {
            "error": "timeout",
            "message": f"Scan exceeded {timeout}s timeout",
            "findings": [],
        }
    except Exception as e:
        return {
            "error": "execution_failed",
            "message": str(e),
            "findings": [],
        }


def parse_strix_output(stdout: str, stderr: str) -> dict:
    """
    Parse Strix CLI output into structured findings.
    This is a placeholder - actual parsing depends on Strix output format.
    """
    # TODO: Implement actual Strix output parsing based on real output format
    # For now, return empty structure
    return {
        "findings": [],
        "raw_output": stdout,
        "error_output": stderr,
    }
```

**Step 2: Create worker.py**

```python
import asyncio
import json
from datetime import datetime
from app.database import database, scans
from app.strix_runner import run_strix_scan
from app.email_service import send_scan_complete_email, send_scan_failed_email


async def process_pending_scans():
    """Poll for pending scans and process them."""
    query = scans.select().where(scans.c.status == "pending")
    pending = await database.fetch_all(query)

    for scan in pending:
        await process_scan(dict(scan))


async def process_scan(scan: dict):
    """Process a single scan."""
    scan_id = scan["id"]

    # Mark as running
    await database.execute(
        scans.update()
        .where(scans.c.id == scan_id)
        .values(status="running")
    )

    try:
        # Run Strix
        results = run_strix_scan(
            target_url=scan["target_url"],
            scan_type=scan["scan_type"],
        )

        if "error" in results:
            # Check retry count
            if scan["retry_count"] < 1:
                await database.execute(
                    scans.update()
                    .where(scans.c.id == scan_id)
                    .values(
                        status="pending",
                        retry_count=scan["retry_count"] + 1,
                    )
                )
                return
            else:
                await database.execute(
                    scans.update()
                    .where(scans.c.id == scan_id)
                    .values(
                        status="failed",
                        results_json=json.dumps(results),
                        completed_at=datetime.now(),
                    )
                )
                await send_scan_failed_email(scan["email"], scan_id)
                return

        # Success - store results
        await database.execute(
            scans.update()
            .where(scans.c.id == scan_id)
            .values(
                status="completed",
                results_json=json.dumps(results),
                completed_at=datetime.now(),
            )
        )

        await send_scan_complete_email(
            email=scan["email"],
            scan_id=scan_id,
            findings_count=len(results.get("findings", [])),
            target_url=scan["target_url"],
        )

    except Exception as e:
        await database.execute(
            scans.update()
            .where(scans.c.id == scan_id)
            .values(
                status="failed",
                results_json=json.dumps({"error": str(e)}),
                completed_at=datetime.now(),
            )
        )
        await send_scan_failed_email(scan["email"], scan_id)


async def run_worker():
    """Main worker loop."""
    await database.connect()
    print("Worker started. Polling for scans...")

    while True:
        try:
            await process_pending_scans()
        except Exception as e:
            print(f"Worker error: {e}")

        await asyncio.sleep(5)  # Poll every 5 seconds


if __name__ == "__main__":
    asyncio.run(run_worker())
```

**Step 3: Commit**

```bash
git add backend/app/worker.py backend/app/strix_runner.py
git commit -m "feat: add background worker with Strix integration"
```

---

## Task 5: Email Service

**Files:**
- Create: `backend/app/email_service.py`

**Step 1: Create email_service.py**

```python
import resend
from app.config import settings

resend.api_key = settings.resend_api_key


async def send_scan_started_email(email: str, scan_id: str, target_url: str):
    """Send email when scan starts."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send scan started email to {email}")
        return

    resend.Emails.send({
        "from": "Security Scanner <noreply@yourdomain.com>",
        "to": email,
        "subject": f"Scanning {target_url}",
        "html": f"""
        <h2>Your security scan has started</h2>
        <p>We're scanning <strong>{target_url}</strong>.</p>
        <p>This usually takes 5-15 minutes. We'll email you when it's ready.</p>
        <p>
            <a href="{settings.frontend_url}/scan/{scan_id}">
                Check scan status
            </a>
        </p>
        """,
    })


async def send_scan_complete_email(
    email: str,
    scan_id: str,
    findings_count: int,
    target_url: str,
):
    """Send email when scan completes."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send scan complete email to {email}")
        return

    if findings_count > 0:
        subject = f"Security scan complete: {findings_count} issues found"
        findings_text = f"We found <strong>{findings_count} potential issues</strong>."
    else:
        subject = "Security scan complete: No obvious issues"
        findings_text = "No obvious issues were detected in the quick scan."

    resend.Emails.send({
        "from": "Security Scanner <noreply@yourdomain.com>",
        "to": email,
        "subject": subject,
        "html": f"""
        <h2>Your security scan is ready</h2>
        <p>Scan complete for <strong>{target_url}</strong>.</p>
        <p>{findings_text}</p>
        <p>
            <a href="{settings.frontend_url}/results/{scan_id}"
               style="background: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                View Results
            </a>
        </p>
        """,
    })


async def send_scan_failed_email(email: str, scan_id: str):
    """Send email when scan fails."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send scan failed email to {email}")
        return

    resend.Emails.send({
        "from": "Security Scanner <noreply@yourdomain.com>",
        "to": email,
        "subject": "Security scan failed",
        "html": f"""
        <h2>Something went wrong</h2>
        <p>We couldn't complete your security scan. This sometimes happens with
           complex applications.</p>
        <p>
            <a href="{settings.frontend_url}">
                Try again
            </a>
        </p>
        """,
    })


async def send_deep_scan_started_email(email: str, scan_id: str, target_url: str):
    """Send email when deep scan starts."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send deep scan started email to {email}")
        return

    resend.Emails.send({
        "from": "Security Scanner <noreply@yourdomain.com>",
        "to": email,
        "subject": f"Deep analysis started for {target_url}",
        "html": f"""
        <h2>Deep analysis in progress</h2>
        <p>We're running a thorough security analysis on <strong>{target_url}</strong>.</p>
        <p>This usually takes 1-4 hours depending on your application's complexity.</p>
        <p>We'll email you when it's ready.</p>
        """,
    })


async def send_payment_received_email(email: str, scan_id: str, tier: str):
    """Send email when payment is received."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send payment received email to {email}")
        return

    resend.Emails.send({
        "from": "Security Scanner <noreply@yourdomain.com>",
        "to": email,
        "subject": "Payment received - Full report unlocked",
        "html": f"""
        <h2>Thank you for your purchase!</h2>
        <p>Your full security report is now available.</p>
        <p>
            <a href="{settings.frontend_url}/results/{scan_id}/full"
               style="background: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                View Full Report
            </a>
        </p>
        """,
    })
```

**Step 2: Update worker.py imports**

The worker already imports from email_service, so no changes needed.

**Step 3: Commit**

```bash
git add backend/app/email_service.py
git commit -m "feat: add email service with Resend"
```

---

## Task 6: Stripe Webhook Handler

**Files:**
- Create: `backend/app/routers/webhooks.py`
- Modify: `backend/app/main.py`

**Step 1: Create webhooks.py**

```python
import json
import stripe
from fastapi import APIRouter, Request, HTTPException
from app.config import settings
from app.database import database, scans
from app.email_service import send_payment_received_email, send_deep_scan_started_email

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

stripe.api_key = settings.stripe_secret_key


@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await handle_successful_payment(session)

    return {"status": "ok"}


async def handle_successful_payment(session: dict):
    """Handle successful Stripe checkout."""
    scan_id = session.get("metadata", {}).get("scan_id")
    tier = session.get("metadata", {}).get("tier")

    if not scan_id or not tier:
        print(f"Missing metadata in session: {session}")
        return

    # Get scan
    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        print(f"Scan not found: {scan_id}")
        return

    # Update scan with payment info
    await database.execute(
        scans.update()
        .where(scans.c.id == scan_id)
        .values(
            paid_tier=tier,
            stripe_payment_id=session["id"],
        )
    )

    # Send confirmation email
    await send_payment_received_email(scan["email"], scan_id, tier)

    # If deep tier, trigger deep scan
    if tier == "deep":
        await database.execute(
            scans.update()
            .where(scans.c.id == scan_id)
            .values(
                scan_type="deep",
                status="pending",
            )
        )
        await send_deep_scan_started_email(
            scan["email"], scan_id, scan["target_url"]
        )
```

**Step 2: Add checkout session creation endpoint to scans.py**

Add to `backend/app/routers/scans.py`:

```python
import stripe
from app.config import settings

stripe.api_key = settings.stripe_secret_key

PRICE_TIERS = {
    "unlock": 14900,  # $149.00 in cents
    "deep": 39900,    # $399.00 in cents
}


@router.post("/{scan_id}/checkout")
async def create_checkout(scan_id: str, tier: str):
    if tier not in PRICE_TIERS:
        raise HTTPException(status_code=400, detail="Invalid tier")

    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if scan["paid_tier"]:
        raise HTTPException(status_code=400, detail="Already paid")

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {
                    "name": f"Security Report - {tier.title()}",
                    "description": f"Full security report for {scan['target_url']}",
                },
                "unit_amount": PRICE_TIERS[tier],
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"{settings.frontend_url}/results/{scan_id}/full?success=true",
        cancel_url=f"{settings.frontend_url}/results/{scan_id}?cancelled=true",
        metadata={
            "scan_id": scan_id,
            "tier": tier,
        },
        customer_email=scan["email"],
    )

    return {"checkout_url": session.url}
```

**Step 3: Register webhook router in main.py**

```python
from app.routers import scans, webhooks

# ... existing code ...

app.include_router(scans.router)
app.include_router(webhooks.router)
```

**Step 4: Commit**

```bash
git add backend/app/routers/webhooks.py backend/app/routers/scans.py backend/app/main.py
git commit -m "feat: add Stripe checkout and webhook handling"
```

---

## Task 7: Results API Endpoint

**Files:**
- Modify: `backend/app/routers/scans.py`

**Step 1: Add results endpoint to scans.py**

```python
from app.models import ScanResults, ScanResultFinding


def calculate_risk_level(findings: list) -> str:
    """Calculate overall risk level from findings."""
    if not findings:
        return "Clean"

    severities = [f.get("severity", "Low") for f in findings]

    if "Critical" in severities:
        return "Critical"
    if "High" in severities:
        return "High"
    if "Medium" in severities:
        return "Medium"
    return "Low"


def filter_findings_for_tier(findings: list, paid_tier: str | None) -> list:
    """Filter finding details based on paid tier."""
    filtered = []

    for f in findings:
        finding = {
            "title": f.get("title", "Unknown Issue"),
            "severity": f.get("severity", "Medium"),
            "endpoint": f.get("endpoint", "N/A"),
            "impact": f.get("impact", "Potential security issue"),
            "owasp_category": f.get("owasp_category") if paid_tier else None,
        }

        # Only include details if paid
        if paid_tier in ("unlock", "deep"):
            finding["reproduction_steps"] = f.get("reproduction_steps")
            finding["poc"] = f.get("poc")
            finding["fix_guidance"] = f.get("fix_guidance")

        filtered.append(ScanResultFinding(**finding))

    return filtered


@router.get("/{scan_id}/results", response_model=ScanResults)
async def get_scan_results(scan_id: str):
    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if scan["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Scan not completed. Status: {scan['status']}"
        )

    results = json.loads(scan["results_json"]) if scan["results_json"] else {}
    findings = results.get("findings", [])

    return ScanResults(
        scan_id=scan_id,
        target_url=scan["target_url"],
        risk_level=calculate_risk_level(findings),
        findings=filter_findings_for_tier(findings, scan["paid_tier"]),
        scan_type=scan["scan_type"],
        completed_at=scan["completed_at"],
        paid_tier=scan["paid_tier"],
    )
```

**Step 2: Add json import at top of scans.py**

```python
import json
```

**Step 3: Commit**

```bash
git add backend/app/routers/scans.py
git commit -m "feat: add results API with tier-based filtering"
```

---

## Task 8: Frontend Project Setup

**Files:**
- Create: `frontend/` (Next.js project)

**Step 1: Create Next.js project**

```bash
cd C:\Users\David\Desktop\autobbpentester
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Select options:
- Would you like to use Turbopack? No
- Would you like to customize the import alias? No

**Step 2: Install shadcn/ui**

```bash
cd frontend
npx shadcn@latest init
```

Select options:
- Style: Default
- Base color: Slate
- CSS variables: Yes

**Step 3: Add shadcn components**

```bash
npx shadcn@latest add button card input label checkbox badge
```

**Step 4: Create environment file**

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Step 5: Verify it runs**

```bash
npm run dev
```

Expected: Next.js starts on http://localhost:3000

**Step 6: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: initialize Next.js frontend with shadcn/ui"
```

---

## Task 9: Landing Page

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/components/scan-form.tsx`

**Step 1: Create scan-form.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function ScanForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          target_url: targetUrl,
          consent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to start scan");
      }

      const data = await res.json();
      router.push(`/scan/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="url">Your app URL</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://yourapp.com"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email for results</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
          required
        />
        <Label htmlFor="consent" className="text-sm text-muted-foreground">
          I confirm I own this application or have explicit written permission
          to perform security testing on it.
        </Label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading || !consent}>
        {loading ? "Starting scan..." : "Scan your app free"}
      </Button>
    </form>
  );
}
```

**Step 2: Update page.tsx**

```tsx
import { ScanForm } from "@/components/scan-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-4">
          See what attackers see
          <br />
          <span className="text-blue-600">before they do</span>
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Automated external security scan for your app. Results in minutes, not
          weeks.
        </p>

        <div className="flex justify-center">
          <ScanForm />
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Submit your URL</h3>
            <p className="text-slate-600">
              Enter your app URL and email. We only test public endpoints.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">We scan</h3>
            <p className="text-slate-600">
              Our AI-powered scanner checks for common vulnerabilities.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Get results</h3>
            <p className="text-slate-600">
              Receive a report with findings and fix guidance.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16 bg-slate-50">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-2">Free Scan</h3>
            <p className="text-3xl font-bold mb-4">$0</p>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>Quick external scan</li>
              <li>Finding titles and severity</li>
              <li>Affected endpoints</li>
              <li className="text-slate-400">Details locked</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg border border-blue-200 ring-2 ring-blue-100">
            <h3 className="font-semibold text-lg mb-2">Unlock Report</h3>
            <p className="text-3xl font-bold mb-4">$149</p>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>Everything in Free</li>
              <li>Reproduction steps</li>
              <li>Proof-of-concept code</li>
              <li>Fix guidance</li>
              <li>PDF export</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-2">Deep Analysis</h3>
            <p className="text-3xl font-bold mb-4">$399</p>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>Everything in Unlock</li>
              <li>1-4 hour deep scan</li>
              <li>Executive summary</li>
              <li>Security certificate</li>
              <li>One free rescan</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-slate-500 text-sm">
        <div className="space-x-4">
          <a href="/scope" className="hover:text-slate-700">
            What we test
          </a>
          <a href="/terms" className="hover:text-slate-700">
            Terms
          </a>
          <a href="/privacy" className="hover:text-slate-700">
            Privacy
          </a>
        </div>
      </footer>
    </main>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/src/
git commit -m "feat: add landing page with scan form"
```

---

## Task 10: Scan Status Page

**Files:**
- Create: `frontend/src/app/scan/[id]/page.tsx`

**Step 1: Create scan status page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

interface Scan {
  id: string;
  status: string;
  target_url: string;
  created_at: string;
}

export default function ScanStatusPage() {
  const params = useParams();
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/scans/${params.id}`
        );
        if (!res.ok) throw new Error("Scan not found");
        const data = await res.json();
        setScan(data);

        if (data.status === "completed") {
          router.push(`/results/${params.id}`);
        } else if (data.status === "failed") {
          setError("Scan failed. Please try again.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    };

    fetchScan();
    const interval = setInterval(fetchScan, 5000);
    return () => clearInterval(interval);
  }, [params.id, router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600">{error}</p>
          <a href="/" className="text-blue-600 hover:underline mt-4 block">
            Try again
          </a>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Scanning your app</h1>
        {scan && (
          <p className="text-slate-600 mb-4">
            Target: <span className="font-mono text-sm">{scan.target_url}</span>
          </p>
        )}
        <p className="text-slate-500 text-sm">
          This usually takes 5-15 minutes. We&apos;ll email you when it&apos;s
          ready.
        </p>
        <p className="text-slate-400 text-xs mt-4">
          You can close this page. We&apos;ll send results to your email.
        </p>
      </Card>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/scan/
git commit -m "feat: add scan status page with polling"
```

---

## Task 11: Results Page

**Files:**
- Create: `frontend/src/app/results/[id]/page.tsx`

**Step 1: Create results page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Finding {
  title: string;
  severity: string;
  endpoint: string;
  impact: string;
  reproduction_steps?: string;
  poc?: string;
  fix_guidance?: string;
}

interface ScanResults {
  scan_id: string;
  target_url: string;
  risk_level: string;
  findings: Finding[];
  scan_type: string;
  paid_tier: string | null;
}

const severityColors: Record<string, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-yellow-500",
  Low: "bg-blue-500",
};

const riskColors: Record<string, string> = {
  Critical: "text-red-600 bg-red-50 border-red-200",
  High: "text-orange-600 bg-orange-50 border-orange-200",
  Medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  Low: "text-blue-600 bg-blue-50 border-blue-200",
  Clean: "text-green-600 bg-green-50 border-green-200",
};

export default function ResultsPage() {
  const params = useParams();
  const [results, setResults] = useState<ScanResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/scans/${params.id}/results`
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Failed to load results");
        }
        const data = await res.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [params.id]);

  const handleCheckout = async (tier: "unlock" | "deep") => {
    setCheckoutLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scans/${params.id}/checkout?tier=${tier}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to create checkout");
      const data = await res.json();
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600">{error}</p>
        </Card>
      </main>
    );
  }

  if (!results) return null;

  const isPaid = results.paid_tier !== null;
  const showUnlockTier = results.findings.length > 0 && !isPaid;
  const showDeepTier = !isPaid || results.paid_tier === "unlock";

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Card className={`p-6 mb-6 border-2 ${riskColors[results.risk_level]}`}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-semibold mb-1">
                Scan complete for{" "}
                <span className="font-mono">{results.target_url}</span>
              </h1>
              <p className="text-slate-600">
                {results.findings.length} issue
                {results.findings.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <Badge
              className={`${severityColors[results.risk_level] || "bg-green-500"} text-white`}
            >
              {results.risk_level}
            </Badge>
          </div>
        </Card>

        {/* Findings */}
        {results.findings.length === 0 ? (
          <Card className="p-6 text-center">
            <h2 className="text-lg font-semibold text-green-600 mb-2">
              No obvious issues detected
            </h2>
            <p className="text-slate-600 mb-4">
              The quick scan didn&apos;t find any obvious vulnerabilities. Want
              to go deeper?
            </p>
          </Card>
        ) : (
          <div className="space-y-4 mb-6">
            {results.findings.map((finding, i) => (
              <Card key={i} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{finding.title}</h3>
                  <Badge
                    className={`${severityColors[finding.severity]} text-white`}
                  >
                    {finding.severity}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  <span className="font-medium">Endpoint:</span>{" "}
                  <code className="bg-slate-100 px-1 rounded">
                    {finding.endpoint}
                  </code>
                </p>
                <p className="text-sm text-slate-600">{finding.impact}</p>

                {isPaid && finding.reproduction_steps && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">
                      Reproduction Steps
                    </h4>
                    <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto">
                      {finding.reproduction_steps}
                    </pre>
                  </div>
                )}

                {isPaid && finding.fix_guidance && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Fix Guidance</h4>
                    <p className="text-sm text-slate-600">
                      {finding.fix_guidance}
                    </p>
                  </div>
                )}

                {!isPaid && (
                  <div className="mt-4 pt-4 border-t border-dashed">
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <span>🔒</span> Reproduction steps, PoC, and fix guidance
                      locked
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* CTAs */}
        {(!isPaid || results.paid_tier === "unlock") && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-center">
              {isPaid ? "Go deeper" : "Unlock full report"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {showUnlockTier && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Unlock Report</h3>
                  <p className="text-2xl font-bold mb-2">$149</p>
                  <ul className="text-sm text-slate-600 mb-4 space-y-1">
                    <li>Full reproduction steps</li>
                    <li>Proof-of-concept code</li>
                    <li>Fix guidance</li>
                    <li>PDF export</li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout("unlock")}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? "Loading..." : "Unlock for $149"}
                  </Button>
                </div>
              )}
              {showDeepTier && (
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold mb-2">Deep Analysis</h3>
                  <p className="text-2xl font-bold mb-2">$399</p>
                  <ul className="text-sm text-slate-600 mb-4 space-y-1">
                    <li>Everything in Unlock</li>
                    <li>1-4 hour thorough scan</li>
                    <li>Executive summary</li>
                    <li>Security certificate</li>
                    <li>One free rescan</li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout("deep")}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? "Loading..." : "Get deep analysis $399"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/results/
git commit -m "feat: add results page with paywall"
```

---

## Task 12: Static Pages (Scope, Terms, Privacy)

**Files:**
- Create: `frontend/src/app/scope/page.tsx`
- Create: `frontend/src/app/terms/page.tsx`
- Create: `frontend/src/app/privacy/page.tsx`

**Step 1: Create scope page**

```tsx
export default function ScopePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">What We Test</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            What we DO
          </h2>
          <ul className="space-y-2 text-slate-600">
            <li>Scan publicly accessible URLs and endpoints</li>
            <li>
              Test for common vulnerabilities (authentication, injection, SSRF,
              etc.)
            </li>
            <li>Attempt proof-of-concept validation (non-destructive)</li>
            <li>Provide fix guidance for issues found</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-red-600">
            What we DON&apos;T do
          </h2>
          <ul className="space-y-2 text-slate-600">
            <li>Access anything behind authentication</li>
            <li>Perform denial-of-service attacks</li>
            <li>Brute force credentials</li>
            <li>Exfiltrate or store your application&apos;s data</li>
            <li>Social engineering</li>
            <li>Test infrastructure (servers, DNS, etc.)</li>
          </ul>
        </section>

        <p className="text-slate-500 text-sm">
          Our scans are non-destructive and designed to identify vulnerabilities
          without causing harm to your application or its users.
        </p>
      </div>
    </main>
  );
}
```

**Step 2: Create terms page**

```tsx
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-slate">
          <h2>Authorization</h2>
          <p>
            By using this service, you confirm that you own the application
            being tested or have explicit written permission from the owner to
            perform security testing.
          </p>

          <h2>Liability</h2>
          <p>
            We are not liable for how you use the findings from our scans. You
            are responsible for using this information ethically and legally.
          </p>

          <h2>No Guarantees</h2>
          <p>
            We do not guarantee that our scans will find all vulnerabilities.
            Our service is designed to identify common security issues but
            should not be considered a replacement for comprehensive security
            audits.
          </p>

          <h2>Refund Policy</h2>
          <p>
            No refunds are provided if no vulnerabilities are found. You are
            paying for a security assessment, not for finding bugs.
          </p>

          <h2>Service Refusal</h2>
          <p>We reserve the right to refuse service at our discretion.</p>
        </div>
      </div>
    </main>
  );
}
```

**Step 3: Create privacy page**

```tsx
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-slate">
          <h2>What we collect</h2>
          <ul>
            <li>Email address (to send results)</li>
            <li>Target URL (to perform the scan)</li>
            <li>Scan results (findings from the security assessment)</li>
          </ul>

          <h2>What we don&apos;t collect</h2>
          <ul>
            <li>Your users&apos; data</li>
            <li>Passwords or credentials</li>
            <li>Sensitive application data</li>
          </ul>

          <h2>Data retention</h2>
          <ul>
            <li>Free scan results: 30 days</li>
            <li>Paid scan results: indefinitely</li>
          </ul>

          <h2>Data sharing</h2>
          <p>
            We do not sell or share your data with third parties. Scan results
            are only accessible via unique, unguessable links.
          </p>
        </div>
      </div>
    </main>
  );
}
```

**Step 4: Commit**

```bash
git add frontend/src/app/scope/ frontend/src/app/terms/ frontend/src/app/privacy/
git commit -m "feat: add scope, terms, and privacy pages"
```

---

## Task 13: Environment Setup & Documentation

**Files:**
- Create: `backend/.env.example`
- Create: `frontend/.env.example`
- Create: `README.md`

**Step 1: Create backend/.env.example**

```
DATABASE_URL=sqlite:///./scanner.db
RESEND_API_KEY=re_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
FRONTEND_URL=http://localhost:3000
STRIX_LLM_QUICK=openai/gpt-4o-mini
STRIX_LLM_DEEP=anthropic/claude-sonnet-4-5
LLM_API_KEY=sk-xxxxx
```

**Step 2: Create frontend/.env.example**

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Step 3: Create README.md**

```markdown
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
```

**Step 4: Commit**

```bash
git add backend/.env.example frontend/.env.example README.md
git commit -m "docs: add environment examples and README"
```

---

## Task 14: Deployment Configuration

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/railway.toml`
- Create: `frontend/vercel.json`

**Step 1: Create backend/Dockerfile**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Strix
RUN pip install strix-agent

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 2: Create backend/railway.toml**

```toml
[build]
builder = "dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

**Step 3: Create frontend/vercel.json**

```json
{
  "framework": "nextjs"
}
```

**Step 4: Commit**

```bash
git add backend/Dockerfile backend/railway.toml frontend/vercel.json
git commit -m "chore: add deployment configuration"
```

---

## Summary

This implementation plan covers:

1. **Backend (Tasks 1-7):** FastAPI setup, database, scan API, worker, email, Stripe, results
2. **Frontend (Tasks 8-12):** Next.js setup, landing page, scan status, results page, static pages
3. **DevOps (Tasks 13-14):** Environment config, documentation, deployment

**Estimated time:** 10-14 days with focused execution

**Key dependencies:**
- Strix CLI must be installed and working
- API keys needed: OpenAI/Anthropic, Resend, Stripe
- Docker required for Strix sandbox

---

Plan complete and saved to `docs/plans/2026-02-02-mvp-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?