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
