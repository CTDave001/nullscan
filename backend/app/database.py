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
    # First-party attribution — where this scan's visitor came from
    sqlalchemy.Column("utm_source", sqlalchemy.String(255), nullable=True),
    sqlalchemy.Column("utm_medium", sqlalchemy.String(255), nullable=True),
    sqlalchemy.Column("utm_campaign", sqlalchemy.String(255), nullable=True),
    sqlalchemy.Column("referrer", sqlalchemy.String(1024), nullable=True),
    sqlalchemy.Column("landing_page", sqlalchemy.String(1024), nullable=True),
)

rate_limits = sqlalchemy.Table(
    "rate_limits",
    metadata,
    sqlalchemy.Column("email", sqlalchemy.String(255), primary_key=True),
    sqlalchemy.Column("scan_count", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("month", sqlalchemy.String(7)),  # YYYY-MM
)

# First-party funnel/analytics events. Written from the frontend via POST /events.
# Robust against ad-blockers (which block Google Analytics for dev audiences).
events = sqlalchemy.Table(
    "events",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("session_id", sqlalchemy.String(64), index=True),
    sqlalchemy.Column("scan_id", sqlalchemy.String(36), nullable=True, index=True),
    sqlalchemy.Column("name", sqlalchemy.String(64), nullable=False, index=True),
    sqlalchemy.Column("props_json", sqlalchemy.Text, nullable=True),
    sqlalchemy.Column("path", sqlalchemy.String(512), nullable=True),
    sqlalchemy.Column("referrer", sqlalchemy.String(1024), nullable=True),
    sqlalchemy.Column("utm_source", sqlalchemy.String(255), nullable=True),
    sqlalchemy.Column("utm_medium", sqlalchemy.String(255), nullable=True),
    sqlalchemy.Column("utm_campaign", sqlalchemy.String(255), nullable=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, server_default=sqlalchemy.func.now()),
)

# Emails that have unsubscribed from marketing. Checked before every drip send and honored
# permanently. Transactional email (scan-complete, receipts) is NOT gated on this.
email_suppressions = sqlalchemy.Table(
    "email_suppressions",
    metadata,
    sqlalchemy.Column("email", sqlalchemy.String(255), primary_key=True),
    sqlalchemy.Column("reason", sqlalchemy.String(64), nullable=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, server_default=sqlalchemy.func.now()),
)

# One row per marketing email actually sent, keyed by (scan_id, step). Gives idempotency
# (never send the same step twice) plus conversion analytics.
drip_sends = sqlalchemy.Table(
    "drip_sends",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("scan_id", sqlalchemy.String(36), index=True),
    sqlalchemy.Column("email", sqlalchemy.String(255), index=True),
    sqlalchemy.Column("step", sqlalchemy.Integer),
    sqlalchemy.Column("sent_at", sqlalchemy.DateTime, server_default=sqlalchemy.func.now()),
)

_connect_args = {}
if settings.database_url.startswith("sqlite"):
    _connect_args["check_same_thread"] = False

engine = sqlalchemy.create_engine(settings.database_url, connect_args=_connect_args)
metadata.create_all(engine)

# Migrate existing DB: add columns if missing (idempotent — skips ones already present)
_COLUMN_MIGRATIONS = [
    "ALTER TABLE scans ADD COLUMN parent_scan_id VARCHAR(36)",
    "ALTER TABLE scans ADD COLUMN utm_source VARCHAR(255)",
    "ALTER TABLE scans ADD COLUMN utm_medium VARCHAR(255)",
    "ALTER TABLE scans ADD COLUMN utm_campaign VARCHAR(255)",
    "ALTER TABLE scans ADD COLUMN referrer VARCHAR(1024)",
    "ALTER TABLE scans ADD COLUMN landing_page VARCHAR(1024)",
]
with engine.connect() as conn:
    for _stmt in _COLUMN_MIGRATIONS:
        try:
            conn.execute(sqlalchemy.text(_stmt))
            conn.commit()
        except Exception:
            conn.rollback()  # Column already exists
