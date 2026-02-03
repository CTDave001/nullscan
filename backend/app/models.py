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


class ScanResultFinding(BaseModel):
    title: str
    severity: str  # Critical, High, Medium, Low
    endpoint: str
    impact: str
    owasp_category: Optional[str] = None
    reproduction_steps: Optional[str] = None
    poc: Optional[str] = None
    fix_guidance: Optional[str] = None


class ScanResults(BaseModel):
    scan_id: str
    target_url: str
    risk_level: str  # Critical, High, Medium, Low, Clean
    findings: list[ScanResultFinding]
    scan_type: str
    completed_at: datetime
    paid_tier: Optional[str] = None
