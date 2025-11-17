import logging
from decimal import Decimal, ROUND_HALF_UP

from boto3.dynamodb.conditions import Key

from dynamodb_client import diet_logs_table, foods_table
from summaries import update_daily_summary
from utils import get_today_iso_date, get_current_timestamp_iso

logger = logging.getLogger(__name__)


def _to_decimal(value, default="0"):
    """Convert a value to Decimal with a safe default."""
    if value is None:
        return Decimal(default)
    return Decimal(str(value))


def _round_currency(value: Decimal) -> Decimal:
    """Quantize a Decimal to two places using bankers-friendly rounding."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def log_diet_entry(body: dict):
    """
    Log a food entry for a user, and update daily summary.
    Expected body:
    {
      "userId": "...",
      "foodName": "Chicken breast",
      "quantity": 150,
      "unit": "g",
      "calories": 240,
      "protein": 40,
      "carbs": 0,
      "fat": 5,
      "mealType": "lunch"
    }
    """
    logger.info("Received diet log request for user_id=%s food_id=%s", body.get("userId"), body.get("foodId"))
    user_id = body.get("userId")
    food_id = body.get("foodId")
    quantity = body.get("quantity")
    unit = body.get("unit") or "g"
    meal_type = body.get("mealType")

    if not user_id:
        logger.warning("Diet log missing userId.")
        return 400, {"error": "userId is required"}
    if not food_id:
        logger.warning("Diet log missing foodId for user_id=%s", user_id)
        return 400, {"error": "foodId is required"}
    if not quantity:
        logger.warning("Diet log missing quantity for user_id=%s food_id=%s", user_id, food_id)
        return 400, {"error": "quantity is required"}
    if unit != "g":
        logger.warning("Unsupported unit '%s' provided for user_id=%s food_id=%s", unit, user_id, food_id)
        return 400, {"error": "For now only grams as unit is supported"}

    try:
        quantity = _to_decimal(quantity)
    except (TypeError, ValueError, ArithmeticError):
        logger.warning("Quantity conversion failed for user_id=%s food_id=%s raw_quantity=%s", user_id, food_id, quantity)
        return 400, {"error": "quantity must be a number"}

    # 1) Look up food in Foods table
    resp = foods_table.get_item(Key={"foodId": food_id})
    food = resp.get("Item")
    if not food:
        logger.warning("Food not found for food_id=%s", food_id)
        return 404, {"error": f"Food with id '{food_id}' not found"}

    grams_per_unit = _to_decimal(food.get("gramsPerUnit", 100))
    calories_per_unit = _to_decimal(food.get("caloriesPerUnit", 0))
    protein_per_unit = _to_decimal(food.get("proteinPerUnit", 0))
    carbs_per_unit = _to_decimal(food.get("carbsPerUnit", 0))
    fat_per_unit = _to_decimal(food.get("fatPerUnit", 0))

    # 2) Compute macros for the given quantity
    factor = quantity / grams_per_unit if grams_per_unit > 0 else Decimal("0")

    calories = _round_currency(calories_per_unit * factor)
    protein = _round_currency(protein_per_unit * factor)
    carbs = _round_currency(carbs_per_unit * factor)
    fat = _round_currency(fat_per_unit * factor)
    logger.debug(
        "Computed macros for user_id=%s food_id=%s: calories=%s protein=%s carbs=%s fat=%s",
        user_id,
        food_id,
        calories,
        protein,
        carbs,
        fat,
    )

    log_timestamp = get_current_timestamp_iso()
    date = get_today_iso_date()

    # 3) Build DietLogs item with computed macros
    item = {
        "userId": user_id,
        "logTimestamp": log_timestamp,
        "date": date,
        "foodId": food_id,
        "foodName": food.get("name"),
        "quantity": quantity,
        "unit": unit,
        "calories": calories,
        "protein": protein,
        "carbs": carbs,
        "fat": fat,
        "mealType": meal_type,
    }

    # Save log entry
    diet_logs_table.put_item(Item=item)

    # 4) Update daily summary
    summary = update_daily_summary(
        user_id=user_id,
        date=date,
        calories=calories,
        protein=protein,
        carbs=carbs,
        fat=fat,
    )

    logger.info("Diet log created for user_id=%s food_id=%s timestamp=%s", user_id, food_id, log_timestamp)
    return 201, {"log": item, "updatedSummary": summary}


def get_today_logs(user_id: str):
    """
    Return today's logs for a user.
    Query by userId and filter by date in code.
    """

    date = get_today_iso_date()

    # Query all logs for this user
    resp = diet_logs_table.query(
        KeyConditionExpression=Key("userId").eq(user_id)
    )

    items = resp.get("Items", [])
    today_items = [it for it in items if it.get("date") == date]
    logger.debug("Fetched %s diet logs for user_id=%s date=%s", len(today_items), user_id, date)
    return today_items
