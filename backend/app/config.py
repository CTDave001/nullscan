from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./scanner.db"
    resend_api_key: str = ""
    email_from: str = "Nullscan <noreply@nullscan.io>"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    frontend_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"  # Public API URL for email links
    llm_api_key: str = ""
    strix_path: str = "strix"
    openai_api_key: str = ""  # For report processing with structured outputs
    # Model for the report-extraction step (OpenAI SDK, separate from the scan LLM). Kept on
    # gpt-5.2 by default; set REPORT_LLM=gpt-5.6-luna once that id is confirmed to cut cost.
    report_llm: str = "gpt-5.2"
    # Route scans through the headless-CLI adapter (strix-agent >= 1.0). Default off until
    # validated against a live 1.0.x + Docker host. See app/strix_adapter.py.
    strix_use_cli: bool = False

    # Per-tier scan configuration
    tier_quick_llm: str = "openai/gpt-5.2"
    tier_quick_iterations: int = 50
    tier_quick_mode: str = "quick"

    tier_pro_llm: str = "openai/gpt-5.2"
    tier_pro_iterations: int = 300
    tier_pro_mode: str = "standard"

    tier_deep_llm: str = "openai/gpt-5.2"
    tier_deep_iterations: int = 500
    tier_deep_mode: str = "deep"

    # Admin API key for monitoring endpoints
    admin_api_key: str = ""

    # ---- Marketing / drip re-engagement campaign ----
    # Master kill switch. While False, the drip scheduler runs but sends NOTHING. Flip to True
    # only after the go.nullscan.io sending domain is verified in Resend and a test send passes.
    marketing_emails_enabled: bool = False
    # Sender for marketing mail — a SEPARATE subdomain so a reputation dip here never drags down
    # transactional email (receipts, scan-complete) sent from nullscan.io.
    marketing_email_from: str = "Nullscan <hello@go.nullscan.io>"
    # HMAC secret for signing unsubscribe + promo links. Falls back to the Stripe key if unset.
    marketing_secret: str = ""
    # Postal address for the CAN-SPAM footer (required by law on marketing email).
    marketing_postal_address: str = "Nullscan"
    # Discounted "unlock" price (cents) offered in the drip's step-3 email. Full price is $39.
    promo_price_unlock: int = 2900

    # Per-tier cost limits (USD) — scan wraps up when exceeded
    tier_quick_cost_limit: float = 4.0
    tier_pro_cost_limit: float = 150.0
    tier_deep_cost_limit: float = 600.0

    # Per-tier agent cap and wait timeout
    tier_quick_max_agents: int = 15
    tier_quick_wait_timeout: int = 120
    tier_pro_max_agents: int = 25
    tier_pro_wait_timeout: int = 300
    tier_deep_max_agents: int = 40
    tier_deep_wait_timeout: int = 600
    cors_origins: str = "https://nullscan.io,https://www.nullscan.io"
    unlimited_emails: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"  # Don't crash on unrelated env vars (Railway/CI inject many)


settings = Settings()
