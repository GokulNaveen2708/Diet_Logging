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


# --- Lambda function (health check) ---

resource "aws_lambda_function" "health_check" {
  function_name = "diet-api-health-check"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"

  filename         = "/Users/gokul/Desktop/Diet_Logging/health_lambda.zip"
  source_code_hash = filebase64sha256("/Users/gokul/Desktop/Diet_Logging/health_lambda.zip")

  timeout = 5
}

# --- API Gateway HTTP API (v2) ---

resource "aws_apigatewayv2_api" "http_api" {
  name          = "diet-api-http"
  protocol_type = "HTTP"
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
