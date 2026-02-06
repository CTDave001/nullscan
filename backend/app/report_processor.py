"""
Report Processor - Extracts structured data from markdown pentest reports
Uses OpenAI GPT-5.2 with structured outputs for guaranteed schema compliance
"""

from typing import Optional
from enum import Enum
from pydantic import BaseModel
from openai import OpenAI

from app.config import settings


# ============================================================================
# SCHEMA DEFINITIONS
# ============================================================================

class RiskLevel(str, Enum):
    critical = "Critical"
    high = "High"
    medium = "Medium"
    low = "Low"
    clean = "Clean"
    indeterminate = "Indeterminate"


class Severity(str, Enum):
    critical = "Critical"
    high = "High"
    medium = "Medium"
    low = "Low"
    info = "Info"


class CategoryStatus(str, Enum):
    tested = "tested"          # Fully tested, no issues
    partial = "partial"        # Partially tested (blocked or limited)
    findings = "findings"      # Tested and found issues
    skipped = "skipped"        # Not tested


class ScanStats(BaseModel):
    """Quantitative stats from the scan"""
    endpoints_discovered: int
    endpoints_tested: int
    subdomains_found: int
    requests_sent: int
    duration_minutes: int
    technologies_identified: int


class CategoryResult(BaseModel):
    """Result for each attack category tested"""
    name: str                           # e.g., "SQL Injection"
    status: CategoryStatus
    findings_count: int
    note: Optional[str]                 # Brief note if partial/blocked


class AreaOfInterest(BaseModel):
    """
    Potential risk area identified during scan.
    For free tier: only title + teaser shown
    For paid tier: full details unlocked
    """
    title: str                          # e.g., "Redirect Parameter Handling"
    severity: Severity
    teaser: str                         # 1-2 sentence hook (free tier sees this)
    technical_detail: str               # Full technical analysis (paid only)
    affected_component: str             # e.g., "/login endpoint", "Auth flow"
    recommendation: str                 # How to fix (paid only)


class Recommendation(BaseModel):
    """Prioritized recommendation from the assessment"""
    priority: int                       # 0 = highest priority
    title: str                          # Brief title (free tier sees this)
    description: str                    # Full description (paid only)
    effort: str                         # "Low", "Medium", "High"
    impact: str                         # "Low", "Medium", "High", "Critical"


class Constraint(BaseModel):
    """Limitations or blockers encountered during scan"""
    description: str
    impact: str                         # How it affected the scan


class AttackSurface(BaseModel):
    """Discovered attack surface"""
    subdomains: list[str]
    key_routes: list[str]
    technologies: list[str]
    auth_mechanisms: list[str]
    external_services: list[str]        # Third-party integrations detected


class StructuredReport(BaseModel):
    """
    Complete structured report extracted from markdown.
    Designed for conversion optimization - free tier gets teasers,
    paid tier gets full details.
    """
    # Executive summary - truncated for free, full for paid
    executive_summary: str
    executive_summary_teaser: str       # First 2-3 sentences for free tier

    # Overall assessment
    risk_level: RiskLevel
    risk_rationale: str                 # Why this risk level

    # Quantitative data - always shown (builds trust)
    scan_stats: ScanStats

    # What was tested - always shown (builds trust)
    categories_tested: list[CategoryResult]

    # Attack surface discovered - always shown
    attack_surface: AttackSurface

    # Areas of interest / potential vulnerabilities
    # Free: title + teaser only
    # Paid: full details
    areas_of_interest: list[AreaOfInterest]

    # Recommendations
    # Free: titles only
    # Paid: full details
    recommendations: list[Recommendation]

    # Constraints / limitations - always shown (honesty builds trust)
    constraints: list[Constraint]

    # Call to action messaging
    deep_scan_value_prop: str           # Why user should get deep scan
    what_deep_scan_covers: list[str]    # What additional testing deep scan does


# ============================================================================
# EXTRACTION PROMPT
# ============================================================================

EXTRACTION_PROMPT = """You are an expert security report analyst. Your job is to extract structured data from a penetration test report markdown file.

CRITICAL INSTRUCTIONS:
1. Extract ALL information from the report - don't summarize away important details
2. Even if no confirmed vulnerabilities were found, identify "Areas of Interest" - these are potential risks, suspicious patterns, or areas that warrant deeper investigation
3. The output is used for a SaaS product with free and paid tiers:
   - Free users see: teasers, stats, what was tested, constraints
   - Paid users see: full technical details, recommendations, reproduction steps
4. Make the teasers compelling but not clickbait - they should accurately reflect the finding
5. If the scan was blocked or limited, note this in constraints but still extract what WAS found
6. Always provide actionable recommendations, even if just "conduct a more thorough assessment"

FOR AREAS OF INTEREST:
- These are NOT just confirmed vulnerabilities
- Include: suspicious patterns, potential risks, areas needing validation, architectural concerns
- Even "no vulnerabilities found" reports should have 2-3 areas of interest (e.g., "limited test coverage due to WAF", "authentication flow could not be fully tested")
- The teaser should make users want to unlock the full details

FOR RECOMMENDATIONS:
- Priority 0 = most critical / do first
- Always include at least 3 recommendations
- If scan was limited, first recommendation should be about enabling proper testing

FOR DEEP SCAN VALUE PROP:
- Explain what additional value a longer, deeper scan would provide
- Be specific about what couldn't be tested in the quick scan

Be thorough. The user paid for this scan and deserves comprehensive output."""


# ============================================================================
# PROCESSOR FUNCTION
# ============================================================================

def extract_structured_report(markdown_report: str) -> dict:
    """
    Extract structured data from a markdown penetration test report.
    Uses OpenAI GPT-5.2 with structured outputs for guaranteed schema compliance.

    Args:
        markdown_report: The raw markdown report content

    Returns:
        Dictionary matching the StructuredReport schema
    """
    client = OpenAI(api_key=settings.openai_api_key)

    response = client.responses.parse(
        model="gpt-5.2",  # Using GPT-5.2 as requested
        input=[
            {"role": "system", "content": EXTRACTION_PROMPT},
            {"role": "user", "content": f"Extract structured data from this penetration test report:\n\n{markdown_report}"},
        ],
        text_format=StructuredReport,
    )

    # Handle potential refusal
    if hasattr(response, 'output') and response.output:
        content = response.output[0].content[0]
        if hasattr(content, 'refusal') and content.refusal:
            raise ValueError(f"Model refused to process report: {content.refusal}")

    # Get the parsed output
    result = response.output_parsed

    if result is None:
        raise ValueError("Failed to parse structured output from model")

    return result.model_dump()


# ============================================================================
# FALLBACK FOR FAILED EXTRACTION
# ============================================================================

def create_fallback_report(target_url: str, error_msg: str) -> dict:
    """
    Create a minimal structured report when extraction fails.
    This ensures the UI always has something to display.
    """
    return {
        "executive_summary": f"Security assessment of {target_url} was completed. Please review the detailed findings below.",
        "executive_summary_teaser": f"Security assessment of {target_url} completed.",
        "risk_level": "Indeterminate",
        "risk_rationale": "Unable to fully process scan results. Manual review recommended.",
        "scan_stats": {
            "endpoints_discovered": 0,
            "endpoints_tested": 0,
            "subdomains_found": 0,
            "requests_sent": 0,
            "duration_minutes": 0,
            "technologies_identified": 0,
        },
        "categories_tested": [
            {"name": "SQL Injection", "status": "skipped", "findings_count": 0, "note": None},
            {"name": "Cross-Site Scripting (XSS)", "status": "skipped", "findings_count": 0, "note": None},
            {"name": "Authentication Bypass", "status": "skipped", "findings_count": 0, "note": None},
            {"name": "IDOR / Access Control", "status": "skipped", "findings_count": 0, "note": None},
            {"name": "SSRF", "status": "skipped", "findings_count": 0, "note": None},
            {"name": "Directory Traversal", "status": "skipped", "findings_count": 0, "note": None},
            {"name": "Security Headers", "status": "skipped", "findings_count": 0, "note": None},
        ],
        "attack_surface": {
            "subdomains": [],
            "key_routes": [],
            "technologies": [],
            "auth_mechanisms": [],
            "external_services": [],
        },
        "areas_of_interest": [
            {
                "title": "Report Processing Error",
                "severity": "Info",
                "teaser": "The scan completed but results could not be fully processed.",
                "technical_detail": f"Error during report extraction: {error_msg}",
                "affected_component": "Report generation",
                "recommendation": "Contact support or retry the scan.",
            }
        ],
        "recommendations": [
            {
                "priority": 0,
                "title": "Retry scan or contact support",
                "description": "The scan results could not be fully processed. Please retry or contact support for assistance.",
                "effort": "Low",
                "impact": "High",
            }
        ],
        "constraints": [
            {
                "description": "Report extraction failed",
                "impact": f"Full results may not be displayed: {error_msg}",
            }
        ],
        "deep_scan_value_prop": "A deep scan provides 1-4 hours of thorough testing across all vulnerability categories with detailed technical analysis.",
        "what_deep_scan_covers": [
            "Extended reconnaissance and enumeration",
            "Comprehensive authentication testing",
            "Full API endpoint analysis",
            "Business logic vulnerability testing",
            "Detailed remediation guidance",
        ],
    }


# ============================================================================
# MAIN PROCESSING FUNCTION
# ============================================================================

def process_scan_report(markdown_report: str, target_url: str) -> dict:
    """
    Main entry point for processing a scan report.
    Handles errors gracefully with fallback.

    Args:
        markdown_report: The raw markdown report content
        target_url: The target URL that was scanned

    Returns:
        Dictionary matching the StructuredReport schema
    """
    try:
        return extract_structured_report(markdown_report)
    except Exception as e:
        print(f"[ReportProcessor] Error extracting structured report: {e}")
        return create_fallback_report(target_url, str(e))
