"""Unit tests for the pure parsers/mappers in app.strix_adapter.

These exercise the highest-risk logic (parsing Strix 1.0.x run-dir artifacts and mapping to
our schema) against synthetic fixtures — no Docker/Strix required. The subprocess
orchestration in run_strix_cli_scan_async still needs a live smoke test before enabling.

Runnable directly (`python tests/test_strix_adapter.py`) or via pytest.
"""

import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.strix_adapter import (  # noqa: E402
    parse_vulnerabilities,
    read_run_json,
    extract_usage,
    interpret_result,
    _normalize_severity,
    _discover_run_dir,
)


def _make_run_dir(base: Path) -> Path:
    run_dir = base / "strix_runs" / "example-com_ab12"
    run_dir.mkdir(parents=True)
    vulns = [
        {
            "id": "vuln-0001",
            "title": "SQL Injection in login",
            "severity": "high",
            "description": "desc",
            "impact": "Attacker can dump the DB",
            "target": "https://example.com",
            "technical_analysis": "1. send payload 2. observe error",
            "poc_description": "inject ' OR 1=1",
            "poc_script_code": "curl -X POST ...",
            "remediation_steps": "use parameterized queries",
            "cvss": 8.6,
            "endpoint": "/api/login",
            "method": "POST",
            "cwe": "CWE-89",
        },
        {
            "id": "vuln-0002",
            "title": "Verbose error page",
            "severity": "",            # empty → severity bucketed from cvss
            "cvss": 3.1,
            "target": "https://example.com/info",  # no endpoint → falls back to target
        },
    ]
    (run_dir / "vulnerabilities.json").write_text(json.dumps(vulns), encoding="utf-8")
    (run_dir / "run.json").write_text(json.dumps({
        "run_name": "example-com_ab12",
        "status": "complete",
        "llm_usage": {"total": {"cost": 1.2345, "input_tokens": 12000, "output_tokens": 640}},
    }), encoding="utf-8")
    (run_dir / "penetration_test_report.md").write_text("# Executive Summary\n...", encoding="utf-8")
    return run_dir


def test_parse_vulnerabilities_maps_fields():
    with tempfile.TemporaryDirectory() as d:
        run_dir = _make_run_dir(Path(d))
        findings = parse_vulnerabilities(run_dir)
        assert len(findings) == 2, findings

        f0 = findings[0]
        assert f0["title"] == "SQL Injection in login"
        assert f0["severity"] == "High"
        assert f0["endpoint"] == "/api/login"
        assert f0["impact"] == "Attacker can dump the DB"
        assert f0["reproduction_steps"] == "1. send payload 2. observe error"
        assert f0["poc"] == "curl -X POST ..."
        assert f0["fix_guidance"] == "use parameterized queries"

        f1 = findings[1]
        assert f1["severity"] == "Low", "cvss 3.1 should bucket to Low"
        assert f1["endpoint"] == "https://example.com/info", "endpoint falls back to target"
        assert f1["poc"] == "", "no poc fields → empty"


def test_normalize_severity():
    assert _normalize_severity("critical") == "Critical"
    assert _normalize_severity("HIGH") == "High"
    assert _normalize_severity("none") == "Low"
    assert _normalize_severity("", 9.1) == "Critical"
    assert _normalize_severity(None, 7.0) == "High"
    assert _normalize_severity("weird", None) == "Medium"


def test_extract_usage_nested_and_flat():
    nested = extract_usage({"llm_usage": {"total": {"cost": 1.5, "input_tokens": 10, "output_tokens": 2}}})
    assert nested == {"cost": 1.5, "input_tokens": 10, "output_tokens": 2}, nested
    flat = extract_usage({"llm_usage": {"cost": 2.0, "prompt_tokens": 5}})
    assert flat["cost"] == 2.0 and flat["input_tokens"] == 5, flat
    assert extract_usage({}) == {"cost": 0.0, "input_tokens": 0, "output_tokens": 0}


def test_read_run_json():
    with tempfile.TemporaryDirectory() as d:
        run_dir = _make_run_dir(Path(d))
        rj = read_run_json(run_dir)
        assert rj["status"] == "complete"
        assert extract_usage(rj)["cost"] == 1.2345


def test_interpret_result_branches():
    f = {"title": "x", "severity": "High"}
    # exit 2 = findings → success
    assert interpret_result(2, [f], None, None) == {"findings": [f]}
    # structured report only → success
    r = interpret_result(0, [], {"risk_level": "Clean"}, None)
    assert r["findings"] == [] and r["structured_report"] == {"risk_level": "Clean"}
    # clean-but-empty → fail-loud, never false "clean"
    assert interpret_result(0, [], None, None)["error"] == "no_report"
    # exit 1 with nothing → strix_error
    assert interpret_result(1, [], None, None)["error"] == "strix_error"
    # killed on timeout with nothing → timeout
    assert interpret_result(0, [], None, "timeout")["error"] == "timeout"


def test_discover_run_dir():
    with tempfile.TemporaryDirectory() as d:
        strix_runs = Path(d) / "strix_runs"
        assert _discover_run_dir(strix_runs) is None
        (strix_runs / "run-a").mkdir(parents=True)
        assert _discover_run_dir(strix_runs).name == "run-a"


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"PASS {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"FAIL {t.__name__}: {e}")
    print(f"\n{len(tests) - failed}/{len(tests)} passed")
    sys.exit(1 if failed else 0)
