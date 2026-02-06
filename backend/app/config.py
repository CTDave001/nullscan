from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./scanner.db"
    resend_api_key: str = ""
    email_from: str = "Nullscan <noreply@nullscan.io>"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    frontend_url: str = "http://localhost:3000"
    strix_llm_quick: str = "openai/gpt-4o-mini"
    strix_llm_deep: str = "anthropic/claude-sonnet-4-5"
    llm_api_key: str = ""
    strix_path: str = "strix"
    openai_api_key: str = ""  # For report processing with structured outputs
    cors_origins: str = "https://nullscan.io,https://www.nullscan.io"
    unlimited_emails: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
