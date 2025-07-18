# Gravity Farms Petfood Chatbot Backend

This is the backend API service for the Gravity Farms Petfood AI chatbot. It handles all integrations with Snowflake Cortex for LLM capabilities and LaunchDarkly for configuration management.

## 🚀 Quick Start with Docker (Recommended)

### Run in Demo Mode (No Setup Required!)

```bash
# From the project root directory
docker-compose up chatbot-backend

# The API is now available at http://localhost:3001
```

That's it! The chatbot is running with mock data - no Snowflake or LaunchDarkly credentials needed.

### Run with Real Credentials

1. Create a `.env` file in the root directory:
```bash
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
LAUNCHDARKLY_SDK_KEY=sdk-xxxx
DEMO_MODE=false
```

2. Run Docker:
```bash
docker-compose up chatbot-backend
```

## Features

- **AI-Powered Chat**: Uses Snowflake Cortex LLM for natural language processing
- **Demo Mode**: Fully functional chatbot with mock data when credentials aren't available
- **Order Management**: Look up orders and track shipments
- **Product Search**: Find products and get detailed information
- **Returns Processing**: Handle return requests
- **Configuration Management**: Dynamic prompts and model selection via LaunchDarkly
- **Session Management**: Maintains chat history per session
- **Docker Support**: Production-ready containerization with health checks

## Alternative: Manual Installation (Without Docker)

<details>
<summary>Click to expand manual installation steps</summary>

### Prerequisites

- Node.js 16+ installed
- Snowflake account with Cortex enabled (optional - demo mode available)
- LaunchDarkly account (optional - demo mode available)

### Installation Steps

1. Install dependencies:
```bash
cd gravity-farms-chatbot-backend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials (or leave empty for demo mode)
```

3. Run the service:
```bash
# Development
npm run dev

# Production
npm start
```

### Database Setup (For Production Mode)

Run the following in your Snowflake console:
```sql
-- Create database and schema
CREATE DATABASE IF NOT EXISTS GRAVITY_FARMS_PETFOOD_AI;
USE DATABASE GRAVITY_FARMS_PETFOOD_AI;
CREATE SCHEMA IF NOT EXISTS CHATBOT;
USE SCHEMA CHATBOT;

-- Create required tables
CREATE TABLE IF NOT EXISTS PRODUCTS (
    product_id VARCHAR PRIMARY KEY,
    name VARCHAR,
    description TEXT,
    category VARCHAR,
    price DECIMAL(10,2),
    ingredients TEXT,
    nutritional_info TEXT
);

CREATE TABLE IF NOT EXISTS ORDERS (
    order_id VARCHAR PRIMARY KEY,
    customer_email VARCHAR,
    order_date TIMESTAMP,
    status VARCHAR,
    tracking_number VARCHAR,
    items VARIANT,
    total_amount DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS CHAT_HISTORY (
    session_id VARCHAR,
    message_id VARCHAR,
    timestamp TIMESTAMP,
    role VARCHAR,
    content TEXT,
    metadata VARIANT
);
```

</details>

## API Endpoints

### POST /api/chat/message
Main chat endpoint for processing messages.

**Request Body:**
```json
{
  "message": "I need help with my order",
  "sessionId": "session-123",
  "userEmail": "customer@example.com"
}
```

**Response:**
```json
{
  "response": "I'd be happy to help you with your order...",
  "sessionId": "session-123",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### GET /api/chat/history/:sessionId
Retrieve chat history for a session.

**Response:**
```json
{
  "sessionId": "session-123",
  "history": [
    {
      "messageId": "msg-1",
      "timestamp": "2024-01-01T12:00:00Z",
      "role": "user",
      "content": "Hello"
    }
  ],
  "count": 1
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "gravity-farms-chatbot",
  "timestamp": "2024-01-01T12:00:00Z",
  "environment": "development"
}
```

## Architecture

```
┌─────────────────────┐
│  Express API Server │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼─────┐ ┌──▼───────────┐
│Snowflake │ │ LaunchDarkly │
│ Cortex   │ │ AI Configs   │
└──────────┘ └──────────────┘
```

## Demo Mode

When running without credentials (or with `DEMO_MODE=true`), the chatbot provides:

- 🛍️ Sample product catalog (5 products)
- 📦 Demo order history (3 orders)
- 💬 Intelligent mock responses
- ⏱️ Realistic response delays
- 💾 In-memory chat history

Try these queries in demo mode:
- "Hello" - Greeting
- "Show my orders" - View demo orders
- "Dog food products" - Browse products
- "Return policy" - Get return info

## Environment Variables

| Variable | Description | Required | Demo Mode |
|----------|-------------|----------|-----------|
| DEMO_MODE | Enable demo mode | No | `true` |
| SNOWFLAKE_ACCOUNT | Snowflake account identifier | No* | Not needed |
| SNOWFLAKE_USER | Snowflake username | No* | Not needed |
| SNOWFLAKE_PASSWORD | Snowflake password | No* | Not needed |
| SNOWFLAKE_WAREHOUSE | Snowflake warehouse | No | Not needed |
| SNOWFLAKE_DATABASE | Snowflake database | No | Not needed |
| SNOWFLAKE_SCHEMA | Snowflake schema | No | Not needed |
| LAUNCHDARKLY_SDK_KEY | LaunchDarkly server SDK key | No* | Not needed |
| PORT | Server port (default: 3001) | No | 3001 |
| NODE_ENV | Environment | No | development |
| FRONTEND_URL | Frontend URL for CORS | No | * |

*Required only when `DEMO_MODE=false`

## Deployment with Docker

### Development/Testing
```bash
# Quick start with demo mode
docker-compose up chatbot-backend
```

### Production
```bash
# Build and push to registry
docker build -t your-registry/gravity-farms-chatbot .
docker push your-registry/gravity-farms-chatbot

# Deploy to your platform
docker run -p 3001:3001 \
  -e SNOWFLAKE_ACCOUNT=xxx \
  -e SNOWFLAKE_USER=xxx \
  -e SNOWFLAKE_PASSWORD=xxx \
  -e LAUNCHDARKLY_SDK_KEY=xxx \
  -e DEMO_MODE=false \
  your-registry/gravity-farms-chatbot
```

### Cloud Platforms

**AWS ECS/Fargate:**
```bash
# Use the Docker image with ECS task definitions
# Set environment variables in task definition
```

**Google Cloud Run:**
```bash
gcloud run deploy gravity-farms-chatbot \
  --image your-registry/gravity-farms-chatbot \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DEMO_MODE=true
```

**Kubernetes:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gravity-farms-chatbot
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: chatbot
        image: gravity-farms-chatbot:latest
        env:
        - name: DEMO_MODE
          value: "false"
        envFrom:
        - secretRef:
            name: chatbot-secrets
```

## Monitoring & Troubleshooting

### Health Check
```bash
curl http://localhost:3001/health
```

### Demo Mode Indicators
Look for these console messages:
- `🎮 Running in DEMO MODE - Using mock data`
- `✅ Chatbot service initialized in DEMO MODE`
- `📊 Demo Metrics:` (when tracking events)

### Common Issues

**Container won't start:**
- Check Docker is running: `docker --version`
- Verify port 3001 is available: `lsof -i :3001`

**Chat not responding:**
- Check health endpoint: `curl http://localhost:3001/health`
- View container logs: `docker-compose logs chatbot-backend`

**Switching to production mode:**
- Set `DEMO_MODE=false` in environment
- Provide all required credentials
- Restart the container

## License

Copyright (c) 2024 Gravity Farms Petfood