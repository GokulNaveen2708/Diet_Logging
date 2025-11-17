import json
import logging
from utils import build_response, parse_body
from users import create_user
from diet_logs import log_diet_entry, get_today_logs
from summaries import get_today_summary

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """
    Entry point for API Gateway HTTP API (v2) -> Lambda.
    Routes based on HTTP method + path.
    """
    # Debug log (optional, but useful at first)
    # logger.debug("Event: %s", json.dumps(event))
    http = event.get("requestContext", {}).get("http", {})
    method = http.get("method")
    path = http.get("path") or event.get("rawPath")  # depending on API GW config
    logger.info("Incoming request: method=%s path=%s", method, path)

    try:
        # Health check
        if method == "GET" and path == "/health":
            logger.debug("Health check invoked.")
            return build_response(200, {"status": "ok", "service": "diet-api", "message": "Healthy"})

        # Create user
        if method == "POST" and path == "/users":
            body = parse_body(event)
            status, payload = create_user(body)
            logger.info("Create user completed with status=%s", status)
            return build_response(status, payload)

        # Log diet entry
        if method == "POST" and path == "/diet-logs":
            body = parse_body(event)
            status, payload = log_diet_entry(body)
            logger.info("Log diet entry completed with status=%s", status)
            return build_response(status, payload)

        # Get today's logs
        if method == "GET" and path == "/diet-logs/today":
            params = event.get("queryStringParameters") or {}
            user_id = params.get("userId")
            if not user_id:
                logger.warning("Missing userId when fetching today's logs.")
                return build_response(400, {"error": "userId query parameter is required"})

            items = get_today_logs(user_id)
            return build_response(200, {"items": items})

        # Get today's summary (macro bar)
        if method == "GET" and path == "/summary/today":
            params = event.get("queryStringParameters") or {}
            user_id = params.get("userId")
            if not user_id:
                logger.warning("Missing userId when fetching today's summary.")
                return build_response(400, {"error": "userId query parameter is required"})

            summary = get_today_summary(user_id)
            return build_response(200, {"summary": summary})

        # Not found
        logger.warning("No route for %s %s", method, path)
        return build_response(404, {"error": f"No route for {method} {path}"})

    except Exception as exc:
        logger.exception("Unhandled error for %s %s", method, path)
        return build_response(500, {"error": "Internal server error", "detail": str(exc)})
