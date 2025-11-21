from datetime import datetime, timezone

from boto3.dynamodb.conditions import Key

from dynamodb_client import messages_table

from utils import _now_iso


def _conversation_id(user_id: str, trainer_id: str) -> str:
    return f"{user_id}#{trainer_id}"


def send_message(body: dict):
    """
    Send a message between user and trainer.
    Body:
    {
      "userId": "...",
      "trainerId": "...",
      "senderRole": "user" | "trainer",
      "message": "text"
    }
    """

    user_id = body.get("userId")
    trainer_id = body.get("trainerId")
    sender_role = body.get("senderRole")
    message_text = body.get("message")

    if not user_id or not trainer_id:
        return 400, {"error": "userId and trainerId are required"}

    if sender_role not in ("user", "trainer"):
        return 400, {"error": "senderRole must be 'user' or 'trainer'"}

    if not message_text:
        return 400, {"error": "message is required"}

    conv_id = _conversation_id(user_id, trainer_id)
    timestamp = _now_iso()

    item = {
        "conversationId": conv_id,
        "timestamp": timestamp,
        "userId": user_id,
        "trainerId": trainer_id,
        "senderRole": sender_role,
        "message": message_text,
        "createdAt": timestamp,
    }

    messages_table.put_item(Item=item)

    return 201, {"message": "Message sent", "item": item}


def get_conversation(user_id: str, trainer_id: str, limit: int = 50):
    """
    Get messages for a conversation (ordered by time ascending).
    """

    conv_id = _conversation_id(user_id, trainer_id)

    resp = messages_table.query(
        KeyConditionExpression=Key("conversationId").eq(conv_id),
        Limit=limit,
        ScanIndexForward=True,  # oldest first
    )

    items = resp.get("Items", [])
    return items

def create_system_daily_summary_message(user_id: str, trainer_id: str, summary_item: dict):
    """
    Create a system-generated message in the conversation for the daily summary.
    """

    conv_id = _conversation_id(user_id, trainer_id)
    timestamp = _now_iso()

    date = summary_item.get("date")
    total_cal = summary_item.get("totalCalories")
    total_pro = summary_item.get("totalProtein")
    total_carbs = summary_item.get("totalCarbs")
    total_fat = summary_item.get("totalFat")
    entry_count = summary_item.get("entryCount")

    text = (
        f"Daily summary for {date}: "
        f"{total_cal} kcal, "
        f"Protein {total_pro}g, Carbs {total_carbs}g, Fat {total_fat}g "
        f"from {entry_count} entries."
    )

    item = {
        "conversationId": conv_id,
        "timestamp": timestamp,
        "userId": user_id,
        "trainerId": trainer_id,
        "senderRole": "system",
        "type": "daily_summary",
        "message": text,
        "createdAt": timestamp,
    }

    messages_table.put_item(Item=item)

    return item

