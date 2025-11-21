from dynamodb_client import foods_table
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def search_foods(query: str, limit: int = 10):
    """
    Simple search over Foods table.
    - Scans all items (we only have ~20, so this is fine)
    - Case-insensitive substring match on 'name' and 'foodId'
    - Returns up to `limit` results
    """

    if not query:
        return []

    q = query.lower()

    # Scan the table (for small table, this is totally fine)
    resp = foods_table.scan()
    items = resp.get("Items", [])

    # Filter in Python (case-insensitive)
    matched = []
    for item in items:
        name = str(item.get("name", "")).lower()
        food_id = str(item.get("foodId", "")).lower()

        if q in name or q in food_id:
            matched.append(item)

    # Optional: simple "relevance" sort: items starting with query first
    def sort_key(item):
        name = str(item.get("name", "")).lower()
        food_id = str(item.get("foodId", "")).lower()
        starts_name = name.startswith(q)
        starts_id = food_id.startswith(q)
        # sort: startswith gets priority, then by name
        return (not (starts_name or starts_id), name)
    
    logger.info(f"Matched {len(matched)} items for query={query!r}")
    matched.sort(key=sort_key)

    return matched[:limit]
