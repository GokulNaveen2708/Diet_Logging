import uuid
import os
import boto3
from boto3.dynamodb.conditions import Key

from dynamodb_client import trainers_table, trainer_assignments_table

from utils import _now_iso


sns = boto3.client("sns")
TRAINER_NOTIFICATIONS_TOPIC_ARN = os.environ.get("TRAINER_NOTIFICATIONS_TOPIC_ARN")

def create_trainer(body: dict):
    """
    Create a new trainer.
    Required fields: name
    Optional: maxClients (default 10)
    """

    name = body.get("name")
    if not name:
        return 400, {"error": "name is required"}
    email = body.get("email")
    if not email:
        return 400, {"error": "email is required"}

    max_clients = body.get("maxClients", 10)
    try:
        max_clients = int(max_clients)
    except (TypeError, ValueError):
        return 400, {"error": "maxClients must be an integer"}

    trainer_id = str(uuid.uuid4())

    item = {
        "trainerId": trainer_id,
        "name": name,
        "maxClients": max_clients,
        "currentClientCount": 0,
        "createdAt": _now_iso(),
        "email" : email
    }

    trainers_table.put_item(Item=item)

    if TRAINER_NOTIFICATIONS_TOPIC_ARN:
        sns.subscribe(
            TopicArn=TRAINER_NOTIFICATIONS_TOPIC_ARN,
            Protocol="email",
            Endpoint=email,
        )


    return 201, {"trainerId": trainer_id, "trainer": item}


def _find_auto_match_trainer():
    """
    MVP auto-match:
    - Scan Trainers table
    - Filter to trainers where currentClientCount < maxClients
    - Pick one with lowest currentClientCount
    """
    resp = trainers_table.scan()
    items = resp.get("Items", [])

    available = []
    for t in items:
        max_c = int(t.get("maxClients", 0))
        curr_c = int(t.get("currentClientCount", 0))
        if curr_c < max_c:
            available.append(t)

    if not available:
        return None

    available.sort(key=lambda t: int(t.get("currentClientCount", 0)))
    return available[0]


def assign_trainer(body: dict):
    """
    Assign a trainer to a user.
    Modes:
      - Manual: body has userId + trainerId
      - Auto-match: body has userId only => we pick trainer with lowest load
    """

    user_id = body.get("userId")
    trainer_id = body.get("trainerId")

    if not user_id:
        return 400, {"error": "userId is required"}

    # If no trainerId provided, auto-match
    assigned_trainer = None
    if not trainer_id:
        assigned_trainer = _find_auto_match_trainer()
        if not assigned_trainer:
            return 409, {"error": "No available trainers to assign"}
        trainer_id = assigned_trainer["trainerId"]
    else:
        # Manual: verify trainer exists
        resp = trainers_table.get_item(Key={"trainerId": trainer_id})
        assigned_trainer = resp.get("Item")
        if not assigned_trainer:
            return 404, {"error": f"Trainer {trainer_id} not found"}

    # Create/overwrite assignment for this user
    assignment_item = {
        "userId": user_id,
        "trainerId": trainer_id,
        "status": "active",
        "assignedAt": _now_iso(),
    }
    trainer_assignments_table.put_item(Item=assignment_item)

    # Increment trainer's currentClientCount (MVP: no concurrency handling)
    curr_c = int(assigned_trainer.get("currentClientCount", 0))
    trainers_table.update_item(
        Key={"trainerId": trainer_id},
        UpdateExpression="SET currentClientCount = :c",
        ExpressionAttributeValues={":c": curr_c + 1},
    )

    return 200, {
        "message": "Trainer assigned",
        "userId": user_id,
        "trainerId": trainer_id,
    }


def unassign_trainer(body: dict):
    """
    Unassign the active trainer for a user (if any).
    We:
      - find assignment(s) for userId
      - mark them removed
      - decrement trainer's currentClientCount
    """

    user_id = body.get("userId")
    if not user_id:
        return 400, {"error": "userId is required"}

    # Get all assignments for this user
    resp = trainer_assignments_table.query(
        KeyConditionExpression=Key("userId").eq(user_id)
    )
    items = resp.get("Items", [])

    if not items:
        return 404, {"error": "No trainer assignment found for this user"}

    # For MVP: treat all as needing removal (but we expect only one active)
    for assignment in items:
        trainer_id = assignment["trainerId"]

        # mark as removed
        trainer_assignments_table.put_item(
            Item={
                **assignment,
                "status": "removed",
                "removedAt": _now_iso(),
            }
        )

        # decrement trainer's count (MVP, no concurrency)
        resp_tr = trainers_table.get_item(Key={"trainerId": trainer_id})
        trainer = resp_tr.get("Item")
        if trainer:
            curr_c = int(trainer.get("currentClientCount", 0))
            new_count = max(0, curr_c - 1)
            trainers_table.update_item(
                Key={"trainerId": trainer_id},
                UpdateExpression="SET currentClientCount = :c",
                ExpressionAttributeValues={":c": new_count},
            )

    return 200, {"message": "Trainer unassigned for user", "userId": user_id}


def get_trainer_clients(trainer_id: str):
    """
    Get list of users assigned to a trainer.
    MVP approach:
      - Scan TrainerAssignments table and filter by trainerId & status == 'active'
      (Later we could add a GSI for trainerId)
    """

    resp = trainer_assignments_table.scan()
    items = resp.get("Items", [])

    clients = [
        it for it in items
        if it.get("trainerId") == trainer_id and it.get("status") == "active"
    ]

    return clients
