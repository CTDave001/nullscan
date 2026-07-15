"""
StrixAdapter — integration with strix-agent >= 1.0 via its SUPPORTED surface.

Runs Strix through its headless CLI (`strix -n -t <target> -m <mode>`) in a per-scan working
directory, then reads the run directory's JSON artifacts. This replaces the previous in-process
integration (`strix.agents.StrixAgent` / `Tracer` / `agents_graph_actions`), which the 1.0.0
rewrite deleted — the source of the whole "fragile Strix" problem.

Contract (verified against strix-agent 1.0.4 source; see
docs/plans/2026-07-13-model-selection-and-strix-rebuild.md §4):

  * CLI flags are limited to: -t/--target, --instruction(-file), -n/--non-interactive,
    -m/--scan-mode {quick,standard,deep}, --scope-mode, --config, --resume. There is NO flag
    for model, iterations, budget, output dir, concurrency, or timeout.
  * Model is selected via env STRIX_LLM; the API key via LLM_API_KEY.
  * Output goes to <cwd>/strix_runs/<auto_run_name>/ — we set a per-scan CWD and discover the
    one new subdirectory.
  * Findings: strix_runs/<run>/vulnerabilities.json — a BARE JSON array of vuln objects.
  * Usage: strix_runs/<run>/run.json -> {"llm_usage": ..., "status": ...} (incremental).
  * Exit codes: 0 = clean, 2 = vulnerabilities found, 1 = error/interrupt.
  * Strix 1.0.x enforces NO cost cap, so we poll run.json and kill the process group when the
    tier cost limit or a wall-clock ceiling is exceeded.
  * There is no machine-readable progress stream — progress is derived by polling the run dir.
  * Requires a Docker daemon + image ghcr.io/usestrix/strix-sandbox:1.0.0.

NOTE: This module is gated behind settings.strix_use_cli (default False) until validated
against a live 1.0.x + Docker environment. The pure parsers below are unit-tested; the
subprocess orchestration must be smoke-tested on a real host before flipping the flag.
"""

import asyncio
import json
import os
import signal
import time
from pathlib import Path

from app.config import settings
from app.report_processor import process_scan_report

SANDBOX_IMAGE = "ghcr.io/usestrix/strix-sandbox:1.0.0"

# Strix 1.0.x has no wall-clock flag; we impose one per scan mode (seconds) as a cost/hang
# backstop and kill the process group when exceeded.
_WALL_CLOCK_SECONDS = {"quick": 20 * 60, "pro": 90 * 60, "deep": 240 * 60}

# Poll interval for the run directory (seconds).
_POLL_INTERVAL = 5


# ────────────────────────────────────────────────────────────────────────────────
# Pure helpers (unit-tested — see tests/test_strix_adapter.py)
# ────────────────────────────────────────────────────────────────────────────────

def _normalize_severity(sev, cvss=None) -> str:
    """Strix severities are lowercase enums (critical/high/medium/low/none); fall back to
    bucketing the numeric CVSS base score when the enum is missing/unknown."""
    s = str(sev or "").lower().strip()
    mapping = {
        "critical": "Critical", "high": "High", "medium": "Medium",
        "low": "Low", "none": "Low", "info": "Low", "informational": "Low",
    }
    if s in mapping:
        return mapping[s]
    try:
        c = float(cvss)
        if c >= 9.0:
            return "Critical"
        if c >= 7.0:
            return "High"
        if c >= 4.0:
            return "Medium"
        return "Low"
    except (TypeError, ValueError):
        return "Medium"


def _map_vulnerability(v: dict) -> dict:
    """Map a Strix 1.0.x vulnerability object to our finding schema."""
    return {
        "title": v.get("title") or "Unknown Issue",
        "severity": _normalize_severity(v.get("severity"), v.get("cvss")),
        "endpoint": v.get("endpoint") or v.get("target") or "",
        "impact": v.get("impact") or v.get("description") or "",
        "reproduction_steps": v.get("technical_analysis") or v.get("poc_description") or "",
        "poc": v.get("poc_script_code") or v.get("poc_description") or "",
        "fix_guidance": v.get("remediation_steps") or "",
    }


def parse_vulnerabilities(run_dir: Path) -> list[dict]:
    """Read strix_runs/<run>/vulnerabilities.json (a bare JSON array) → findings."""
    vf = Path(run_dir) / "vulnerabilities.json"
    if not vf.exists():
        return []
    try:
        data = json.loads(vf.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    if not isinstance(data, list):
        return []
    return [_map_vulnerability(v) for v in data if isinstance(v, dict)]


def read_run_json(run_dir: Path) -> dict:
    rf = Path(run_dir) / "run.json"
    if not rf.exists():
        return {}
    try:
        data = json.loads(rf.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def extract_usage(run_json: dict) -> dict:
    """Pull {cost, input_tokens, output_tokens} out of run.json's llm_usage, defensively —
    the exact shape isn't pinned in the 1.0.4 docs, so we probe common layouts."""
    usage = run_json.get("llm_usage") or {}
    if not isinstance(usage, dict):
        return {"cost": 0.0, "input_tokens": 0, "output_tokens": 0}
    # llm_usage may be flat or nested under "total".
    src = usage.get("total") if isinstance(usage.get("total"), dict) else usage

    def _num(*keys):
        for k in keys:
            val = src.get(k)
            if isinstance(val, (int, float)):
                return val
        return 0

    return {
        "cost": float(_num("cost", "total_cost", "cost_usd")),
        "input_tokens": int(_num("input_tokens", "prompt_tokens", "input")),
        "output_tokens": int(_num("output_tokens", "completion_tokens", "output")),
    }


def interpret_result(exit_code: int, findings: list, structured_report, killed_reason: str | None):
    """Turn (exit code, parsed artifacts, kill reason) into our worker result dict.

    Policy mirrors the fail-loud rule in strix_runner: a run with neither findings nor a
    structured report is a failure, never a false 'clean'."""
    if killed_reason == "timeout" and not findings:
        return {"error": "timeout", "message": "Scan exceeded its time budget.", "findings": []}

    if exit_code == 1 and not findings and not structured_report:
        return {"error": "strix_error", "message": "Strix exited with an error.", "findings": []}

    if not findings and not structured_report:
        return {
            "error": "no_report",
            "message": "Scan completed but produced no usable report or findings.",
            "findings": [],
        }

    result = {"findings": findings}
    if structured_report:
        result["structured_report"] = structured_report
    return result


def _tier_config(scan_type: str):
    table = {
        "quick": (settings.tier_quick_llm, settings.tier_quick_mode, settings.tier_quick_cost_limit),
        "pro": (settings.tier_pro_llm, settings.tier_pro_mode, settings.tier_pro_cost_limit),
        "deep": (settings.tier_deep_llm, settings.tier_deep_mode, settings.tier_deep_cost_limit),
    }
    return table.get(scan_type, table["quick"])


# ────────────────────────────────────────────────────────────────────────────────
# Orchestration (requires live Strix 1.0.x + Docker — smoke-test before enabling)
# ────────────────────────────────────────────────────────────────────────────────

async def _write_progress(scan_id: str, cost: float, findings: list, phase: str, usage: dict):
    if not scan_id:
        return
    from app.database import database, scans
    progress = {
        "agents": 1,
        "active_agents": 1 if phase not in ("report", "done") else 0,
        "active_agent_list": [],  # no agent-graph access via the CLI (UI downgrade — see plan)
        "tools": 0,
        "input_tokens": usage.get("input_tokens", 0),
        "output_tokens": usage.get("output_tokens", 0),
        "cost": round(cost, 4),
        "vulnerabilities_found": len(findings),
        "findings_so_far": [{"title": f["title"], "severity": f["severity"]} for f in findings],
        "recent_activity": [],
        "current_phase": phase,
    }
    try:
        await database.execute(
            scans.update().where(scans.c.id == scan_id).values(progress_json=json.dumps(progress))
        )
    except Exception as e:  # progress is best-effort
        print(f"[strix-cli] progress write failed: {e}", flush=True)


def _discover_run_dir(strix_runs: Path) -> Path | None:
    if not strix_runs.exists():
        return None
    subdirs = [d for d in strix_runs.iterdir() if d.is_dir()]
    if not subdirs:
        return None
    # Newest by mtime — there should be exactly one per isolated CWD.
    return max(subdirs, key=lambda d: d.stat().st_mtime)


async def run_strix_cli_scan_async(target_url: str, scan_type: str = "quick", scan_id: str = "") -> dict:
    llm, scan_mode, cost_limit = _tier_config(scan_type)
    wall_clock = _WALL_CLOCK_SECONDS.get(scan_type, _WALL_CLOCK_SECONDS["quick"])

    # Isolated per-scan CWD so Strix's ./strix_runs/<name>/ is unambiguous.
    work_dir = Path("strix_cli_runs") / (scan_id or "adhoc")
    work_dir.mkdir(parents=True, exist_ok=True)
    strix_runs = work_dir / "strix_runs"

    env = os.environ.copy()
    env["STRIX_LLM"] = llm
    env["LLM_API_KEY"] = settings.llm_api_key
    env["STRIX_IMAGE"] = SANDBOX_IMAGE
    env["STRIX_TELEMETRY"] = "0"  # no PostHog/Scarf from a server

    cmd = ["strix", "-n", "-t", target_url, "-m", scan_mode]
    print(f"[strix-cli] launching: {' '.join(cmd)} (llm={llm}, cost_limit=${cost_limit}, "
          f"wall_clock={wall_clock}s)", flush=True)

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd, cwd=str(work_dir), env=env,
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
            start_new_session=True,  # own process group so we can kill the whole tree
        )
    except FileNotFoundError:
        return {"error": "strix_missing", "message": "strix CLI not found on PATH", "findings": []}

    start = time.monotonic()
    run_dir: Path | None = None
    killed_reason: str | None = None
    last_usage: dict = {"cost": 0.0, "input_tokens": 0, "output_tokens": 0}

    while True:
        if run_dir is None:
            run_dir = _discover_run_dir(strix_runs)

        findings_live: list = []
        if run_dir is not None:
            run_json = read_run_json(run_dir)
            last_usage = extract_usage(run_json)
            findings_live = parse_vulnerabilities(run_dir)
            phase = "analyze" if findings_live else "probe"
            await _write_progress(scan_id, last_usage["cost"], findings_live, phase, last_usage)

            if cost_limit and last_usage["cost"] >= cost_limit:
                killed_reason = "cost_limit"
                break

        if time.monotonic() - start > wall_clock:
            killed_reason = "timeout"
            break

        try:
            await asyncio.wait_for(proc.wait(), timeout=_POLL_INTERVAL)
            break  # process exited on its own
        except asyncio.TimeoutError:
            continue  # still running — poll again

    if killed_reason:
        print(f"[strix-cli] killing scan ({killed_reason})", flush=True)
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        except (ProcessLookupError, PermissionError, OSError):
            pass
        await proc.wait()

    exit_code = proc.returncode if proc.returncode is not None else 1

    if run_dir is None:
        run_dir = _discover_run_dir(strix_runs)
    if run_dir is None:
        return {"error": "strix_no_output", "message": "Strix produced no run directory.", "findings": []}

    findings = parse_vulnerabilities(run_dir)

    structured_report = None
    report_md = run_dir / "penetration_test_report.md"
    if report_md.exists():
        try:
            structured_report = process_scan_report(report_md.read_text(encoding="utf-8"), target_url)
        except Exception as e:
            print(f"[strix-cli] report processing failed: {e}", flush=True)

    await _write_progress(scan_id, last_usage["cost"], findings, "report", last_usage)
    print(f"[strix-cli] exit={exit_code} killed={killed_reason} findings={len(findings)} "
          f"report={'yes' if structured_report else 'no'} cost=${last_usage['cost']:.4f}", flush=True)

    return interpret_result(exit_code, findings, structured_report, killed_reason)
