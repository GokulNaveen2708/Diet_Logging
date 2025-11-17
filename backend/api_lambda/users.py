import logging
import uuid
from datetime import datetime, timezone

from dynamodb_client import users_table

logger = logging.getLogger(__name__)


def create_user(body: dict):
    """
    Create a new user or trainer.
    Required fields: name, role, weightLbs, heightFeet, heightInches, age.
    """

    logger.info("Creating user with payload keys: %s", list(body.keys()))
    name = body.get("name")
    role = body.get("role")  # "user" or "trainer"
    weight_lbs = body.get("weightLbs")
    height_feet = body.get("heightFeet")
    height_inches = body.get("heightInches")
    gender = body.get("gender")
    age = body.get("age")

    # Basic validation (MVP-level)
    if not name or role not in ("user", "trainer"):
        logger.warning("User creation failed validation: name=%s role=%s", name, role)
        return 400, {"error": "name and valid role ('user' or 'trainer') are required"}

    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    item = {
        "userId": user_id,
        "name": name,
        "role": role,
        "weightLbs": weight_lbs,
        "heightFeet": height_feet,
        "heightInches": height_inches,
        "gender": gender,
        "age": age,
        "createdAt": created_at,
    }

    users_table.put_item(Item=item)

    logger.info("User created successfully: user_id=%s role=%s", user_id, role)
    return 201, {"userId": user_id, "user": item}
