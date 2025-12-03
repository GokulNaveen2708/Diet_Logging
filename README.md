# Diet Logging

Diet Logging is a collaborative nutrition-tracking platform that helps clients and trainers stay aligned on daily intake, goals, and progress. The app provides intuitive dashboards, real-time chat, and structured meal logging to keep every plan on track.

## System Design & Architecture
- **Client app (Next.js + React 19)** – Provides the dual onboarding flow, macro dashboards, food search, and trainer chat experiences. Built with Material UI for UI primitives and Tailwind 4 utility classes for styling. 【F:frontend/package.json†L1-L28】
- **API layer (AWS API Gateway HTTP API v2)** – Serves as the public HTTPS entry point and forwards all traffic to a Lambda handler using an AWS_PROXY integration. CORS is configured for the local Next.js origin. 【F:infra/terraform/main.tf†L94-L142】
- **Compute (AWS Lambda, Python 3.11)** – Single Lambda (plus a scheduled daily-summary Lambda) routes requests, validates inputs, and orchestrates domain modules for users, trainers, diet logs, food search, summaries, and chat. 【F:backend/api_lambda/handler.py†L1-L111】【F:infra/terraform/main.tf†L42-L85】
- **Data layer (Amazon DynamoDB)** – Separate PAY_PER_REQUEST tables for Users, DietLogs (userId + timestamp sort key), DailySummaries (userId + date), Foods, Trainers, TrainerAssignments (userId + trainerId), and Messages (conversationId + timestamp). 【F:infra/terraform/main.tf†L149-L215】
- **Notifications (Amazon SNS)** – Trainer notification topic injected into Lambda environment for alerting on key events (e.g., assignments or daily summaries). 【F:infra/terraform/main.tf†L26-L64】
- **Scheduled workflows (Amazon EventBridge)** – Nightly cron triggers the daily-summary Lambda to aggregate daily intake for trainers. 【F:infra/terraform/main.tf†L64-L112】
- **Infra-as-code (Terraform)** – Provisioning for IAM roles, permissions, API Gateway, Lambdas, DynamoDB tables, SNS, and EventBridge rules, keeping environments reproducible. 【F:infra/terraform/main.tf†L1-L215】

### Request flow (example: log a meal)
1. Client calls `POST /diet-logs` from the Next.js app.
2. API Gateway forwards the request to the Lambda handler using the proxy integration.
3. `handler.py` parses and validates the payload, then delegates to the diet log module. 【F:backend/api_lambda/handler.py†L18-L64】
4. The diet log module writes the entry to the `DietLogs` DynamoDB table via the shared DynamoDB client. 【F:backend/api_lambda/dynamodb_client.py†L1-L21】
5. Lambda returns a structured JSON response that the frontend renders in the meal dashboard.

### Tech Stack
- **Frontend:** Next.js 16, React 19, Material UI, Tailwind CSS 4, TypeScript. 【F:frontend/package.json†L1-L28】
- **Backend:** Python 3.11 AWS Lambda functions, modularized into user, trainer, diet log, food search, summary, and chat handlers. 【F:backend/api_lambda/handler.py†L1-L111】
- **Data & Messaging:** DynamoDB tables for core entities; SNS topic for trainer notifications; EventBridge scheduled rules for nightly jobs. 【F:infra/terraform/main.tf†L26-L215】
- **Infrastructure:** Terraform for AWS resources (IAM, API Gateway HTTP API v2, Lambdas, DynamoDB, SNS, EventBridge). 【F:infra/terraform/main.tf†L1-L215】

## Features
- **Dual-entry experience** for clients and trainers with role-based onboarding from the landing screen.
- **Macro-aware dashboards** showing calories and a detailed macro breakdown for the day.
- **Meal organization** by time of day (Breakfast, Lunch, Dinner, Snack) with quick logging workflows for common foods.
- **Trainer/client collaboration** via real-time chat embedded alongside nutrition data.
- **Searchable food logging** to quickly find items and add them with quantities.

## Screenshots
- Landing page role selection

  ![Landing page](pics/Screenshot%202025-12-03%20at%203.06.29%E2%80%AFPM.png)

- Client overview with chat and daily macros

  ![Client overview](pics/Screenshot%202025-12-03%20at%203.06.56%E2%80%AFPM.png)

- Daily dashboard with searchable meals

  ![Daily dashboard](pics/Screenshot%202025-12-03%20at%203.07.40%E2%80%AFPM.png)

- Quick food logging modal

  ![Food logging modal](pics/Screenshot%202025-12-03%20at%203.07.56%E2%80%AFPM.png)

## Getting Started
1. **Frontend (Next.js)**
   - Navigate to `frontend`.
   - Install dependencies: `npm install`.
   - Run the development server: `npm run dev` (defaults to http://localhost:3000).

2. **Project structure**
   - `frontend/`: Next.js app for client and trainer experiences.
   - `backend/`: Backend code and lambda assets for API handling.
   - `pics/`: UI reference screenshots.

## Roadmap Ideas
- Expand food database and search relevance.
- Add progress analytics with historical charts.
- Support custom macro targets and reminders.
- Offer export/share options for diet plans.

## License
This project is provided for demonstration purposes. Check repository details for licensing information.
