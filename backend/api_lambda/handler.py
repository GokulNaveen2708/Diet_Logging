import json
import logging
from utils import build_response, parse_body
from users import create_user
from diet_logs import log_diet_entry, get_today_logs
from summaries import get_today_summary
from foods import search_foods
from trainers import create_trainer,assign_trainer, unassign_trainer,get_trainer_clients
from chat import send_message,get_conversation

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
            role = body.get("role")
            if not role:
                logger.warning("User creation failed validation: missing role")
                return build_response(400, {"error": "role ('user' or 'trainer') is required"})

            if role == "user":
                status, payload = create_user(body)
            elif role == "trainer":
                status, payload = create_trainer(body)
            else:
                logger.warning("User creation failed validation: role=%s", role)
                return build_response(400, {"error": "valid role ('user' or 'trainer') are required"})

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

            logger.info("Fetching today's logs for user_id=%s", user_id)
            items = get_today_logs(user_id)
            return build_response(200, {"items": items})

        # Get today's summary (macro bar)
        if method == "GET" and path == "/summary/today":
            params = event.get("queryStringParameters") or {}
            user_id = params.get("userId")
            if not user_id:
                logger.warning("Missing userId when fetching today's summary.")
                return build_response(400, {"error": "userId query parameter is required"})

            logger.info("Fetching today's summary for user_id=%s", user_id)
            summary = get_today_summary(user_id)
            return build_response(200, {"summary": summary})
        
        # Get foods search results
        if method == "GET" and path == "/foods/search":
            params = event.get("queryStringParameters") or {}
            query = params.get("query") or params.get("q")
            if not query:
                return build_response(400, {"error": "query parameter is required"})

            logger.info("Searching foods with query=%s", query)
            results = search_foods(query)
            return build_response(200, {"items": results})
        
        # Assign trainer to user (manual or auto)
        if method == "POST" and path == "/trainer/assign":
            body = parse_body(event)
            status, payload = assign_trainer(body)
            logger.info("Assign trainer completed with status=%s for user_id=%s trainer_id=%s", status, body.get("userId"), body.get("trainerId"))
            return build_response(status, payload)

        # Unassign trainer
        if method == "POST" and path == "/trainer/unassign":
            body = parse_body(event)
            status, payload = unassign_trainer(body)
            logger.info("Unassign trainer completed with status=%s for user_id=%s", status, body.get("userId"))
            return build_response(status, payload)

        # Get trainer's clients
        if method == "GET" and path == "/trainer/clients":
            params = event.get("queryStringParameters") or {}
            trainer_id = params.get("trainerId")
            if not trainer_id:
                return build_response(400, {"error": "trainerId query parameter is required"})
            logger.info("Fetching trainer clients for trainer_id=%s", trainer_id)
            clients = get_trainer_clients(trainer_id)
            return build_response(200, {"clients": clients})

        # Send message between user & trainer
        if method == "POST" and path == "/messages":
            body = parse_body(event)
            status, payload = send_message(body)
            logger.info("Send message completed with status=%s for user_id=%s trainer_id=%s", status, body.get("userId"), body.get("trainerId"))
            return build_response(status, payload)

        # Get conversation messages
        if method == "GET" and path == "/messages":
            params = event.get("queryStringParameters") or {}
            user_id = params.get("userId")
            trainer_id = params.get("trainerId")
            if not user_id or not trainer_id:
                return build_response(400, {"error": "userId and trainerId are required"})
            logger.info("Fetching conversation for user_id=%s trainer_id=%s", user_id, trainer_id)
            conv = get_conversation(user_id, trainer_id)
            return build_response(200, {"messages": conv})



        # Not found
        logger.warning("No route for %s %s", method, path)
        return build_response(404, {"error": f"No route for {method} {path}"})

    except Exception as exc:
        logger.exception("Unhandled error for %s %s", method, path)
        return build_response(500, {"error": "Internal server error", "detail": str(exc)})
