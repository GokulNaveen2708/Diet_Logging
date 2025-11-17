import logging
from decimal import Decimal

from dynamodb_client import daily_summaries_table
from utils import get_today_iso_date

logger = logging.getLogger(__name__)


def _to_decimal(value, default="0"):
    """Convert value to Decimal with a default fallback."""
    if value is None:
        return Decimal(default)
    return Decimal(str(value))

def get_today_summary(user_id: str):
    """Fetch or construct today's summary for the given user."""
    date = get_today_iso_date()
    resp = daily_summaries_table.get_item(
        Key={
            "userId": user_id,
            "date": date,
        }
    )
    item = resp.get("Item")
    if not item:
        # Default empty summary
        logger.info("No summary found for user_id=%s date=%s; returning empty summary", user_id, date)
        item = {
            "userId": user_id,
            "date": date,
            "totalCalories": 0,
            "totalProtein": 0,
            "totalCarbs": 0,
            "totalFat": 0,
            "entryCount": 0,
        }
    return item

def update_daily_summary(user_id: str, date: str, calories, protein, carbs, fat):
    """
    MVP implementation: read current summary, add values, write back.
    (Not concurrency-safe for heavy load, but fine for this project.)
    """
    logger.info(
        "Updating daily summary for user_id=%s date=%s with calories=%s protein=%s carbs=%s fat=%s",
        user_id,
        date,
        calories,
        protein,
        carbs,
        fat,
    )
    resp = daily_summaries_table.get_item(
        Key={
            "userId": user_id,
            "date": date,
        }
    )
    item = resp.get("Item")
    if not item:
        item = {
            "userId": user_id,
            "date": date,
            "totalCalories": 0,
            "totalProtein": 0,
            "totalCarbs": 0,
            "totalFat": 0,
            "entryCount": 0,
        }

    item["totalCalories"] = _to_decimal(item.get("totalCalories")) + _to_decimal(calories)
    item["totalProtein"] = _to_decimal(item.get("totalProtein")) + _to_decimal(protein)
    item["totalCarbs"] = _to_decimal(item.get("totalCarbs")) + _to_decimal(carbs)
    item["totalFat"] = _to_decimal(item.get("totalFat")) + _to_decimal(fat)
    item["entryCount"] = int(item.get("entryCount", 0)) + 1

    daily_summaries_table.put_item(Item=item)
    logger.debug("Persisted daily summary for user_id=%s date=%s: %s", user_id, date, item)
    return item
