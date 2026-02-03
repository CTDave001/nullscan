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
