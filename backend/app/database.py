import databases
import sqlalchemy
from app.config import settings

database = databases.Database(settings.database_url)
metadata = sqlalchemy.MetaData()

scans = sqlalchemy.Table(
    "scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.String(36), primary_key=True),
    sqlalchemy.Column("email", sqlalchemy.String(255), nullable=False),
    sqlalchemy.Column("target_url", sqlalchemy.String(2048), nullable=False),
    sqlalchemy.Column("status", sqlalchemy.String(20), default="pending"),
    sqlalchemy.Column("scan_type", sqlalchemy.String(20), default="quick"),
    sqlalchemy.Column("results_json", sqlalchemy.Text, nullable=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, server_default=sqlalchemy.func.now()),
    sqlalchemy.Column("completed_at", sqlalchemy.DateTime, nullable=True),
    sqlalchemy.Column("paid_tier", sqlalchemy.String(20), nullable=True),
    sqlalchemy.Column("stripe_payment_id", sqlalchemy.String(255), nullable=True),
    sqlalchemy.Column("retry_count", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("progress_json", sqlalchemy.Text, nullable=True),
    sqlalchemy.Column("parent_scan_id", sqlalchemy.String(36), nullable=True),
)

rate_limits = sqlalchemy.Table(
    "rate_limits",
    metadata,
    sqlalchemy.Column("email", sqlalchemy.String(255), primary_key=True),
    sqlalchemy.Column("scan_count", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("month", sqlalchemy.String(7)),  # YYYY-MM
)

_connect_args = {}
if settings.database_url.startswith("sqlite"):
    _connect_args["check_same_thread"] = False

engine = sqlalchemy.create_engine(settings.database_url, connect_args=_connect_args)
metadata.create_all(engine)

# Migrate existing DB: add parent_scan_id column if missing
with engine.connect() as conn:
    try:
        conn.execute(sqlalchemy.text("ALTER TABLE scans ADD COLUMN parent_scan_id VARCHAR(36)"))
        conn.commit()
    except Exception:
        pass  # Column already exists
