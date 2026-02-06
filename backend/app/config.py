from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./scanner.db"
    resend_api_key: str = ""
    email_from: str = "Nullscan <noreply@nullscan.io>"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    frontend_url: str = "http://localhost:3000"
    llm_api_key: str = ""
    strix_path: str = "strix"
    openai_api_key: str = ""  # For report processing with structured outputs

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

    # Per-tier cost limits (USD) — scan wraps up when exceeded
    tier_quick_cost_limit: float = 4.0
    tier_pro_cost_limit: float = 150.0
    tier_deep_cost_limit: float = 600.0
    cors_origins: str = "https://nullscan.io,https://www.nullscan.io"
    unlimited_emails: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
