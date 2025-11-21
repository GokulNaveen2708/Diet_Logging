import os
import json
import boto3

from dynamodb_client import trainer_assignments_table
from utils import _to_serializable

sns = boto3.client("sns")

# For now we hardcode topic ARN, but could read from env later.
TRAINER_NOTIFICATIONS_TOPIC_ARN = os.environ.get("TRAINER_NOTIFICATIONS_TOPIC_ARN")


def _find_trainer_for_user(user_id: str):
    """
    Find active trainer assignment for a user.
    MVP: scan TrainerAssignments and pick active one.
    (Could be optimized with GSI later.)
    """
    resp = trainer_assignments_table.scan()
    items = resp.get("Items", [])

    for it in items:
        if it.get("userId") == user_id and it.get("status") == "active":
            return it.get("trainerId")

    return None


def notify_trainer_user_logged_food(user_id: str, log_item: dict, summary_item: dict):
    """
    Publish a notification to SNS when a user logs food.
    If no trainer or no topic configured, do nothing.
    """

    if not TRAINER_NOTIFICATIONS_TOPIC_ARN:
        # Topic ARN not configured in env, skip
        return

    trainer_id = _find_trainer_for_user(user_id)
    if not trainer_id:
        # User has no trainer; no notification
        return

    # Build a simple message; can be enriched later
    food_name = log_item.get("foodName")
    quantity = log_item.get("quantity")
    unit = log_item.get("unit")
    calories = log_item.get("calories")

    msg = {
        "type": "USER_LOGGED_FOOD",
        "userId": user_id,
        "trainerId": trainer_id,
        "foodName": food_name,
        "quantity": quantity,
        "unit": unit,
        "calories": calories,
        "date": log_item.get("date"),
        "summary": {
            "totalCalories": summary_item.get("totalCalories"),
            "totalProtein": summary_item.get("totalProtein"),
            "totalCarbs": summary_item.get("totalCarbs"),
            "totalFat": summary_item.get("totalFat"),
            "entryCount": summary_item.get("entryCount"),
        },
    }

    sns.publish(
        TopicArn=TRAINER_NOTIFICATIONS_TOPIC_ARN,
        # Convert Decimal values before serializing
        Message=json.dumps(_to_serializable(msg)),
        Subject="Diet App - User logged food",
    )
