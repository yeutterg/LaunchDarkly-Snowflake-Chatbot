# Farm Fresh Pet Chatbot Backend

This is the backend API for the Farm Fresh Pet AI-powered customer service chatbot.

## Features

- AI-powered chat responses using Snowflake Cortex or OpenAI
- Order lookup and tracking
- Product search with vector embeddings
- Returns processing
- LaunchDarkly integration for feature flags and AI configuration
- Conversation history storage

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Snowflake Account** with Cortex enabled
3. **LaunchDarkly Account** for AI configuration management
4. **OpenAI API Key** (optional, for GPT-4 integration)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install

# Or install packages individually:
npm install @launchdarkly/node-server-sdk
npm install @launchdarkly/server-sdk-ai
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Snowflake Configuration
SNOWFLAKE_ACCOUNT=your_account_identifier
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=FARM_FRESH_PET_AI
SNOWFLAKE_SCHEMA=CHATBOT

# LaunchDarkly Configuration
LAUNCHDARKLY_SDK_KEY=sdk-xxxx-xxxx-xxxx-xxxx

# Optional: OpenAI Configuration
OPENAI_API_KEY=sk-xxxx
```

### 3. Set Up Snowflake Database

Run the SQL setup script in your Snowflake console:

```sql
-- Execute the contents of snowflake-setup.sql
```

This will:
- Create the necessary database and schema
- Set up tables for products, orders, and chat history
- Create Cortex functions
- Insert sample data
- Configure permissions

### 4. Configure LaunchDarkly

In your LaunchDarkly dashboard, create the following AI Configs:

#### System Prompt (`chatbot-system-prompt`)
```json
{
  "default": "You are a friendly and knowledgeable customer service representative for Farm Fresh Pet..."
}
```

#### Model Selection (`llm-model-selection`)
```json
{
  "default": {
    "provider": "snowflake",
    "model": "mixtral-8x7b",
    "temperature": 0.7,
    "maxTokens": 500
  }
}
```

### 5. Create Logs Directory

```bash
mkdir -p logs
```

### 6. Start the Backend Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on port 3001 (or the port specified in `.env`).

## API Endpoints

### Chat Endpoints

#### POST /api/chat/message
Send a chat message and receive AI response.

```json
{
  "message": "What's the status of order ORD-001?",
  "sessionId": "session-123",
  "userEmail": "customer@example.com"
}
```

#### GET /api/chat/history/:sessionId
Get chat history for a session.

### Order Endpoints

#### POST /api/orders/lookup
Look up an order by ID.

```json
{
  "orderId": "ORD-001",
  "email": "customer@example.com"
}
```

### Product Endpoints

#### GET /api/products/search?q=dog%20food&limit=5
Search for products using vector similarity.

### Returns Endpoints

#### POST /api/returns/initiate
Initiate a return request.

```json
{
  "orderId": "ORD-001",
  "items": ["P001"],
  "reason": "Product didn't meet expectations"
}
```

## Testing

### Test Chat Functionality

```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I need help with my order",
    "sessionId": "test-session-123",
    "userEmail": "test@example.com"
  }'
```

### Test Order Lookup

```bash
curl -X POST http://localhost:3001/api/orders/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-001",
    "email": "customer1@example.com"
  }'
```

## Monitoring

- Logs are stored in the `logs/` directory
- LaunchDarkly dashboard shows AI metrics and performance
- Monitor Snowflake credit usage for Cortex calls

## Troubleshooting

### Common Issues

1. **Snowflake Connection Failed**
   - Verify your account identifier format
   - Check network connectivity
   - Ensure CORTEX_USER role is granted

2. **LaunchDarkly Not Initializing**
   - Verify SDK key is correct
   - Check network connectivity
   - Ensure feature flags are created

3. **Chat Responses Not Working**
   - Check Snowflake Cortex is enabled
   - Verify model names are correct
   - Check logs for specific errors

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a process manager like PM2
3. Set up proper logging and monitoring
4. Configure SSL/TLS
5. Set up rate limiting and security headers
6. Use environment-specific LaunchDarkly environments

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Express API     │────▶│ Snowflake       │
│  + Chat Widget  │     │  + Routes        │     │ - Cortex LLM    │
└─────────────────┘     │  + Services      │     │ - Vector Store  │
                        └──────────────────┘     │ - Order Data    │
                               │                  └─────────────────┘
                               │                           
                               ▼                           
                        ┌──────────────────┐              
                        │  LaunchDarkly    │              
                        │  - AI Configs    │              
                        │  - Monitoring    │              
                        └──────────────────┘              
```

## License

Proprietary - Farm Fresh Pet