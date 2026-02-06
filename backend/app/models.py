from pydantic import BaseModel, EmailStr, HttpUrl
from datetime import datetime
from typing import Optional


class ScanCreate(BaseModel):
    email: EmailStr
    target_url: HttpUrl
    consent: bool


class ScanResponse(BaseModel):
    id: str
    email: str
    target_url: str
    status: str
    scan_type: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    paid_tier: Optional[str] = None
    parent_scan_id: Optional[str] = None


class ScanResultFinding(BaseModel):
    title: str
    severity: str  # Critical, High, Medium, Low
    endpoint: str
    impact: str
    owasp_category: Optional[str] = None
    reproduction_steps: Optional[str] = None
    poc: Optional[str] = None
    fix_guidance: Optional[str] = None


# ============================================================================
# STRUCTURED REPORT RESPONSE MODELS
# ============================================================================

class ScanStatsResponse(BaseModel):
    endpoints_discovered: int
    endpoints_tested: int
    subdomains_found: int
    requests_sent: int
    duration_minutes: int
    technologies_identified: int


class CategoryResultResponse(BaseModel):
    name: str
    status: str  # tested, partial, findings, skipped
    findings_count: int
    note: Optional[str] = None


class AreaOfInterestResponse(BaseModel):
    """Free tier: title + teaser only. Paid tier: full details."""
    title: str
    severity: str
    teaser: str
    affected_component: str
    # Paid-only fields (None for free users)
    technical_detail: Optional[str] = None
    recommendation: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Free tier: title only. Paid tier: full details."""
    priority: int
    title: str
    # Paid-only fields (None for free users)
    description: Optional[str] = None
    effort: Optional[str] = None
    impact: Optional[str] = None


class ConstraintResponse(BaseModel):
    description: str
    impact: str


class AttackSurfaceResponse(BaseModel):
    subdomains: list[str]
    key_routes: list[str]
    technologies: list[str]
    auth_mechanisms: list[str]
    external_services: list[str]


class StructuredReportResponse(BaseModel):
    """Complete structured report with tier-based filtering applied."""
    # Executive summary
    executive_summary: str  # Teaser for free, full for paid

    # Overall assessment - always shown
    risk_level: str
    risk_rationale: str

    # Stats - always shown (builds trust)
    scan_stats: ScanStatsResponse

    # What was tested - always shown (builds trust)
    categories_tested: list[CategoryResultResponse]

    # Attack surface - always shown
    attack_surface: AttackSurfaceResponse

    # Areas of interest - filtered by tier
    areas_of_interest: list[AreaOfInterestResponse]

    # Recommendations - filtered by tier
    recommendations: list[RecommendationResponse]

    # Constraints - always shown (honesty builds trust)
    constraints: list[ConstraintResponse]

    # Upsell messaging - only shown to free users
    deep_scan_value_prop: Optional[str] = None
    what_deep_scan_covers: Optional[list[str]] = None


class ScanResults(BaseModel):
    scan_id: str
    target_url: str
    risk_level: str  # Critical, High, Medium, Low, Clean, Indeterminate
    findings: list[ScanResultFinding]
    scan_type: str
    completed_at: datetime
    paid_tier: Optional[str] = None
    # New structured report field
    structured_report: Optional[StructuredReportResponse] = None
