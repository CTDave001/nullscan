"""
Strix Runner - Clean integration following original Strix CLI pattern.
Runs scans via Python API with progress tracking and report processing.
"""

import asyncio
import csv
import json
import os
from pathlib import Path

from app.config import settings
from app.report_processor import process_scan_report


def _categorize_action(tool_name: str, args: dict, cmd_lower: str = "") -> tuple[str, str]:
    """Categorize action and create user-friendly description."""
    import re

    # Check for vulnerability-related keywords
    vuln_keywords = ["vulnerability", "vuln", "exploit", "injection", "xss", "sqli", "found"]
    is_vuln = any(k in cmd_lower for k in vuln_keywords)

    if tool_name == "terminal_execute":
        cmd = args.get("command", "")
        cmd_lower = cmd.lower()

        # Categorize based on command content
        if any(x in cmd_lower for x in ["nmap", "masscan", "naabu"]):
            if "443" in cmd or "https" in cmd:
                return "[RECON]", "Port scanning HTTPS services"
            elif "80" in cmd or "http" in cmd:
                return "[RECON]", "Port scanning HTTP services"
            return "[RECON]", "Scanning for open ports"

        if any(x in cmd_lower for x in ["curl", "wget", "httpx"]):
            # Extract URL/path if present
            urls = re.findall(r'https?://[^\s"\']+', cmd)
            if urls:
                url = urls[0]
                # Get domain or path
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(url)
                    path = parsed.path if parsed.path and parsed.path != "/" else parsed.netloc
                    path = path[:35]
                    return "[PROBE]", f"Testing {path}"
                except:
                    pass
            return "[PROBE]", "Fetching HTTP response"

        if any(x in cmd_lower for x in ["nuclei"]):
            return "[SCAN]", "Running Nuclei vulnerability templates"

        if any(x in cmd_lower for x in ["nikto"]):
            return "[SCAN]", "Running Nikto web scanner"

        if any(x in cmd_lower for x in ["wpscan"]):
            return "[SCAN]", "Scanning WordPress installation"

        if any(x in cmd_lower for x in ["sqlmap"]):
            if is_vuln:
                return "[VULN]", "SQL Injection vulnerability confirmed"
            return "[SQLI]", "Testing for SQL injection"

        if any(x in cmd_lower for x in ["subfinder", "amass"]):
            return "[RECON]", "Discovering subdomains"

        if "ffuf" in cmd_lower or "gobuster" in cmd_lower or "dirb" in cmd_lower:
            return "[RECON]", "Fuzzing directories and files"

        if any(x in cmd_lower for x in ["grep", "awk", "sed"]):
            return "[ANALYZE]", "Processing scan results"

        if any(x in cmd_lower for x in ["cat", "head", "tail"]):
            return "[ANALYZE]", "Reviewing collected data"

        if "echo" in cmd_lower and "workspace" in cmd_lower:
            # Skip noisy workspace setup commands
            return "[INIT]", "Setting up test environment"

        if "mkdir" in cmd_lower:
            return "[INIT]", "Creating workspace directories"

        if "dns" in cmd_lower or "dig" in cmd_lower or "nslookup" in cmd_lower:
            return "[RECON]", "Performing DNS lookups"

        if "cd " in cmd_lower and ("echo" in cmd_lower or "set -e" in cmd_lower):
            return "[INIT]", "Initializing test environment"

        return "[EXEC]", "Running security test"

    if tool_name == "browser_action":
        action = args.get("action", "")
        url = args.get("url", "")

        if action == "goto":
            if url:
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(url)
                    path = parsed.path if parsed.path and parsed.path != "/" else "/"
                    if "login" in url.lower() or "auth" in url.lower():
                        return "[AUTH]", f"Testing login page"
                    if "admin" in url.lower():
                        return "[AUTH]", f"Probing admin interface"
                    if "api" in url.lower():
                        return "[PROBE]", f"Testing API endpoint"
                    return "[PROBE]", f"Navigating to {path[:30]}"
                except:
                    pass
            return "[PROBE]", "Loading target page"

        if action == "click":
            return "[PROBE]", "Clicking page element"

        if action == "fill":
            return "[PROBE]", "Injecting test payload into form"

        if action == "screenshot":
            return "[RECON]", "Capturing page screenshot"

        if action == "launch":
            return "[INIT]", "Launching browser"

        if action == "view_source":
            return "[RECON]", "Analyzing page source code"

        return "[PROBE]", f"Browser: {action}"

    if tool_name == "send_request":
        method = args.get("method", "GET")
        url = args.get("url", "")
        body = str(args.get("body", "")).lower()

        # Check for attack patterns
        if any(x in body for x in ["'", '"', "union", "select", "--"]):
            return "[SQLI]", f"Testing SQL injection via {method}"
        if any(x in body for x in ["<script", "javascript:", "onerror"]):
            return "[XSS]", f"Testing XSS via {method}"
        if any(x in body for x in ["../", "..\\", "/etc/passwd"]):
            return "[PATH]", f"Testing path traversal via {method}"

        if url:
            try:
                from urllib.parse import urlparse
                parsed = urlparse(url)
                path = parsed.path[:25] if parsed.path else "/"
                if "user" in url.lower() or "profile" in url.lower():
                    return "[IDOR]", f"{method} testing user access control"
                if "admin" in url.lower():
                    return "[AUTH]", f"{method} testing admin access"
                return "[PROBE]", f"{method} request to {path}"
            except:
                pass

        return "[PROBE]", f"Sending {method} request"

    if tool_name == "python_action":
        return "[ANALYZE]", "Running analysis script"

    if tool_name == "naabu":
        return "[RECON]", "Fast port scanning with Naabu"

    if tool_name == "list_requests":
        return "[ANALYZE]", "Reviewing captured HTTP traffic"

    if tool_name == "view_request":
        return "[ANALYZE]", "Inspecting HTTP request details"

    if tool_name == "create_note":
        return "[NOTE]", "Recording security finding"

    # Default - clean up tool name
    clean_name = tool_name.replace("_", " ").title()
    return "[EXEC]", clean_name


def _describe_tool_execution(tool_name: str, args: dict) -> str:
    """Create a user-friendly log entry for a tool execution."""
    category, description = _categorize_action(tool_name, args)
    return f"{category} {description}"


def _get_friendly_agent_name(agent_id: str, task: str, index: int) -> str:
    """Generate a user-friendly agent name based on task or index."""
    task_lower = task.lower() if task else ""

    # Try to infer role from task description
    if any(x in task_lower for x in ["recon", "discover", "enumerate", "subdomain", "dns"]):
        return "Recon Agent"
    if any(x in task_lower for x in ["sql", "injection", "database"]):
        return "SQLi Scanner"
    if any(x in task_lower for x in ["xss", "script", "cross-site"]):
        return "XSS Scanner"
    if any(x in task_lower for x in ["auth", "login", "session", "password"]):
        return "Auth Tester"
    if any(x in task_lower for x in ["api", "endpoint", "rest"]):
        return "API Prober"
    if any(x in task_lower for x in ["ssrf", "request forgery"]):
        return "SSRF Scanner"
    if any(x in task_lower for x in ["path", "traversal", "directory"]):
        return "Path Traversal"
    if any(x in task_lower for x in ["header", "security header", "cors"]):
        return "Header Analyzer"
    if any(x in task_lower for x in ["port", "scan", "service"]):
        return "Port Scanner"
    if any(x in task_lower for x in ["browser", "click", "form"]):
        return "Browser Agent"

    # Fallback to generic numbered names
    names = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel"]
    return f"Agent {names[index % len(names)]}"


def _get_agent_thought(tool_name: str, args: dict, task: str) -> str:
    """Generate a human-readable thought about what the agent is doing."""
    if tool_name == "terminal_execute":
        cmd = args.get("command", "")
        cmd_lower = cmd.lower()

        if "nmap" in cmd_lower or "masscan" in cmd_lower:
            return "Scanning for open ports and services..."
        if "curl" in cmd_lower or "wget" in cmd_lower:
            return "Fetching and analyzing HTTP responses..."
        if "nuclei" in cmd_lower:
            return "Running vulnerability templates..."
        if "sqlmap" in cmd_lower:
            return "Testing SQL injection vectors..."
        if "subfinder" in cmd_lower or "amass" in cmd_lower:
            return "Discovering subdomains..."
        if "grep" in cmd_lower or "cat" in cmd_lower:
            return "Analyzing collected data..."
        return "Executing security test..."

    if tool_name == "browser_action":
        action = args.get("action", "")
        if action == "goto":
            return "Navigating to target page..."
        if action == "click":
            return "Interacting with page elements..."
        if action == "fill":
            return "Testing form inputs with payloads..."
        if action == "screenshot":
            return "Capturing page state for analysis..."
        return "Performing browser interaction..."

    if tool_name == "send_request":
        method = args.get("method", "GET")
        return f"Sending {method} request to test endpoint..."

    if tool_name == "view_request":
        return "Analyzing captured HTTP traffic..."

    if tool_name == "list_requests":
        return "Reviewing intercepted requests..."

    # Fallback to task if available
    if task:
        return task[:60] + "..." if len(task) > 60 else task

    return "Analyzing target..."


def _determine_scan_phase(tracer, vulnerabilities: list) -> str:
    """Determine current scan phase based on tool activity."""
    # Analyze recent tool executions to determine phase
    tools_used = set()
    for exec_data in tracer.tool_executions.values():
        tool_name = exec_data.get("tool_name", "")
        args = exec_data.get("args", {})
        tools_used.add(tool_name)

        # Check command content for phase hints
        if tool_name == "terminal_execute":
            cmd = args.get("command", "").lower()
            if any(x in cmd for x in ["sqlmap", "union", "select"]):
                tools_used.add("sqli_test")
            if any(x in cmd for x in ["nuclei", "nikto"]):
                tools_used.add("vuln_scan")
            if any(x in cmd for x in ["nmap", "masscan", "subfinder"]):
                tools_used.add("recon_tool")

    # Determine phase based on tools used
    has_recon = any(x in tools_used for x in ["naabu", "recon_tool", "list_requests"])
    has_probe = "send_request" in tools_used or "browser_action" in tools_used
    has_attack = any(x in tools_used for x in ["sqli_test", "vuln_scan"])
    has_vulns = len(vulnerabilities) > 0

    # Return most advanced phase
    if has_vulns:
        return "analyze"
    if has_attack:
        return "attack"
    if has_probe:
        return "probe"
    if has_recon:
        return "recon"
    return "init"


# Track max-seen values so counters never decrease on the dashboard
_max_cost_seen = {}  # scan_id -> float
_max_tokens_seen = {}


async def _update_progress(
    scan_id: str, tracer, vulnerabilities: list,
    cost_limit: float = 0, agent=None,
):
    """Write scan progress to database periodically."""
    from app.database import database, scans

    _cost_warning_sent = False

    while True:
        await asyncio.sleep(5)
        try:
            stats = tracer.get_total_llm_stats()
            total = stats.get("total", {})

            # Use tracer cost but track max-seen so it never decreases
            raw_cost = total.get("cost", 0.0)
            if scan_id not in _max_cost_seen:
                _max_cost_seen[scan_id] = 0.0
            _max_cost_seen[scan_id] = max(_max_cost_seen[scan_id], raw_cost)
            current_cost = _max_cost_seen[scan_id]

            # Check cost limit — tell the agent to wrap up
            if cost_limit > 0 and current_cost >= cost_limit and agent and not _cost_warning_sent:
                _cost_warning_sent = True
                print(f"[cost] Cost ${current_cost:.2f} exceeded limit ${cost_limit:.2f}, telling agent to wrap up", flush=True)
                try:
                    # Inject wrap-up message and reduce remaining iterations
                    agent.state.add_message("user",
                        "URGENT COST LIMIT REACHED: You have exceeded the budget for this scan. "
                        "Immediately wrap up all work. Tell all sub-agents to finish their current "
                        "tasks and call agent_finish NOW. Then generate your final report and call "
                        "finish_scan. No new tests or scans — wrap up with what you have."
                    )
                    # Give the agent a few iterations to wrap up, then it hits max
                    agent.state.max_iterations = min(
                        agent.state.max_iterations,
                        agent.state.iteration + 8,
                    )
                except Exception as e:
                    print(f"[cost] Failed to send wrap-up message: {e}", flush=True)

            # Track max tokens (never decrease)
            current_tokens = total.get("input_tokens", 0)
            if scan_id not in _max_tokens_seen:
                _max_tokens_seen[scan_id] = 0
            _max_tokens_seen[scan_id] = max(_max_tokens_seen[scan_id], current_tokens)
            tokens_to_show = _max_tokens_seen[scan_id]

            # Count active agents and build agent list
            active_count = 0
            active_agent_list = []
            agent_index = 0
            for agent_id, a in tracer.agents.items():
                status = a.get("status", "unknown")
                if status in ("running", "waiting"):
                    active_count += 1

                    # Get agent's task for naming
                    task = a.get("task", "")
                    tool_execs = a.get("tool_executions", [])

                    # Generate friendly name
                    agent_name = _get_friendly_agent_name(agent_id, task, agent_index)
                    agent_index += 1

                    # Generate thought/description
                    description = "Analyzing target..."
                    if tool_execs:
                        last_exec_id = tool_execs[-1]
                        last_exec = tracer.tool_executions.get(last_exec_id, {})
                        tool_name = last_exec.get("tool_name", "")
                        args = last_exec.get("args", {})
                        description = _get_agent_thought(tool_name, args, task)

                    active_agent_list.append({
                        "label": agent_name,
                        "description": description,
                        "status": status,
                    })

            # Determine current phase based on activity
            phase = _determine_scan_phase(tracer, vulnerabilities)

            # Build activity log from recent tool executions
            all_activity = []
            skip_tools = {
                "think", "create_agent", "send_message_to_agent",
                "wait_for_message", "agent_finish", "finish_scan",
                "create_todo", "list_todos", "update_todo",
                "subagent_start_info", "scan_start_info",
            }

            for exec_data in tracer.tool_executions.values():
                tool_name = exec_data.get("tool_name", "")
                if tool_name in skip_tools:
                    continue

                args = exec_data.get("args", {})
                desc = _describe_tool_execution(tool_name, args)

                all_activity.append({
                    "ts": exec_data.get("started_at", ""),
                    "description": desc,
                    "status": exec_data.get("status", "running"),
                })

            # Sort by timestamp and take last 100
            all_activity.sort(key=lambda x: x["ts"])
            total_activity = len(all_activity)
            recent_activity = all_activity[-100:]

            # Add line numbers (offset from total)
            start_num = max(1, total_activity - len(recent_activity) + 1)
            for i, entry in enumerate(recent_activity):
                entry["line"] = start_num + i

            progress = {
                "agents": len(tracer.agents),
                "active_agents": active_count,
                "active_agent_list": active_agent_list,
                "tools": tracer.get_real_tool_count(),
                "input_tokens": tokens_to_show,  # Use cumulative max
                "output_tokens": total.get("output_tokens", 0),
                "cost": current_cost,
                "vulnerabilities_found": len(vulnerabilities),
                "findings_so_far": [
                    {"title": v.get("title", ""), "severity": v.get("severity", "")}
                    for v in vulnerabilities
                ],
                "recent_activity": recent_activity[-100:],
                "current_phase": phase,
            }

            await database.execute(
                scans.update()
                .where(scans.c.id == scan_id)
                .values(progress_json=json.dumps(progress))
            )
        except asyncio.CancelledError:
            raise
        except Exception as e:
            print(f"[progress] Error: {e}", flush=True)


async def run_strix_scan_async(
    target_url: str,
    scan_type: str = "quick",
    scan_id: str = ""
) -> dict:
    """
    Run Strix scan using Python API (follows original CLI pattern).
    Returns parsed results or error dict.
    """
    # Configure scan mode, iterations, cost limit, agent cap, and wait timeout per tier
    tier_config = {
        "quick": (settings.tier_quick_llm, settings.tier_quick_iterations, settings.tier_quick_mode, settings.tier_quick_cost_limit, settings.tier_quick_max_agents, settings.tier_quick_wait_timeout),
        "pro":   (settings.tier_pro_llm,   settings.tier_pro_iterations,   settings.tier_pro_mode,   settings.tier_pro_cost_limit,   settings.tier_pro_max_agents,   settings.tier_pro_wait_timeout),
        "deep":  (settings.tier_deep_llm,  settings.tier_deep_iterations,  settings.tier_deep_mode,  settings.tier_deep_cost_limit,  settings.tier_deep_max_agents,  settings.tier_deep_wait_timeout),
    }
    llm, max_iterations, scan_mode, cost_limit, max_agents, wait_timeout = tier_config.get(scan_type, tier_config["quick"])
    os.environ["STRIX_LLM"] = llm
    os.environ["LLM_API_KEY"] = settings.llm_api_key
    os.environ["STRIX_MAX_AGENTS"] = str(max_agents)
    os.environ["STRIX_AGENT_WAIT_TIMEOUT"] = str(wait_timeout)

    progress_task = None

    try:
        from strix.agents.StrixAgent import StrixAgent
        from strix.config import apply_saved_config
        from strix.interface.utils import generate_run_name, infer_target_type
        from strix.llm.config import LLMConfig
        from strix.runtime import cleanup_runtime
        from strix.telemetry.tracer import Tracer, set_global_tracer

        apply_saved_config()

        # Reset max-seen trackers for this scan
        _max_cost_seen.pop(scan_id, None)
        _max_tokens_seen.pop(scan_id, None)

        print(f"[strix] Starting {scan_mode} scan for {target_url} (max {max_iterations} iters, {max_agents} agents, {wait_timeout}s timeout)")

        # Build target info (same as Strix CLI)
        target_type, target_details = infer_target_type(target_url)
        targets_info = [{
            "type": target_type,
            "details": target_details,
            "original": target_url,
        }]

        run_name = generate_run_name(targets_info)

        # Configure scan (following CLI pattern)
        scan_config = {
            "scan_id": run_name,
            "targets": targets_info,
            "user_instructions": "",
            "run_name": run_name,
        }

        # Set up tracer
        tracer = Tracer(run_name)
        tracer.set_scan_config(scan_config)
        set_global_tracer(tracer)

        # Collect vulnerabilities via callback
        vulnerabilities = []

        def on_vulnerability(report: dict) -> None:
            vulnerabilities.append(report)
            print(f"[strix] Vulnerability found: {report.get('title', 'Unknown')}")

        tracer.vulnerability_found_callback = on_vulnerability

        # Create agent and run scan (following CLI pattern)
        llm_config = LLMConfig(scan_mode=scan_mode)
        agent_config = {
            "llm_config": llm_config,
            "max_iterations": max_iterations,
            "non_interactive": True,
        }

        print(f"[strix] Launching agent (cost limit: ${cost_limit:.2f})...")
        agent = StrixAgent(agent_config)

        # Start progress tracking with cost limit and agent reference
        if scan_id:
            progress_task = asyncio.create_task(
                _update_progress(scan_id, tracer, vulnerabilities, cost_limit, agent)
            )

        result = await agent.execute_scan(scan_config)
        print(f"[strix] execute_scan returned: type={type(result).__name__}, keys={list(result.keys()) if isinstance(result, dict) else 'N/A'}", flush=True)
        if isinstance(result, dict):
            print(f"[strix] result success={result.get('success', 'not set')}, error={result.get('error', 'none')}", flush=True)

        # Check for scan errors
        if isinstance(result, dict) and not result.get("success", True):
            error_msg = result.get("error", "Unknown error")
            details = result.get("details", "")
            if progress_task:
                progress_task.cancel()
            # Write final cost before cleanup
            if scan_id:
                try:
                    from app.database import database, scans as scans_table
                    err_cost = _max_cost_seen.get(scan_id, tracer.get_total_llm_stats().get("total", {}).get("cost", 0.0))
                    existing = await database.fetch_one(scans_table.select().where(scans_table.c.id == scan_id))
                    progress = json.loads(existing["progress_json"]) if existing and existing["progress_json"] else {}
                    progress["cost"] = round(err_cost, 4)
                    progress["active_agents"] = 0
                    await database.execute(scans_table.update().where(scans_table.c.id == scan_id).values(progress_json=json.dumps(progress)))
                except Exception:
                    pass
            tracer.cleanup()
            cleanup_runtime()
            return {
                "error": "strix_error",
                "message": f"{error_msg}: {details}" if details else error_msg,
                "findings": [],
            }

        # Parse results from output directory
        findings = parse_strix_run_dir(run_name)
        print(f"[strix] File-based findings: {len(findings)}", flush=True)
        print(f"[strix] Callback vulnerabilities: {len(vulnerabilities)}", flush=True)

        # Always include callback vulnerabilities (merge with file-based findings)
        if vulnerabilities:
            callback_findings = [
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
            # Merge: add callback findings that aren't already in file-based findings (by title)
            existing_titles = {f.get("title", "").lower() for f in findings}
            for cf in callback_findings:
                if cf["title"].lower() not in existing_titles:
                    findings.append(cf)

        # Filter non-findings (but keep anything with a valid title and severity)
        pre_filter_count = len(findings)
        findings = [f for f in findings if _is_real_finding(f)]
        print(f"[strix] After merge: {pre_filter_count}, after filter: {len(findings)}", flush=True)
        if pre_filter_count > 0 and len(findings) == 0:
            print(f"[strix] WARNING: All findings filtered out! Titles were: {[f.get('title', '') for f in parse_strix_run_dir(run_name)]}", flush=True)

        # Write final progress before cancelling
        if progress_task:
            progress_task.cancel()
        if scan_id:
            try:
                from app.database import database, scans

                final_stats = tracer.get_total_llm_stats()
                final_total = final_stats.get("total", {})
                final_cost = max(
                    final_total.get("cost", 0.0),
                    _max_cost_seen.get(scan_id, 0.0),
                )
                final_tokens = max(
                    final_total.get("input_tokens", 0),
                    _max_tokens_seen.get(scan_id, 0),
                )
                # Read existing progress and update with final stats
                existing = await database.fetch_one(
                    scans.select().where(scans.c.id == scan_id)
                )
                progress = {}
                if existing and existing["progress_json"]:
                    progress = json.loads(existing["progress_json"])
                progress["cost"] = round(final_cost, 4)
                progress["input_tokens"] = final_tokens
                progress["output_tokens"] = final_total.get("output_tokens", 0)
                progress["active_agents"] = 0
                progress["active_agent_list"] = []
                await database.execute(
                    scans.update()
                    .where(scans.c.id == scan_id)
                    .values(progress_json=json.dumps(progress))
                )
                print(f"[strix] Final cost: ${final_cost:.4f}", flush=True)
            except Exception as e:
                print(f"[strix] Warning: Failed to write final progress: {e}", flush=True)

        # If still no findings but we had vulnerabilities in progress, log warning
        if not findings and vulnerabilities:
            print(f"[strix] WARNING: {len(vulnerabilities)} callback vulns were all filtered! Raw titles: {[v.get('title','') for v in vulnerabilities]}", flush=True)
            # Force-include callback vulnerabilities even if they look like non-findings
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

        # Last resort: if still no findings, pull from progress data in DB
        if not findings and scan_id:
            try:
                from app.database import database, scans as scans_tbl
                existing_scan = await database.fetch_one(
                    scans_tbl.select().where(scans_tbl.c.id == scan_id)
                )
                if existing_scan and existing_scan["progress_json"]:
                    prog = json.loads(existing_scan["progress_json"])
                    progress_findings = prog.get("findings_so_far", [])
                    if progress_findings:
                        print(f"[strix] FALLBACK: Recovering {len(progress_findings)} findings from progress data", flush=True)
                        findings = [
                            {
                                "title": f.get("title", "Unknown"),
                                "severity": normalize_severity(f.get("severity", "medium")),
                                "endpoint": "",
                                "impact": "",
                                "reproduction_steps": "",
                                "poc": "",
                                "fix_guidance": "",
                            }
                            for f in progress_findings
                            if f.get("title")
                        ]
            except Exception as e:
                print(f"[strix] Warning: Failed to recover from progress: {e}", flush=True)

        # Process markdown report for structured output
        structured_report = None
        run_dir = Path(f"strix_runs/{run_name}")
        report_path = run_dir / "penetration_test_report.md"

        # Log all files in run dir for debugging
        if run_dir.exists():
            all_files = list(run_dir.rglob("*"))
            print(f"[strix] Run dir files ({len(all_files)}):", flush=True)
            for f in all_files[:30]:
                print(f"  {f.relative_to(run_dir)} ({f.stat().st_size}b)", flush=True)
        else:
            print(f"[strix] WARNING: Run dir does not exist: {run_dir}", flush=True)

        if report_path.exists():
            try:
                markdown_content = report_path.read_text(encoding="utf-8")
                print(f"[strix] Processing report ({len(markdown_content)} chars)...", flush=True)
                structured_report = process_scan_report(markdown_content, target_url)
                print(f"[strix] Structured report extracted, risk: {structured_report.get('risk_level', '?')}", flush=True)
            except Exception as e:
                print(f"[strix] Warning: Report processing failed: {e}", flush=True)
        else:
            print(f"[strix] WARNING: No penetration_test_report.md found", flush=True)
            # Try to find ANY markdown report in the run dir
            if run_dir.exists():
                md_files = list(run_dir.glob("*.md"))
                if md_files:
                    print(f"[strix] Found alternative md files: {[f.name for f in md_files]}", flush=True)
                    try:
                        alt_content = md_files[0].read_text(encoding="utf-8")
                        if len(alt_content) > 200:
                            print(f"[strix] Using {md_files[0].name} as report ({len(alt_content)} chars)", flush=True)
                            structured_report = process_scan_report(alt_content, target_url)
                    except Exception as e:
                        print(f"[strix] Warning: Alt report processing failed: {e}", flush=True)

        tracer.cleanup()
        cleanup_runtime()

        print(f"[strix] === FINAL: {len(findings)} findings, structured_report={'yes' if structured_report else 'no'} ===", flush=True)

        result = {"findings": findings}
        if structured_report:
            result["structured_report"] = structured_report
        return result

    except Exception as e:
        if progress_task:
            progress_task.cancel()
        try:
            from strix.runtime import cleanup_runtime
            cleanup_runtime()
        except Exception:
            pass
        return {
            "error": "execution_failed",
            "message": str(e)[:2000],
            "findings": [],
        }


def run_strix_scan(target_url: str, scan_type: str = "quick") -> dict:
    """Sync wrapper for async scan function."""
    return asyncio.run(run_strix_scan_async(target_url, scan_type))


def parse_strix_run_dir(run_name: str) -> list[dict]:
    """Parse Strix output from strix_runs/<run_name>/."""
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
    """Parse a Strix vulnerability markdown report."""
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
    }

    # Extract title from first heading
    for line in content.split("\n"):
        if line.startswith("# "):
            finding["title"] = line[2:].strip()
            break

    # Parse sections
    sections = _split_markdown_sections(content)
    for heading, body in sections.items():
        h = heading.lower()
        if "severity" in h:
            finding["severity"] = normalize_severity(body.strip().split("\n")[0])
        elif "endpoint" in h or "target" in h:
            finding["endpoint"] = body.strip().split("\n")[0]
        elif "impact" in h:
            finding["impact"] = body.strip()
        elif "description" in h and not finding["impact"]:
            finding["impact"] = body.strip()
        elif "proof of concept" in h or "poc" in h:
            finding["poc"] = body.strip()
        elif "technical analysis" in h:
            finding["reproduction_steps"] = body.strip()
        elif "remediation" in h or "fix" in h:
            finding["fix_guidance"] = body.strip()

    # Parse inline metadata
    for line in content.split("\n")[:20]:
        s = line.strip()
        if s.startswith("- **Endpoint") or s.startswith("**Endpoint"):
            finding["endpoint"] = line.split(":", 1)[-1].strip().strip("*")
        elif s.startswith("- **Severity") or s.startswith("**Severity"):
            finding["severity"] = normalize_severity(line.split(":", 1)[-1].strip().strip("*"))

    if not finding["title"]:
        finding["title"] = md_file.stem.replace("-", " ").title()

    return finding


def _split_markdown_sections(content: str) -> dict:
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
    """Filter out non-findings. Keep anything with a real title and severity."""
    title = finding.get("title", "").strip().lower()
    sev = finding.get("severity", "").lower()

    if sev == "none" or sev == "":
        return False

    # Filter out generic non-finding titles
    non_finding_titles = (
        "no vulnerabilities", "no issues", "scan complete",
        "scan summary", "no findings", "clean",
    )
    if any(nf in title for nf in non_finding_titles):
        return False

    # If it has a meaningful title, keep it
    if title and len(title) > 3:
        return True

    # Check if any content field has real data
    for field in ("impact", "reproduction_steps", "poc"):
        val = finding.get(field, "").strip()
        if val and val.lower() not in ("n/a", "none", "no"):
            return True

    return False


def normalize_severity(severity: str) -> str:
    """Normalize severity string."""
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
