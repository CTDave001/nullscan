"""
Apply Nullscan patches to the installed strix-agent package.
Run this after `pip install strix-agent` on any new environment.

Patches:
1. state.py - Configurable wait timeout via STRIX_AGENT_WAIT_TIMEOUT env var
2. agents_graph_actions.py - Agent cap via STRIX_MAX_AGENTS env var
3. nullscan_rules.md - Custom verification rules to reduce false positives
"""

import importlib
import os
import sys
from pathlib import Path


def get_strix_path():
    """Find the installed strix package location."""
    try:
        import strix
        return Path(strix.__file__).parent
    except ImportError:
        print("ERROR: strix-agent is not installed. Run: pip install strix-agent")
        sys.exit(1)


def patch_state_timeout(strix_path: Path):
    """Patch state.py to use configurable wait timeout instead of hardcoded 600s."""
    state_file = strix_path / "agents" / "state.py"
    content = state_file.read_text(encoding="utf-8")

    old = "return elapsed > 600"
    new = 'timeout = int(__import__("os").environ.get("STRIX_AGENT_WAIT_TIMEOUT", "120"))\n        return elapsed > timeout'

    if old not in content:
        if "STRIX_AGENT_WAIT_TIMEOUT" in content:
            print("  [skip] state.py - already patched")
            return
        print("  [WARN] state.py - could not find target line, skipping")
        return

    content = content.replace(old, new)
    state_file.write_text(content, encoding="utf-8")
    print("  [ok] state.py - configurable wait timeout")


def patch_agent_cap(strix_path: Path):
    """Patch agents_graph_actions.py to add hard cap on concurrent agents."""
    actions_file = strix_path / "tools" / "agents_graph" / "agents_graph_actions.py"
    content = actions_file.read_text(encoding="utf-8")

    if "STRIX_MAX_AGENTS" in content:
        print("  [skip] agents_graph_actions.py - already patched")
        return

    # Find the insertion point: right after "parent_id = agent_state.agent_id"
    marker = "parent_id = agent_state.agent_id"
    if marker not in content:
        print("  [WARN] agents_graph_actions.py - could not find insertion point, skipping")
        return

    patch_code = '''parent_id = agent_state.agent_id

        # Hard cap on concurrent agents to prevent runaway spawning
        import os
        max_agents = int(os.environ.get("STRIX_MAX_AGENTS", "20"))
        active_statuses = ("running", "waiting", "stopping")
        current_count = sum(
            1 for n in _agent_graph["nodes"].values()
            if n.get("status") in active_statuses
        )
        if current_count >= max_agents:
            return {
                "success": False,
                "error": (
                    f"Agent limit reached ({current_count}/{max_agents}). "
                    f"Wait for existing agents to finish before creating new ones. "
                    f"Use view_agent_graph to check agent status."
                ),
                "agent_id": None,
            }'''

    content = content.replace(marker, patch_code, 1)
    actions_file.write_text(content, encoding="utf-8")
    print("  [ok] agents_graph_actions.py - agent cap")


def add_nullscan_rules(strix_path: Path):
    """Add the nullscan verification rules skill."""
    skills_dir = strix_path / "skills"
    skills_dir.mkdir(exist_ok=True)

    rules_file = skills_dir / "nullscan_rules.md"
    rules_content = """---
name: nullscan_rules
description: Nullscan platform rules for agent efficiency and finding verification
---

# Nullscan Scan Rules

These rules are MANDATORY and override any conflicting behavior. They apply for the ENTIRE scan duration.

## Agent Spawning Rules

- Check view_agent_graph before creating new agents to see how many exist.
- Do NOT spawn a new agent to retry the SAME test on the SAME endpoint. If it found nothing, accept it and move on.
- If an agent finishes with no findings, do NOT respawn it. The endpoint is clean for that test.
- When all endpoints have been tested for all categories, finish the scan. Do not loop.

## Verification Rules — READ EVERY TIME BEFORE REPORTING

You MUST verify every finding before reporting. False positives are UNACCEPTABLE.

- A 200 status code does NOT mean an attack worked. Read the response BODY.
- For XSS: The payload MUST appear UNESCAPED in the response HTML. If escaped to &lt; it is NOT vulnerable.
- For SQLi: You need database errors, different response lengths, or measurable time delays. A normal 200 is NOT SQLi.
- For Auth bypass: A 200 on /login does NOT mean success. Check for session tokens, cookies, or actual user data in response.
- For SSRF: Check if the response contains actual internal data. A normal page is NOT SSRF.
- For IDOR: You must show that changing an ID returned DIFFERENT user data. Getting your own data back is NOT IDOR.

DO NOT report a vulnerability unless you have CONCRETE EVIDENCE in the response body. If unsure, do NOT report it.
"""
    rules_file.write_text(rules_content, encoding="utf-8")
    print("  [ok] nullscan_rules.md - verification rules")


def main():
    print("Applying Nullscan patches to strix-agent...")
    strix_path = get_strix_path()
    print(f"  Strix location: {strix_path}")

    patch_state_timeout(strix_path)
    patch_agent_cap(strix_path)
    add_nullscan_rules(strix_path)

    print("Done. All patches applied.")


if __name__ == "__main__":
    main()
