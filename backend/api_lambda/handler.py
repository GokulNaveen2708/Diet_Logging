import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
  """Simple health-check Lambda handler."""
  logger.info("Event received: %s", event)
  
  return {
      "statusCode": 200,
      "headers": {"Content-Type": "application/json"},
      "body": json.dumps(
          {
              "Event_id" : event.get("queryStringParameters", {}).get("id"),
              "status": "ok",
              "message": "Diet Logging health check succeeded.",
          }
      ),
  }
