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
