import json
import logging
from datetime import datetime, timezone
from decimal import Decimal

logger = logging.getLogger(__name__)


def _to_serializable(value):
    """Recursively convert Decimals to int/float for JSON encoding."""
    if isinstance(value, list):
        return [_to_serializable(v) for v in value]
    if isinstance(value, dict):
        return {k: _to_serializable(v) for k, v in value.items()}
    if isinstance(value, Decimal):
        # keep whole numbers as ints to avoid trailing .0
        return int(value) if value % 1 == 0 else float(value)
    return value


def build_response(status_code: int, body: dict):
    """Build a shared HTTP response shape for API Gateway -> Lambda."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(_to_serializable(body)),
    }

def parse_body(event):
    """Safely parse the JSON body from an API Gateway event."""
    raw_body = event.get("body")
    if not raw_body:
        logger.debug("parse_body received empty raw body.")
        return {}
    try:
        return json.loads(raw_body)
    except json.JSONDecodeError:
        logger.warning("Failed to decode request body as JSON: %s", raw_body)
        return {}

def get_today_iso_date():
    """Return today's date in ISO format (UTC)."""
    # You can adjust timezone if you want local time; using UTC for now
    today = datetime.now(timezone.utc).date()
    return today.isoformat()  # "YYYY-MM-DD"

def get_current_timestamp_iso():
    """Return the current timestamp in ISO format (UTC)."""
    return datetime.now(timezone.utc).isoformat()
