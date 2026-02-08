"""
Reprocess a scan's results from raw Strix output files.
Run on Hetzner: python reprocess_scan.py <scan_id>

This re-parses the strix_runs directory, re-generates the structured report,
and updates the database with the corrected results.
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# Add parent dir so app imports work
sys.path.insert(0, os.path.dirname(__file__))

from app.database import database, scans
from app.strix_runner import parse_strix_run_dir, normalize_severity, _is_real_finding
from app.report_processor import process_scan_report


async def reprocess(scan_id: str):
    await database.connect()

    # Fetch the scan
    scan = await database.fetch_one(scans.select().where(scans.c.id == scan_id))
    if not scan:
        print(f"ERROR: Scan {scan_id} not found in database")
        return

    print(f"Scan: {scan_id}")
    print(f"Target: {scan['target_url']}")
    print(f"Status: {scan['status']}")
    print(f"Type: {scan['scan_type']}")
    print(f"Paid: {scan['paid_tier']}")
    print()

    # Show current results
    current = json.loads(scan["results_json"]) if scan["results_json"] else {}
    current_findings = current.get("findings", [])
    print(f"Current findings in DB: {len(current_findings)}")
    for f in current_findings:
        print(f"  - {f.get('title', '?')} [{f.get('severity', '?')}]")
    print()

    # Show progress data (findings_so_far)
    if scan["progress_json"]:
        progress = json.loads(scan["progress_json"])
        findings_so_far = progress.get("findings_so_far", [])
        print(f"Findings in progress data: {len(findings_so_far)}")
        for f in findings_so_far:
            print(f"  - {f.get('title', '?')} [{f.get('severity', '?')}]")
        print()

    # Find the strix_runs directory
    run_dirs = sorted(Path("strix_runs").glob("*"), key=lambda p: p.stat().st_mtime, reverse=True)
    print(f"Found {len(run_dirs)} run directories:")
    for d in run_dirs[:10]:
        print(f"  {d.name}")
    print()

    if not run_dirs:
        print("ERROR: No strix_runs directories found")
        return

    # Try to find the matching run dir - ask user to pick
    print("Which directory matches this scan? Enter the name (or number from list):")
    for i, d in enumerate(run_dirs[:10]):
        # Check for report file
        has_report = (d / "penetration_test_report.md").exists()
        has_vulns = (d / "vulnerabilities").exists()
        vuln_count = len(list((d / "vulnerabilities").glob("*.md"))) if has_vulns else 0
        print(f"  [{i}] {d.name}  {'[REPORT]' if has_report else ''}  [vulns: {vuln_count}]")

    choice = input("\n> ").strip()
    if choice.isdigit():
        idx = int(choice)
        if idx < len(run_dirs):
            run_dir = run_dirs[idx]
        else:
            print("Invalid choice")
            return
    else:
        run_dir = Path("strix_runs") / choice
        if not run_dir.exists():
            print(f"Directory not found: {run_dir}")
            return

    run_name = run_dir.name
    print(f"\nUsing: {run_dir}")

    # Parse findings from files
    findings = parse_strix_run_dir(run_name)
    print(f"\nFile-based findings: {len(findings)}")
    for f in findings:
        print(f"  - {f.get('title', '?')} [{f.get('severity', '?')}]")

    # Filter
    pre_filter = len(findings)
    findings = [f for f in findings if _is_real_finding(f)]
    print(f"After filter: {len(findings)} (removed {pre_filter - len(findings)})")

    # Check markdown report
    report_path = run_dir / "penetration_test_report.md"
    structured_report = None
    if report_path.exists():
        md = report_path.read_text(encoding="utf-8")
        print(f"\nMarkdown report: {len(md)} chars")
        print(f"First 500 chars:\n{md[:500]}\n...")

        reprocess_report = input("\nReprocess structured report with GPT? (y/n): ").strip().lower()
        if reprocess_report == "y":
            print("Processing report...")
            structured_report = process_scan_report(md, scan["target_url"])
            print(f"Structured report risk: {structured_report.get('risk_level', '?')}")
            areas = structured_report.get("areas_of_interest", [])
            print(f"Areas of interest: {len(areas)}")
            for a in areas:
                print(f"  - {a.get('title', '?')} [{a.get('severity', '?')}]")
    else:
        print("\nNo markdown report found")

    # Build new results
    new_results = {"findings": findings}
    if structured_report:
        new_results["structured_report"] = structured_report

    print(f"\n--- SUMMARY ---")
    print(f"Findings: {len(findings)}")
    print(f"Structured report: {'yes' if structured_report else 'no'}")

    confirm = input("\nUpdate database with these results? (y/n): ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return

    # Update DB
    await database.execute(
        scans.update()
        .where(scans.c.id == scan_id)
        .values(
            results_json=json.dumps(new_results),
            status="completed",
        )
    )
    print(f"\nDone! Scan {scan_id} updated with {len(findings)} findings.")
    await database.disconnect()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python reprocess_scan.py <scan_id>")
        print("\nThis re-parses Strix output files and updates the database.")
        sys.exit(1)

    asyncio.run(reprocess(sys.argv[1]))
