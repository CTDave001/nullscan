import asyncio
import json
import subprocess
from datetime import datetime
from app.database import database, scans
from app.strix_runner import run_strix_scan_async, _running_scan_tasks
from app.email_service import send_scan_complete_email, send_scan_failed_email


def cleanup_strix_containers():
    """Remove all strix sandbox Docker containers."""
    try:
        result = subprocess.run(
            ["docker", "ps", "-a", "-q", "--filter", "ancestor=ghcr.io/usestrix/strix-sandbox:0.1.11"],
            capture_output=True, text=True, timeout=10,
        )
        container_ids = result.stdout.strip().split("\n")
        container_ids = [c for c in container_ids if c]
        if container_ids:
            subprocess.run(
                ["docker", "rm", "-f"] + container_ids,
                capture_output=True, timeout=30,
            )
            print(f"[cleanup] Removed {len(container_ids)} strix containers", flush=True)
    except Exception as e:
        print(f"[cleanup] Error: {e}", flush=True)


async def reset_stuck_scans():
    """Mark any scans stuck in 'running' as 'failed' on worker startup."""
    result = await database.fetch_all(
        scans.select().where(scans.c.status == "running")
    )
    for scan in result:
        await database.execute(
            scans.update()
            .where(scans.c.id == scan["id"])
            .values(
                status="failed",
                results_json=json.dumps({"error": "Worker restarted while scan was running"}),
                completed_at=datetime.now(),
            )
        )
    if result:
        print(f"[cleanup] Reset {len(result)} stuck scans to failed", flush=True)


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
        # Run Strix (wrap in task so it can be cancelled)
        scan_task = asyncio.create_task(
            run_strix_scan_async(
                target_url=scan["target_url"],
                scan_type=scan["scan_type"],
                scan_id=scan_id,
            )
        )
        _running_scan_tasks[scan_id] = scan_task

        try:
            results = await scan_task
        except asyncio.CancelledError:
            print(f"[worker] Scan {scan_id} was cancelled", flush=True)
            await database.execute(
                scans.update()
                .where(scans.c.id == scan_id)
                .values(
                    status="failed",
                    results_json=json.dumps({"error": "Scan cancelled by admin"}),
                    completed_at=datetime.now(),
                )
            )
            await send_scan_failed_email(scan["email"], scan_id)
            return
        finally:
            _running_scan_tasks.pop(scan_id, None)

        if "error" in results:
            # Check retry count
            retry_count = scan["retry_count"] or 0
            if retry_count < 1:
                await database.execute(
                    scans.update()
                    .where(scans.c.id == scan_id)
                    .values(
                        status="pending",
                        retry_count=retry_count + 1,
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
    finally:
        cleanup_strix_containers()


async def run_worker():
    """Main worker loop."""
    await database.connect()
    cleanup_strix_containers()
    await reset_stuck_scans()
    print("Worker started. Polling for scans...", flush=True)

    while True:
        try:
            await process_pending_scans()
        except Exception as e:
            print(f"Worker error: {e}")

        await asyncio.sleep(5)  # Poll every 5 seconds


if __name__ == "__main__":
    asyncio.run(run_worker())
