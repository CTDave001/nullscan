"""
PDF Report Generator - Generates professional pentest report PDFs from scan results.
Uses WeasyPrint to convert styled HTML into PDF bytes.
"""

from datetime import datetime
from typing import Any, Optional

from weasyprint import HTML


# =============================================================================
# SEVERITY / RISK COLOR MAP
# =============================================================================

SEVERITY_COLORS = {
    "Critical": "#ef4444",
    "High": "#f97316",
    "Medium": "#eab308",
    "Low": "#22c55e",
    "Info": "#3b82f6",
}

RISK_LEVEL_COLORS = {
    "Critical": "#ef4444",
    "High": "#f97316",
    "Medium": "#eab308",
    "Low": "#22c55e",
    "Clean": "#22c55e",
    "Indeterminate": "#6b7280",
}

CATEGORY_STATUS_LABELS = {
    "tested": ("Tested - Clean", "#22c55e"),
    "partial": ("Partially Tested", "#eab308"),
    "findings": ("Findings Identified", "#ef4444"),
    "skipped": ("Not Tested", "#6b7280"),
}


# =============================================================================
# HTML HELPERS
# =============================================================================

def _esc(value: Any) -> str:
    """Escape a value for safe HTML embedding."""
    if value is None:
        return ""
    text = str(value)
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _format_datetime(value: Any) -> str:
    """Format a datetime value for display."""
    if value is None:
        return "N/A"
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return str(value)
    if isinstance(value, datetime):
        return value.strftime("%B %d, %Y at %H:%M UTC")
    return str(value)


def _severity_color(severity: str) -> str:
    """Return the hex color for a severity level."""
    return SEVERITY_COLORS.get(severity, "#6b7280")


def _risk_color(risk_level: str) -> str:
    """Return the hex color for a risk level."""
    return RISK_LEVEL_COLORS.get(risk_level, "#6b7280")


def _get(data: dict, key: str, default: Any = None) -> Any:
    """Safely get a nested value from a dict."""
    if data is None:
        return default
    return data.get(key, default)


# =============================================================================
# SECTION BUILDERS
# =============================================================================

def _build_header_section(scan_data: dict, results: dict) -> str:
    """Build the report header with logo, title, and meta information."""
    structured = _get(results, "structured_report")
    risk_level = (
        _get(structured, "risk_level", "Indeterminate")
        if structured
        else "Indeterminate"
    )
    risk_color = _risk_color(risk_level)
    paid_tier = _get(scan_data, "paid_tier", "free")
    scan_type_label = (paid_tier or "free").replace("_", " ").title()

    return f"""
    <div class="header">
        <div class="logo">NULLSCAN</div>
        <div class="subtitle">Security Penetration Test Report</div>
    </div>

    <div class="meta-grid">
        <div class="meta-item">
            <div class="meta-label">Target</div>
            <div class="meta-value">{_esc(_get(scan_data, 'target_url', 'N/A'))}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Scan Date</div>
            <div class="meta-value">{_format_datetime(_get(scan_data, 'created_at'))}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Scan Type</div>
            <div class="meta-value">{_esc(scan_type_label)}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Risk Level</div>
            <div class="meta-value" style="color: {risk_color}; font-weight: bold;">
                {_esc(risk_level)}
            </div>
        </div>
    </div>
    """


def _build_executive_summary(structured: Optional[dict]) -> str:
    """Build the executive summary section."""
    if not structured:
        return ""
    summary = _get(structured, "executive_summary", "")
    if not summary:
        return ""
    rationale = _get(structured, "risk_rationale", "")
    rationale_html = ""
    if rationale:
        rationale_html = f"""
        <div class="rationale-box">
            <strong>Risk Rationale:</strong> {_esc(rationale)}
        </div>
        """
    return f"""
    <div class="section">
        <h2 class="section-title">Executive Summary</h2>
        <p>{_esc(summary)}</p>
        {rationale_html}
    </div>
    """


def _build_scan_stats(structured: Optional[dict]) -> str:
    """Build the scan statistics section."""
    if not structured:
        return ""
    stats = _get(structured, "scan_stats")
    if not stats:
        return ""
    return f"""
    <div class="section">
        <h2 class="section-title">Scan Statistics</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">{_esc(_get(stats, 'endpoints_discovered', 0))}</div>
                <div class="stat-label">Endpoints Discovered</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{_esc(_get(stats, 'endpoints_tested', 0))}</div>
                <div class="stat-label">Endpoints Tested</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{_esc(_get(stats, 'subdomains_found', 0))}</div>
                <div class="stat-label">Subdomains Found</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{_esc(_get(stats, 'requests_sent', 0))}</div>
                <div class="stat-label">Requests Sent</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{_esc(_get(stats, 'duration_minutes', 0))}m</div>
                <div class="stat-label">Duration</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{_esc(_get(stats, 'technologies_identified', 0))}</div>
                <div class="stat-label">Technologies Identified</div>
            </div>
        </div>
    </div>
    """


def _build_categories_tested(structured: Optional[dict]) -> str:
    """Build the categories tested section."""
    if not structured:
        return ""
    categories = _get(structured, "categories_tested")
    if not categories:
        return ""

    rows = ""
    for cat in categories:
        status_key = _get(cat, "status", "skipped")
        label, color = CATEGORY_STATUS_LABELS.get(
            status_key, ("Unknown", "#6b7280")
        )
        note = _get(cat, "note", "")
        note_html = f' <span class="note">({_esc(note)})</span>' if note else ""
        findings_count = _get(cat, "findings_count", 0)
        rows += f"""
        <tr>
            <td>{_esc(_get(cat, 'name', ''))}</td>
            <td style="color: {color};">{_esc(label)}{note_html}</td>
            <td style="text-align: center;">{findings_count}</td>
        </tr>
        """

    return f"""
    <div class="section">
        <h2 class="section-title">Testing Coverage</h2>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Status</th>
                    <th style="text-align: center;">Findings</th>
                </tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
    </div>
    """


def _build_attack_surface(structured: Optional[dict]) -> str:
    """Build the attack surface section."""
    if not structured:
        return ""
    surface = _get(structured, "attack_surface")
    if not surface:
        return ""

    sections_html = ""

    subdomains = _get(surface, "subdomains", [])
    if subdomains:
        items = "".join(f"<li>{_esc(s)}</li>" for s in subdomains)
        sections_html += f"""
        <div class="subsection">
            <h3>Subdomains Discovered</h3>
            <ul>{items}</ul>
        </div>
        """

    technologies = _get(surface, "technologies", [])
    if technologies:
        tags = "".join(
            f'<span class="tech-tag">{_esc(t)}</span>' for t in technologies
        )
        sections_html += f"""
        <div class="subsection">
            <h3>Technologies Identified</h3>
            <div class="tech-tags">{tags}</div>
        </div>
        """

    key_routes = _get(surface, "key_routes", [])
    if key_routes:
        items = "".join(f"<li><code>{_esc(r)}</code></li>" for r in key_routes)
        sections_html += f"""
        <div class="subsection">
            <h3>Key Routes</h3>
            <ul>{items}</ul>
        </div>
        """

    auth_mechs = _get(surface, "auth_mechanisms", [])
    if auth_mechs:
        items = "".join(f"<li>{_esc(a)}</li>" for a in auth_mechs)
        sections_html += f"""
        <div class="subsection">
            <h3>Authentication Mechanisms</h3>
            <ul>{items}</ul>
        </div>
        """

    ext_services = _get(surface, "external_services", [])
    if ext_services:
        items = "".join(f"<li>{_esc(e)}</li>" for e in ext_services)
        sections_html += f"""
        <div class="subsection">
            <h3>External Services</h3>
            <ul>{items}</ul>
        </div>
        """

    if not sections_html:
        return ""

    return f"""
    <div class="section">
        <h2 class="section-title">Attack Surface</h2>
        {sections_html}
    </div>
    """


def _build_findings_structured(structured: dict) -> str:
    """Build findings section from structured_report areas_of_interest."""
    areas = _get(structured, "areas_of_interest", [])
    if not areas:
        return """
        <div class="section">
            <h2 class="section-title">Areas of Interest</h2>
            <p>No specific areas of interest were identified during this scan.</p>
        </div>
        """

    cards = ""
    for i, area in enumerate(areas, 1):
        severity = _get(area, "severity", "Info")
        color = _severity_color(severity)
        title = _get(area, "title", "Untitled Finding")
        affected = _get(area, "affected_component", "N/A")
        technical = _get(area, "technical_detail", "")
        recommendation = _get(area, "recommendation", "")

        tech_html = ""
        if technical:
            tech_html = f"""
            <div class="finding-detail">
                <div class="finding-detail-label">Technical Detail</div>
                <p>{_esc(technical)}</p>
            </div>
            """

        rec_html = ""
        if recommendation:
            rec_html = f"""
            <div class="finding-detail">
                <div class="finding-detail-label">Recommendation</div>
                <p>{_esc(recommendation)}</p>
            </div>
            """

        cards += f"""
        <div class="finding-card">
            <div class="finding-header">
                <span class="finding-number">#{i}</span>
                <span class="finding-title">{_esc(title)}</span>
                <span class="severity-badge" style="background-color: {color};">
                    {_esc(severity)}
                </span>
            </div>
            <div class="finding-meta">
                <strong>Affected Component:</strong> {_esc(affected)}
            </div>
            {tech_html}
            {rec_html}
        </div>
        """

    return f"""
    <div class="section">
        <h2 class="section-title">Areas of Interest</h2>
        {cards}
    </div>
    """


def _build_findings_legacy(findings: list) -> str:
    """Build findings section from legacy findings list."""
    if not findings:
        return """
        <div class="section">
            <h2 class="section-title">Findings</h2>
            <p>No findings were identified during this scan.</p>
        </div>
        """

    cards = ""
    for i, finding in enumerate(findings, 1):
        severity = _get(finding, "severity", "Info")
        color = _severity_color(severity)
        title = _get(finding, "title", "Untitled Finding")
        endpoint = _get(finding, "endpoint", "N/A")
        impact = _get(finding, "impact", "")
        fix = _get(finding, "fix_guidance", "")
        owasp = _get(finding, "owasp_category", "")
        reproduction = _get(finding, "reproduction_steps", "")
        poc = _get(finding, "poc", "")

        impact_html = ""
        if impact:
            impact_html = f"""
            <div class="finding-detail">
                <div class="finding-detail-label">Impact</div>
                <p>{_esc(impact)}</p>
            </div>
            """

        owasp_html = ""
        if owasp:
            owasp_html = f"""
            <div class="finding-detail">
                <div class="finding-detail-label">OWASP Category</div>
                <p>{_esc(owasp)}</p>
            </div>
            """

        repro_html = ""
        if reproduction:
            repro_html = f"""
            <div class="finding-detail">
                <div class="finding-detail-label">Reproduction Steps</div>
                <pre>{_esc(reproduction)}</pre>
            </div>
            """

        poc_html = ""
        if poc:
            poc_html = f"""
            <div class="finding-detail">
                <div class="finding-detail-label">Proof of Concept</div>
                <pre>{_esc(poc)}</pre>
            </div>
            """

        fix_html = ""
        if fix:
            fix_html = f"""
            <div class="finding-detail">
                <div class="finding-detail-label">Recommendation</div>
                <p>{_esc(fix)}</p>
            </div>
            """

        cards += f"""
        <div class="finding-card">
            <div class="finding-header">
                <span class="finding-number">#{i}</span>
                <span class="finding-title">{_esc(title)}</span>
                <span class="severity-badge" style="background-color: {color};">
                    {_esc(severity)}
                </span>
            </div>
            <div class="finding-meta">
                <strong>Endpoint:</strong> <code>{_esc(endpoint)}</code>
            </div>
            {owasp_html}
            {impact_html}
            {repro_html}
            {poc_html}
            {fix_html}
        </div>
        """

    return f"""
    <div class="section">
        <h2 class="section-title">Findings</h2>
        {cards}
    </div>
    """


def _build_recommendations(structured: Optional[dict]) -> str:
    """Build the recommendations section."""
    if not structured:
        return ""
    recs = _get(structured, "recommendations", [])
    if not recs:
        return ""

    sorted_recs = sorted(recs, key=lambda r: _get(r, "priority", 999))
    rows = ""
    for rec in sorted_recs:
        priority = _get(rec, "priority", 0)
        title = _get(rec, "title", "")
        description = _get(rec, "description", "")
        effort = _get(rec, "effort", "N/A")
        impact = _get(rec, "impact", "N/A")

        desc_html = f"<p>{_esc(description)}</p>" if description else ""

        rows += f"""
        <div class="rec-card">
            <div class="rec-header">
                <span class="rec-priority">P{priority}</span>
                <span class="rec-title">{_esc(title)}</span>
            </div>
            {desc_html}
            <div class="rec-meta">
                <span><strong>Effort:</strong> {_esc(effort)}</span>
                <span><strong>Impact:</strong> {_esc(impact)}</span>
            </div>
        </div>
        """

    return f"""
    <div class="section">
        <h2 class="section-title">Recommendations</h2>
        {rows}
    </div>
    """


def _build_constraints(structured: Optional[dict]) -> str:
    """Build the constraints / limitations section."""
    if not structured:
        return ""
    constraints = _get(structured, "constraints", [])
    if not constraints:
        return ""

    items = ""
    for c in constraints:
        desc = _get(c, "description", "")
        impact = _get(c, "impact", "")
        items += f"""
        <div class="constraint-item">
            <strong>{_esc(desc)}</strong>
            {f'<p>{_esc(impact)}</p>' if impact else ''}
        </div>
        """

    return f"""
    <div class="section">
        <h2 class="section-title">Constraints &amp; Limitations</h2>
        {items}
    </div>
    """


def _build_footer() -> str:
    """Build the report footer."""
    year = datetime.now().year
    return f"""
    <div class="footer">
        <div class="footer-line"></div>
        <p>Generated by <strong>Nullscan</strong> &mdash; nullscan.io</p>
        <p class="footer-small">
            &copy; {year} Nullscan. This report is confidential and intended
            solely for the authorized recipient.
        </p>
    </div>
    """


# =============================================================================
# CSS STYLES
# =============================================================================

REPORT_CSS = """
@page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    background-color: #09090b;

    @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-family: Courier, monospace;
        font-size: 8pt;
        color: #71717a;
    }
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Courier, 'Courier New', monospace;
    font-size: 10pt;
    line-height: 1.6;
    color: #fafafa;
    background-color: #09090b;
}

/* Header */
.header {
    text-align: center;
    padding-bottom: 16px;
    margin-bottom: 24px;
    border-bottom: 2px solid #06b6d4;
}

.logo {
    font-size: 28pt;
    font-weight: bold;
    color: #06b6d4;
    letter-spacing: 6px;
    margin-bottom: 4px;
}

.subtitle {
    font-size: 13pt;
    color: #a1a1aa;
    letter-spacing: 1px;
}

/* Meta grid */
.meta-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 28px;
}

.meta-item {
    flex: 1 1 45%;
    background-color: #18181b;
    border: 1px solid #27272a;
    border-radius: 6px;
    padding: 10px 14px;
}

.meta-label {
    font-size: 8pt;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
}

.meta-value {
    font-size: 10pt;
    color: #fafafa;
    word-break: break-all;
}

/* Sections */
.section {
    margin-bottom: 28px;
    page-break-inside: avoid;
}

.section-title {
    font-size: 14pt;
    color: #06b6d4;
    border-bottom: 1px solid #27272a;
    padding-bottom: 6px;
    margin-bottom: 14px;
    letter-spacing: 1px;
}

.subsection {
    margin-bottom: 16px;
}

.subsection h3 {
    font-size: 10pt;
    color: #a1a1aa;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

p {
    margin-bottom: 8px;
}

/* Rationale box */
.rationale-box {
    background-color: #18181b;
    border-left: 3px solid #06b6d4;
    padding: 10px 14px;
    margin-top: 10px;
    border-radius: 0 6px 6px 0;
}

/* Stats grid */
.stats-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.stat-card {
    flex: 1 1 30%;
    background-color: #18181b;
    border: 1px solid #27272a;
    border-radius: 6px;
    padding: 12px;
    text-align: center;
}

.stat-number {
    font-size: 18pt;
    font-weight: bold;
    color: #06b6d4;
}

.stat-label {
    font-size: 8pt;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
}

th {
    background-color: #18181b;
    color: #06b6d4;
    text-align: left;
    padding: 8px 12px;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 2px solid #27272a;
}

td {
    padding: 8px 12px;
    border-bottom: 1px solid #1e1e22;
    font-size: 9pt;
}

tr:nth-child(even) {
    background-color: #111114;
}

.note {
    font-size: 8pt;
    color: #71717a;
    font-style: italic;
}

/* Finding cards */
.finding-card {
    background-color: #18181b;
    border: 1px solid #27272a;
    border-radius: 6px;
    padding: 14px;
    margin-bottom: 14px;
    page-break-inside: avoid;
}

.finding-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.finding-number {
    color: #71717a;
    font-size: 9pt;
    min-width: 24px;
}

.finding-title {
    flex: 1;
    font-weight: bold;
    font-size: 11pt;
    color: #fafafa;
}

.severity-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 4px;
    color: #09090b;
    font-size: 8pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.finding-meta {
    font-size: 9pt;
    color: #a1a1aa;
    margin-bottom: 8px;
}

.finding-detail {
    margin-top: 10px;
}

.finding-detail-label {
    font-size: 8pt;
    color: #06b6d4;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
}

.finding-detail p {
    font-size: 9pt;
    color: #d4d4d8;
}

pre {
    background-color: #111114;
    border: 1px solid #27272a;
    border-radius: 4px;
    padding: 10px;
    font-size: 8pt;
    color: #d4d4d8;
    white-space: pre-wrap;
    word-break: break-all;
    overflow: hidden;
}

code {
    background-color: #111114;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 9pt;
    color: #06b6d4;
}

/* Tech tags */
.tech-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.tech-tag {
    background-color: #06b6d4;
    color: #09090b;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: bold;
}

/* Lists */
ul {
    padding-left: 20px;
    margin-bottom: 8px;
}

li {
    margin-bottom: 3px;
    font-size: 9pt;
    color: #d4d4d8;
}

/* Recommendation cards */
.rec-card {
    background-color: #18181b;
    border: 1px solid #27272a;
    border-radius: 6px;
    padding: 12px 14px;
    margin-bottom: 10px;
    page-break-inside: avoid;
}

.rec-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
}

.rec-priority {
    background-color: #06b6d4;
    color: #09090b;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: bold;
}

.rec-title {
    font-weight: bold;
    font-size: 10pt;
    color: #fafafa;
}

.rec-card p {
    font-size: 9pt;
    color: #d4d4d8;
    margin-bottom: 6px;
}

.rec-meta {
    display: flex;
    gap: 20px;
    font-size: 8pt;
    color: #a1a1aa;
}

/* Constraint items */
.constraint-item {
    background-color: #18181b;
    border-left: 3px solid #eab308;
    padding: 10px 14px;
    margin-bottom: 10px;
    border-radius: 0 6px 6px 0;
}

.constraint-item strong {
    color: #fafafa;
    font-size: 10pt;
}

.constraint-item p {
    font-size: 9pt;
    color: #a1a1aa;
    margin-top: 4px;
}

/* Footer */
.footer {
    margin-top: 40px;
    text-align: center;
}

.footer-line {
    border-top: 1px solid #27272a;
    margin-bottom: 14px;
}

.footer p {
    color: #71717a;
    font-size: 9pt;
}

.footer-small {
    font-size: 7pt;
    color: #52525b;
    margin-top: 4px;
}
"""


# =============================================================================
# MAIN GENERATOR
# =============================================================================

def generate_pdf_report(scan_data: dict, results: dict) -> bytes:
    """
    Generate a professional PDF penetration test report.

    Args:
        scan_data: Dictionary with scan metadata. Expected keys:
            - id: Scan identifier
            - target_url: The URL that was scanned
            - email: Recipient email
            - paid_tier: Tier string (e.g. "free", "quick_scan", "deep_scan")
            - created_at: Scan start timestamp (str or datetime)
            - completed_at: Scan completion timestamp (str or datetime)

        results: Dictionary with scan results. Expected keys:
            - findings: List of finding dicts (legacy format)
            - structured_report: Optional dict matching StructuredReport schema

    Returns:
        PDF file content as bytes.
    """
    structured = _get(results, "structured_report")
    findings = _get(results, "findings", [])

    # Build each section of the report
    header_html = _build_header_section(scan_data, results)
    summary_html = _build_executive_summary(structured)
    stats_html = _build_scan_stats(structured)
    categories_html = _build_categories_tested(structured)
    surface_html = _build_attack_surface(structured)

    # Use structured areas_of_interest when available, otherwise fall back
    # to the legacy findings list.
    if structured and _get(structured, "areas_of_interest"):
        findings_html = _build_findings_structured(structured)
    else:
        findings_html = _build_findings_legacy(findings)

    recommendations_html = _build_recommendations(structured)
    constraints_html = _build_constraints(structured)
    footer_html = _build_footer()

    # Assemble complete HTML document
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
    {REPORT_CSS}
    </style>
</head>
<body>
    {header_html}
    {summary_html}
    {stats_html}
    {categories_html}
    {surface_html}
    {findings_html}
    {recommendations_html}
    {constraints_html}
    {footer_html}
</body>
</html>"""

    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes
