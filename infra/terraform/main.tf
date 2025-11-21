terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "diet-app"
}


# --- IAM role for Lambda ---

resource "aws_iam_role" "lambda_exec_role" {
  name = "diet-api-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# --- Acess to lambda basic execution ---
resource "aws_iam_role_policy_attachment" "lambda_basic_exec" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Access to DynamoDb ---
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_access" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

# ----  Access to SNS notifications service ----
resource "aws_iam_role_policy" "lambda_sns_publish" {
  name = "lambda-sns-publish"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish",
          "sns:Subscribe"
        ]
        Resource = aws_sns_topic.trainer_notifications.arn
      }
    ]
  })
}

output "trainer_notifications_topic_arn" {
  description = "SNS topic ARN for trainer notifications"
  value       = aws_sns_topic.trainer_notifications.arn
}


# --- Lambda function ---

resource "aws_lambda_function" "health_check" {
  function_name = "diet-logging"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"

  filename         = "/Users/gokul/Desktop/Diet_Logging/health_lambda.zip"
  source_code_hash = filebase64sha256("/Users/gokul/Desktop/Diet_Logging/health_lambda.zip")

  timeout = 5

  # Expose SNS topic ARN to the function
  environment {
    variables = {
      TRAINER_NOTIFICATIONS_TOPIC_ARN = aws_sns_topic.trainer_notifications.arn
    }
  }
}

# --- Daily Summary Lambda Function-----

resource "aws_lambda_function" "daily_summary" {
  function_name = "diet_logging_daily_summary"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "daily_summary.lambda_handler"
  runtime       = "python3.11"

  filename         = "/Users/gokul/Desktop/Diet_Logging/health_lambda.zip"
  source_code_hash = filebase64sha256("/Users/gokul/Desktop/Diet_Logging/health_lambda.zip")

  timeout = 30

  environment {
    variables = {
      TRAINER_NOTIFICATIONS_TOPIC_ARN = aws_sns_topic.trainer_notifications.arn
    }
  }
}

# ---- Event Bridge rule + target ------

resource "aws_cloudwatch_event_rule" "daily_summary_rule" {
  name                = "diet-logging-daily-summary"
  description         = "Run daily to send summaries to trainers"
  schedule_expression = "cron(0 2 * * ? *)"
  # Runs every day at 02:00 UTC
}

resource "aws_cloudwatch_event_target" "daily_summary_target" {
  rule      = aws_cloudwatch_event_rule.daily_summary_rule.name
  target_id = "daily-summary-lambda"
  arn       = aws_lambda_function.daily_summary.arn
}

resource "aws_lambda_permission" "allow_eventbridge_to_invoke_daily_summary" {
  statement_id  = "AllowExecutionFromEventBridgeDailySummary"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.daily_summary.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_summary_rule.arn
}


# --- API Gateway HTTP API (v2) ---

resource "aws_apigatewayv2_api" "http_api" {
  name          = "diet-api-http"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = [
      "http://localhost:3000"
    ]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type"]
    expose_headers = ["content-type"]
    max_age = 300
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.health_check.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "health_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"

  target = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# Allow API Gateway to invoke Lambda
resource "aws_lambda_permission" "allow_apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_check.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

output "http_api_url" {
  description = "Base URL of the HTTP API"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

# ---- SNS Topic -----

resource "aws_sns_topic" "trainer_notifications" {
  name = "trainer-notifications"
}



# --- Add users table in DynamoDb ---
resource "aws_dynamodb_table" "users" {
  name         = "Users"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Project = "diet-logging"
    Table   = "users"
  }
}

# --- Add DietLog table in DynamoDb ---
resource "aws_dynamodb_table" "diet_logs" {
  name         = "DietLogs"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "userId"
  range_key = "logTimestamp"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "logTimestamp"
    type = "S"
  }

  tags = {
    Project = "diet-logging"
    Table   = "diet-logs"
  }
}

# --- Add Daily Summaries ---
resource "aws_dynamodb_table" "daily_summaries" {
  name         = "DailySummaries"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "userId"
  range_key = "date"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  tags = {
    Project = "diet-logging"
    Table   = "daily-summaries"
  }
}

# --- ADD Foods Table --- 

resource "aws_dynamodb_table" "foods" {
  name         = "Foods"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "foodId"

  attribute {
    name = "foodId"
    type = "S"
  }

  tags = {
    Project = "diet-logging"
    Table   = "foods"
  }
}

# --- Trainer Table ----

resource "aws_dynamodb_table" "trainers" {
  name         = "Trainers"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "trainerId"

  attribute {
    name = "trainerId"
    type = "S"
  }

  tags = {
    Project = "diet-logging"
    Table   = "trainers"
  }
}

# ---- Trainer Assignments -----

resource "aws_dynamodb_table" "trainer_assignments" {
  name         = "TrainerAssignments"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "userId"
  range_key = "trainerId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "trainerId"
    type = "S"
  }

  tags = {
    Project = "diet-logging"
    Table   = "trainer-assignments"
  }
}

# ---- Messages ----

resource "aws_dynamodb_table" "messages" {
  name         = "Messages"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "conversationId"
  range_key = "timestamp"

  attribute {
    name = "conversationId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  tags = {
    Project = "diet-logging"
    Table   = "messages"
  }
}
