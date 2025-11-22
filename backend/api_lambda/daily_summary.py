from datetime import datetime, timezone, timedelta
import json
import os

import boto3

from dynamodb_client import daily_summaries_table, trainer_assignments_table
from utils import _to_serializable
from notifications import TRAINER_NOTIFICATIONS_TOPIC_ARN # reuse SNS config
from chat import create_system_daily_summary_message

sns = boto3.client("sns")


def _yesterday_date_iso():
    """Return yesterday's date in ISO-8601 (UTC) for summary selection."""
    # You can switch to a specific timezone later if needed
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)
    return yesterday.isoformat()


def _find_trainer_for_user(user_id: str):
    """Scan assignments to discover the active trainer for a user."""
    # Same as in notifications.py; you can refactor later if you like
    resp = trainer_assignments_table.scan()
    items = resp.get("Items", [])
    for it in items:
        if it.get("userId") == user_id and it.get("status") == "active":
            return it.get("trainerId")
    return None


def lambda_handler(event, context):
    """Entry point triggered by EventBridge to broadcast yesterday's summaries."""
    if not TRAINER_NOTIFICATIONS_TOPIC_ARN:
        # No topic configured; nothing to do
        return {"status": "no-topic"}

    target_date = _yesterday_date_iso()

    # Scan daily summaries and filter by date == target_date
    resp = daily_summaries_table.scan()
    items = resp.get("Items", [])

    for item in items:
        if item.get("date") != target_date:
            continue

        user_id = item.get("userId")
        if not user_id:
            continue

        trainer_id = _find_trainer_for_user(user_id)
        if not trainer_id:
            # No trainer for user; skip
            continue

        msg = {
            "type": "DAILY_SUMMARY",
            "userId": user_id,
            "trainerId": trainer_id,
            "date": target_date,
            "totalCalories": item.get("totalCalories"),
            "totalProtein": item.get("totalProtein"),
            "totalCarbs": item.get("totalCarbs"),
            "totalFat": item.get("totalFat"),
            "entryCount": item.get("entryCount"),
        }

        sns.publish(
            TopicArn=TRAINER_NOTIFICATIONS_TOPIC_ARN,
            Message=json.dumps(_to_serializable(msg)),
            Subject=f"Daily Summary for user {user_id} on {target_date}",
        )
        
        create_system_daily_summary_message(user_id, trainer_id, item)

    return {"status": "ok", "date": target_date}
