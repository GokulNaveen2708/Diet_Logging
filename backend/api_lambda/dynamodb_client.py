import boto3

dynamodb = boto3.resource("dynamodb")

# For now we hardcode table names to match Terraform
USERS_TABLE_NAME = "Users"
DIET_LOGS_TABLE_NAME = "DietLogs"
DAILY_SUMMARIES_TABLE_NAME = "DailySummaries"
FOODS_TABLE_NAME = "Foods"

users_table = dynamodb.Table(USERS_TABLE_NAME)
diet_logs_table = dynamodb.Table(DIET_LOGS_TABLE_NAME)
daily_summaries_table = dynamodb.Table(DAILY_SUMMARIES_TABLE_NAME)
foods_table = dynamodb.Table(FOODS_TABLE_NAME)

