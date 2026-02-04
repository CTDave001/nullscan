import asyncio
import csv
import json
import os
from pathlib import Path

from app.config import settings


def _get_scan_instructions(scan_mode: str) -> str:
    """Return instructions that force the agent to actually test for vulnerabilities."""
    if scan_mode == "quick":
        return (
            "After recon, you MUST actively test for at least these vulnerabilities: "
            "SQL injection, XSS, and authentication issues. "
            "Do NOT finish after only reconnaissance. "
            "Use send_request to craft test payloads and verify responses. "
            "IMPORTANT: Only report VERIFIED vulnerabilities. A 200 status code is NOT proof. "
            "For XSS, confirm the payload appears unescaped in the response body. "
            "For SQLi, confirm database errors or behavioral differences. "
            "For auth bypass, confirm the response contains actual session tokens or user data. "
            "Do NOT report based on status codes alone. False positives are unacceptable."
        )

    # Deep mode — phase structure only (persistent rules are in nullscan_rules skill)
    return """MANDATORY: This scan has TWO phases. You MUST complete BOTH before finishing.

PHASE 1 - RECONNAISSANCE (max 30% of your effort):
Subdomain enumeration, port scanning, technology fingerprinting. Keep it fast.

PHASE 2 - ACTIVE VULNERABILITY TESTING (min 70% of your effort):
This is the MAIN purpose of the scan. You MUST test for ALL of these:
1. SQL Injection  2. XSS  3. Authentication bypass  4. IDOR
5. SSRF  6. Directory traversal  7. Security headers

For EACH test: use send_request or browser_action to send real payloads. Analyze the response.

CRITICAL RULES:
- Do NOT finish with only recon results
- Do NOT skip vulnerability testing because recon found nothing interesting
- Every endpoint found in recon MUST be tested
- If a tool fails, use python_action or send_request as fallback
- Follow all nullscan_rules — they are loaded in your system prompt"""


def _classify_command(cmd: str) -> str:
    """Turn a raw shell command into a clear, non-technical description."""
    cmd_lower = cmd.lower()

    # Subdomain / DNS tools
    if any(t in cmd_lower for t in ("subfinder", "amass", "assetfinder", "findomain")):
        return "Discovering subdomains and related hosts"
    if any(t in cmd_lower for t in ("dnsx", "dig ", "nslookup", "host ")):
        return "Performing DNS lookups to map infrastructure"
    if "zone transfer" in cmd_lower or "axfr" in cmd_lower:
        return "Checking for DNS zone transfer vulnerabilities"

    # Port / network scanning
    if any(t in cmd_lower for t in ("naabu", "nmap", "masscan")):
        return "Scanning for open ports and exposed services"

    # Web fuzzing / discovery
    if any(t in cmd_lower for t in ("ffuf", "gobuster", "dirsearch", "feroxbuster")):
        return "Searching for hidden pages and directories"
    if "wordlist" in cmd_lower and ("mkdir" in cmd_lower or "echo" in cmd_lower):
        return "Preparing wordlists for endpoint discovery"

    # HTTP tools
    if any(t in cmd_lower for t in ("curl ", "wget ", "httpx")):
        return "Probing HTTP endpoints for responses"
    if "nuclei" in cmd_lower:
        return "Running vulnerability signature checks"

    # SSL / TLS
    if any(t in cmd_lower for t in ("sslscan", "testssl", "openssl")):
        return "Analyzing SSL/TLS certificate security"

    # Git / source exposure
    if ".git" in cmd_lower:
        return "Checking for exposed source code repositories"

    # Generic analysis
    if any(t in cmd_lower for t in ("grep", "awk", "sed", "cat ", "jq ")):
        return "Analyzing collected scan data"
    if any(t in cmd_lower for t in ("python", "pip ")):
        return "Running automated security analysis"

    return "Executing security test in sandbox"


def _describe_tool(tool_name: str, args: dict) -> str | None:
    """Convert a Strix tool execution into a clear, user-friendly description."""
    # Skip internal orchestration tools — users don't need to see these
    SKIP = {
        "scan_start_info", "subagent_start_info", "agent_start_info",
        "create_agent", "send_message_to_agent", "agent_finish",
        "wait_for_message", "view_agent_graph",
        "think",
        "create_todo", "list_todos", "update_todo",
        "mark_todo_done", "mark_todo_pending", "delete_todo",
        "create_note", "list_notes", "update_note", "delete_note",
        "finish_scan",
        "naabu",  # raw tool invocations get a terminal_execute too
    }
    if tool_name in SKIP:
        return None

    url = args.get("url", args.get("target_url", args.get("endpoint", "")))

    if tool_name == "browser_action":
        action = args.get("action", "")
        target = args.get("url", "")
        if action == "goto" and target:
            # Extract path for readability
            from urllib.parse import urlparse
            parsed = urlparse(target)
            page = parsed.path or "/"
            return f"Loading and analyzing {parsed.netloc}{page}"
        if action == "click":
            return "Testing interactive elements for vulnerabilities"
        if action in ("type", "fill"):
            return "Injecting test payloads into input fields"
        if action == "screenshot":
            return "Documenting current page state"
        if action == "scroll":
            return "Exploring page content"
        return "Analyzing page structure and behavior"

    if tool_name == "terminal_execute":
        command = args.get("command", "")
        if command:
            return _classify_command(command)
        return "Executing security test in sandbox"

    if tool_name == "python_action":
        return "Running automated vulnerability analysis"

    if tool_name == "send_request":
        method = args.get("method", "GET")
        target = url or args.get("path", "")
        if target:
            from urllib.parse import urlparse
            parsed = urlparse(target)
            path = parsed.path or "/"
            if method.upper() == "POST":
                return f"Testing form submission on {path}"
            return f"Probing endpoint {path} for vulnerabilities"
        return "Testing HTTP endpoint security"

    if tool_name == "repeat_request":
        return "Replaying modified request to verify vulnerability"

    if tool_name == "list_requests":
        return "Reviewing intercepted network traffic"

    if tool_name == "view_request":
        return "Inspecting request and response headers"

    if tool_name == "scope_rules":
        return "Defining scan boundaries"

    if tool_name == "list_sitemap":
        return "Mapping all discovered application endpoints"

    if tool_name == "view_sitemap_entry":
        return "Analyzing endpoint parameters and behavior"

    if tool_name == "str_replace_editor":
        return "Crafting custom test payload"

    if tool_name == "list_files":
        return "Organizing scan results"

    if tool_name == "search_files":
        return "Cross-referencing scan findings"

    if tool_name == "web_search":
        query = args.get("query", "")
        if query:
            return f"Researching known vulnerabilities for {query[:40]}"
        return "Researching known vulnerability databases"

    if tool_name == "create_vulnerability_report":
        title = args.get("title", "")
        severity = args.get("severity", "")
        if title:
            sev = f" ({severity})" if severity else ""
            return f"Confirmed finding: {title[:50]}{sev}"
        return "Documenting confirmed vulnerability"

    return None  # Hide anything we don't recognize rather than showing junk


def _humanize_agent(agent_data: dict) -> dict | None:
    """Convert raw agent data into something meaningful for a user.

    Uses the agent's actual task description — that's the real info.
    Just cleans up the label and strips internal junk.
    """
    import re
    name = agent_data.get("name", "")
    task = agent_data.get("task", "")
    status = agent_data.get("status", "running")

    # Skip the root orchestrator
    if name.lower() in ("root agent", "root"):
        return None

    # Build a clean label from the agent name:
    # "Subdomain Enumeration Agent for FormVault" -> "Subdomain Enumeration"
    label = name
    # Remove "Agent" suffix
    label = re.sub(r'\s*Agent\s*$', '', label, flags=re.IGNORECASE)
    # Remove "for <target>" suffix
    label = re.sub(r'\s+for\s+\S+.*$', '', label, flags=re.IGNORECASE)
    label = label.strip()
    if not label:
        label = "Security Analysis"

    # The task field is the real description — use it directly, just truncate
    desc = task[:120] if task else ""

    return {
        "label": label,
        "description": desc,
        "status": status,
    }


async def _update_progress(scan_id: str, tracer, vulnerabilities: list):
    """Write scan progress to database every few seconds."""
    from app.database import database, scans

    seen_exec_ids: set[int] = set()
    activity_log: list[dict] = []
    last_token_count = 0
    stall_ticks = 0  # How many 5s ticks with no token change + all waiting

    while True:
        await asyncio.sleep(5)
        try:
            stats = tracer.get_total_llm_stats()
            total = stats.get("total", {})

            # Debug: dump unique tool names and agent statuses
            tool_names = set(
                e.get("tool_name", "") for e in tracer.tool_executions.values()
            )
            agent_info = {
                a.get("name", "?"): a.get("status", "?")
                for a in tracer.agents.values()
            }
            current_tokens = total.get("input_tokens", 0)
            print(f"[progress] tokens={current_tokens} tools={tool_names} agents={agent_info}", flush=True)

            # Deadlock detection: all agents waiting + no token progress
            statuses = [a.get("status", "") for a in tracer.agents.values()]
            any_running = any(s == "running" for s in statuses)
            all_done = all(s == "completed" for s in statuses)

            if not any_running and not all_done and current_tokens == last_token_count and len(statuses) > 1:
                stall_ticks += 1
                if stall_ticks == 6:  # 30 seconds
                    print(f"[deadlock] Warning: all agents waiting, no progress for 30s", flush=True)
                if stall_ticks >= 12:  # 60 seconds
                    print(f"[deadlock] Agents stalled for 60s — waiting timeouts will auto-resume them", flush=True)
            else:
                stall_ticks = 0

            last_token_count = current_tokens

            # Build active agents list (running or waiting = still working)
            active_agents = []
            for agent_data in list(tracer.agents.values()):
                status = agent_data.get("status", "")
                if status in ("running", "waiting"):
                    humanized = _humanize_agent(agent_data)
                    if humanized:
                        active_agents.append(humanized)

            # Build activity log from new tool executions
            for exec_id, exec_data in list(tracer.tool_executions.items()):
                if exec_id in seen_exec_ids:
                    continue
                seen_exec_ids.add(exec_id)

                tool_name = exec_data.get("tool_name", "")
                args = exec_data.get("args", {})
                description = _describe_tool(tool_name, args)
                if description:
                    activity_log.append({
                        "ts": exec_data.get("started_at", ""),
                        "description": description,
                        "status": exec_data.get("status", "running"),
                    })

            # Keep last 30 activity entries
            recent_activity = activity_log[-30:]

            progress = {
                "agents": len(tracer.agents),
                "active_agents": len(active_agents),
                "tools": tracer.get_real_tool_count(),
                "input_tokens": total.get("input_tokens", 0),
                "output_tokens": total.get("output_tokens", 0),
                "cost": total.get("cost", 0.0),
                "vulnerabilities_found": len(vulnerabilities),
                "findings_so_far": [
                    {
                        "title": v.get("title", "Unknown"),
                        "severity": v.get("severity", "medium"),
                    }
                    for v in vulnerabilities
                ],
                "active_agent_list": active_agents[:5],
                "recent_activity": recent_activity,
            }
            await database.execute(
                scans.update()
                .where(scans.c.id == scan_id)
                .values(progress_json=json.dumps(progress))
            )
        except asyncio.CancelledError:
            raise
        except Exception as e:
            print(f"[progress] Error updating progress: {e}", flush=True)
            import traceback
            traceback.print_exc()


async def run_strix_scan_async(target_url: str, scan_type: str = "quick", scan_id: str = "") -> dict:
    """
    Run Strix scan using its Python API directly (no CLI/subprocess).
    Returns parsed results or error dict.
    """
    if scan_type == "quick":
        scan_mode = "quick"
    else:
        scan_mode = "deep"

    # Set env vars that Strix reads via its Config class
    os.environ["STRIX_LLM"] = (
        settings.strix_llm_quick if scan_type == "quick" else settings.strix_llm_deep
    )
    os.environ["LLM_API_KEY"] = settings.llm_api_key
    # Reduce agent wait timeout from 600s to 120s to prevent deadlocks
    os.environ["STRIX_AGENT_WAIT_TIMEOUT"] = "120"
    # Cap max agents to prevent runaway spawning
    os.environ["STRIX_MAX_AGENTS"] = "20"

    try:
        from strix.agents.StrixAgent import StrixAgent
        from strix.config import apply_saved_config
        from strix.interface.utils import generate_run_name, infer_target_type
        from strix.llm.config import LLMConfig
        from strix.runtime import cleanup_runtime
        from strix.telemetry.tracer import Tracer, set_global_tracer

        apply_saved_config()
        print(f"[strix] Config applied, starting scan for {target_url}")

        # Build target info the same way Strix CLI does
        target_type, target_details = infer_target_type(target_url)
        targets_info = [
            {
                "type": target_type,
                "details": target_details,
                "original": target_url,
            }
        ]

        run_name = generate_run_name(targets_info)

        # Set up tracer (required by Strix internals)
        tracer = Tracer(run_name)
        scan_config = {
            "scan_id": run_name,
            "targets": targets_info,
            "user_instructions": _get_scan_instructions(scan_mode),
            "run_name": run_name,
        }
        tracer.set_scan_config(scan_config)
        set_global_tracer(tracer)

        # Collect vulnerabilities as they're found
        vulnerabilities = []

        def on_vulnerability(report: dict) -> None:
            vulnerabilities.append(report)

        tracer.vulnerability_found_callback = on_vulnerability

        # Start progress updater
        progress_task = None
        if scan_id:
            progress_task = asyncio.create_task(
                _update_progress(scan_id, tracer, vulnerabilities)
            )

        # Create agent and run scan
        llm_config = LLMConfig(
            scan_mode=scan_mode,
            skills=["nullscan_rules"],
        )
        agent_config = {
            "llm_config": llm_config,
            "max_iterations": 300,
            "non_interactive": True,
        }

        print(f"[strix] Tracer and progress task created, launching agent...")
        agent = StrixAgent(agent_config)
        result = await agent.execute_scan(scan_config)

        if isinstance(result, dict) and not result.get("success", True):
            error_msg = result.get("error", "Unknown error")
            details = result.get("details", "")
            if progress_task:
                progress_task.cancel()
            tracer.cleanup()
            cleanup_runtime()
            return {
                "error": "strix_error",
                "message": f"{error_msg}: {details}" if details else error_msg,
                "findings": [],
            }

        # Parse results from strix_runs/ directory
        findings = parse_strix_run_dir(run_name)

        # Also include any vulnerabilities reported via callback
        if not findings and vulnerabilities:
            findings = [
                {
                    "title": v.get("title", "Unknown"),
                    "severity": normalize_severity(v.get("severity", "medium")),
                    "endpoint": v.get("endpoint", ""),
                    "impact": v.get("impact", v.get("description", "")),
                    "reproduction_steps": v.get("technical_analysis", ""),
                    "poc": v.get("poc_script_code", v.get("poc_description", "")),
                    "fix_guidance": v.get("remediation_steps", ""),
                }
                for v in vulnerabilities
            ]

        # Filter out non-findings (severity NONE or explicitly "no vulnerability")
        findings = [f for f in findings if _is_real_finding(f)]

        if progress_task:
            progress_task.cancel()

        tracer.cleanup()
        cleanup_runtime()

        return {"findings": findings}

    except Exception as e:
        if progress_task:
            progress_task.cancel()
        # Clean up on error
        try:
            from strix.runtime import cleanup_runtime
            cleanup_runtime()
        except Exception:
            pass
        return {
            "error": "execution_failed",
            "message": str(e),
            "findings": [],
        }


def run_strix_scan(target_url: str, scan_type: str = "quick") -> dict:
    """Sync wrapper for the async scan function."""
    return asyncio.run(run_strix_scan_async(target_url, scan_type))


def parse_strix_run_dir(run_name: str) -> list[dict]:
    """Parse Strix output from strix_runs/<run_name>/vulnerabilities/."""
    findings = []
    run_dir = Path(f"strix_runs/{run_name}")

    if not run_dir.exists():
        return findings

    csv_file = run_dir / "vulnerabilities.csv"
    vuln_dir = run_dir / "vulnerabilities"

    if csv_file.exists():
        with open(csv_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                finding = parse_vulnerability_file(vuln_dir, row)
                if finding:
                    findings.append(finding)
    elif vuln_dir.exists():
        for md_file in sorted(vuln_dir.glob("*.md")):
            finding = parse_vulnerability_md(md_file)
            if finding:
                findings.append(finding)

    return findings


def parse_vulnerability_file(vuln_dir: Path, csv_row: dict) -> dict | None:
    """Parse a vulnerability from CSV row + its markdown file."""
    vuln_id = csv_row.get("id", "")
    md_file = vuln_dir / csv_row.get("file", f"{vuln_id}.md")

    finding = {
        "title": csv_row.get("title", "Unknown Issue"),
        "severity": normalize_severity(csv_row.get("severity", "medium")),
        "endpoint": "",
        "impact": "",
        "reproduction_steps": "",
        "poc": "",
        "fix_guidance": "",
    }

    if md_file.exists():
        details = parse_vulnerability_md(md_file)
        if details:
            finding.update({k: v for k, v in details.items() if v})

    return finding


def parse_vulnerability_md(md_file: Path) -> dict | None:
    """Parse a Strix vulnerability markdown report into structured data."""
    try:
        content = md_file.read_text(encoding="utf-8")
    except Exception:
        return None

    finding = {
        "title": "",
        "severity": "Medium",
        "endpoint": "",
        "impact": "",
        "reproduction_steps": "",
        "poc": "",
        "fix_guidance": "",
        "owasp_category": "",
    }

    for line in content.split("\n"):
        if line.startswith("# "):
            finding["title"] = line[2:].strip()
            break

    sections = split_markdown_sections(content)

    for heading, body in sections.items():
        heading_lower = heading.lower()
        if "severity" in heading_lower:
            finding["severity"] = normalize_severity(body.strip().split("\n")[0])
        elif "endpoint" in heading_lower or "target" in heading_lower:
            finding["endpoint"] = body.strip().split("\n")[0]
        elif "impact" in heading_lower:
            finding["impact"] = body.strip()
        elif "description" in heading_lower:
            if not finding["impact"]:
                finding["impact"] = body.strip()
        elif "proof of concept" in heading_lower or "poc" in heading_lower:
            finding["poc"] = body.strip()
        elif "technical analysis" in heading_lower:
            finding["reproduction_steps"] = body.strip()
        elif "remediation" in heading_lower or "fix" in heading_lower:
            finding["fix_guidance"] = body.strip()

    for line in content.split("\n")[:20]:
        stripped = line.strip()
        if stripped.startswith("- **Endpoint") or stripped.startswith("**Endpoint"):
            finding["endpoint"] = line.split(":", 1)[-1].strip().strip("*").strip()
        elif stripped.startswith("- **Target") or stripped.startswith("**Target"):
            if not finding["endpoint"]:
                finding["endpoint"] = line.split(":", 1)[-1].strip().strip("*").strip()
        elif stripped.startswith("- **Method") or stripped.startswith("**Method"):
            method = line.split(":", 1)[-1].strip().strip("*").strip()
            if finding["endpoint"]:
                finding["endpoint"] = f"{method} {finding['endpoint']}"
        elif stripped.startswith("- **Severity") or stripped.startswith("**Severity"):
            finding["severity"] = normalize_severity(
                line.split(":", 1)[-1].strip().strip("*")
            )

    if not finding["title"]:
        finding["title"] = md_file.stem.replace("-", " ").title()

    return finding


def split_markdown_sections(content: str) -> dict:
    """Split markdown content into sections by heading."""
    sections = {}
    current_heading = ""
    current_body = []

    for line in content.split("\n"):
        if line.startswith("## ") or line.startswith("### "):
            if current_heading:
                sections[current_heading] = "\n".join(current_body)
            current_heading = line.lstrip("#").strip()
            current_body = []
        else:
            current_body.append(line)

    if current_heading:
        sections[current_heading] = "\n".join(current_body)

    return sections


def _is_real_finding(finding: dict) -> bool:
    """Filter out non-findings that Strix filed despite finding nothing."""
    sev = finding.get("severity", "").lower()
    if sev == "none" or sev == "":
        return False

    # Check if the content explicitly says nothing was found
    for field in ("impact", "reproduction_steps", "poc"):
        val = finding.get(field, "").lower()
        if any(phrase in val for phrase in (
            "no exploitable vulnerabilit",
            "no critical impact",
            "no poc is required",
            "n/a",
            "no vulnerabilit",
        )):
            continue
        else:
            # At least one field has real content
            if val.strip():
                return True

    # All fields are either empty or say "nothing found"
    return False


def normalize_severity(severity: str) -> str:
    """Normalize severity string to standard format."""
    s = severity.lower().strip()
    if s == "none" or s == "":
        return "None"
    if "critical" in s:
        return "Critical"
    if "high" in s:
        return "High"
    if "medium" in s:
        return "Medium"
    if "low" in s:
        return "Low"
    if "info" in s:
        return "Low"
    return "Medium"
