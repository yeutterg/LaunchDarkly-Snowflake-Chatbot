# Farm Fresh Pet AI Chatbot Implementation Guide

## Project Context for Claude Code

### Project Overview
You are implementing an AI-powered customer service chatbot for Farm Fresh Pet, an e-commerce pet store. The chatbot will be integrated into the existing React frontend application (https://github.com/s-shindeldecker/farm-fresh-pet-frontend.git) and will use:
- **Snowflake Cortex** for LLM hosting and vector storage (RAG)
- **LaunchDarkly AI Configs SDK** for prompt management and analytics
- **OpenAI-compatible models** through Snowflake Cortex (if available) or native Cortex models

### Technical Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Backend API     │────▶│ Snowflake       │
│  + Chatbot UI   │     │  (Node/Python)   │     │ - Cortex LLM    │
└─────────────────┘     └──────────────────┘     │ - Vector Store  │
                               │                  │ - Order Data    │
                               │                  └─────────────────┘
                               │                           
                               ▼                           
                        ┌──────────────────┐              
                        │  LaunchDarkly    │              
                        │  - AI Configs    │              
                        │  - Monitoring    │              
                        └──────────────────┘              
```

### Chatbot Capabilities
1. **Order Management**
   - Look up orders by order number or customer email
   - Track shipment status and delivery estimates
   - View order details and items purchased

2. **Returns Processing**
   - Initiate return requests
   - Generate return labels
   - Check return policy eligibility

3. **Product Information**
   - Answer questions about pet food ingredients
   - Provide product recommendations based on pet type/needs
   - Check product availability and pricing

4. **General Support**
   - Store hours and location information
   - Shipping policies
   - FAQ responses

### Implementation Requirements

#### Frontend Integration
- Add a chat widget to the existing React app
- Use a floating chat button in the bottom-right corner
- Implement real-time message streaming
- Store chat history in session storage
- Add typing indicators and loading states

#### Backend API Endpoints
```
POST /api/chat/message
GET /api/chat/history/:sessionId
POST /api/orders/lookup
POST /api/returns/initiate
GET /api/products/search
```

#### Snowflake Cortex Integration
- Use Cortex LLM functions for chat responses
- Implement RAG with vector embeddings for product/order data
- Store conversation history for context
- Use Snowpark for Python/Java integration

#### LaunchDarkly Integration
- Manage system prompts through AI Configs
- A/B test different prompt variations
- Track metrics: response time, user satisfaction, resolution rate
- Feature flag for enabling/disabling chatbot

## Snowflake Setup Instructions

### 1. Initial Snowflake Configuration

```sql
-- Create database and schema
CREATE DATABASE IF NOT EXISTS FARM_FRESH_PET_AI;
USE DATABASE FARM_FRESH_PET_AI;
CREATE SCHEMA IF NOT EXISTS CHATBOT;
USE SCHEMA CHATBOT;

-- Create tables for RAG data
CREATE TABLE IF NOT EXISTS PRODUCTS (
    product_id VARCHAR,
    name VARCHAR,
    description TEXT,
    category VARCHAR,
    price DECIMAL(10,2),
    ingredients TEXT,
    nutritional_info TEXT,
    embedding VECTOR(FLOAT, 1536)  -- For OpenAI embeddings
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

-- Create vector search index
CREATE VECTOR SEARCH INDEX products_embedding_index
ON PRODUCTS(embedding)
METRIC_TYPE = 'COSINE';
```

### 2. Cortex LLM Setup

```sql
-- Enable Cortex in your account (requires CORTEX_USER role)
USE ROLE CORTEX_USER;

-- Test available models
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'llama2-70b-chat',
    'What models are available in Snowflake Cortex?'
);

-- Create a function for chat completion
CREATE OR REPLACE FUNCTION CHATBOT_RESPONSE(
    prompt TEXT,
    context TEXT,
    model_name TEXT DEFAULT 'mixtral-8x7b'
)
RETURNS TEXT
LANGUAGE SQL
AS
$$
    SELECT SNOWFLAKE.CORTEX.COMPLETE(
        model_name,
        CONCAT(
            'You are a helpful customer service assistant for Farm Fresh Pet store. ',
            'Context: ', context, '\n\n',
            'Customer: ', prompt, '\n\n',
            'Assistant:'
        )
    )
$$;
```

### 3. Snowpark Python Setup

```python
# snowflake_connector.py
import snowflake.connector
from snowflake.snowpark import Session
from snowflake.cortex import Complete, ExtractAnswer, Sentiment, Translate

class SnowflakeChatbot:
    def __init__(self, account, user, password, warehouse, database, schema):
        self.connection_params = {
            "account": account,
            "user": user,
            "password": password,
            "warehouse": warehouse,
            "database": database,
            "schema": schema
        }
        self.session = Session.builder.configs(self.connection_params).create()
    
    def generate_response(self, user_message, context=""):
        # Use Cortex for response generation
        response = Complete(
            model="mixtral-8x7b",
            prompt=f"""System: You are a helpful customer service assistant for Farm Fresh Pet.
            Context: {context}
            User: {user_message}
            Assistant:""",
            session=self.session
        )
        return response
    
    def search_products(self, query, top_k=5):
        # Generate embedding for query
        query_embedding = self.generate_embedding(query)
        
        # Vector search in products
        results = self.session.sql(f"""
            SELECT product_id, name, description, 
                   VECTOR_COSINE_SIMILARITY(embedding, {query_embedding}) as similarity
            FROM PRODUCTS
            ORDER BY similarity DESC
            LIMIT {top_k}
        """).collect()
        
        return results
```

### 4. API Keys and External Model Setup

For OpenAI models through Snowflake Cortex:

```sql
-- Create external access integration for OpenAI
CREATE OR REPLACE NETWORK RULE openai_network_rule
    MODE = EGRESS
    TYPE = HOST_PORT
    VALUE_LIST = ('api.openai.com:443');

CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION openai_access_integration
    ALLOWED_NETWORK_RULES = (openai_network_rule)
    ENABLED = TRUE;

-- Create secret for OpenAI API key
CREATE OR REPLACE SECRET openai_api_key
    TYPE = GENERIC_STRING
    SECRET_STRING = 'sk-your-openai-api-key-here';

-- Create UDF for OpenAI calls
CREATE OR REPLACE FUNCTION CALL_OPENAI_CHAT(prompt TEXT)
RETURNS TEXT
LANGUAGE PYTHON
RUNTIME_VERSION = '3.8'
HANDLER = 'call_openai'
EXTERNAL_ACCESS_INTEGRATIONS = (openai_access_integration)
SECRETS = ('openai_key' = openai_api_key)
PACKAGES = ('requests')
AS
$$
import requests
import json
import _snowflake

def call_openai(prompt):
    api_key = _snowflake.get_secret('openai_key')
    
    response = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json={
            'model': 'gpt-4-turbo-preview',
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': 0.7
        }
    )
    
    return response.json()['choices'][0]['message']['content']
$$;
```

## LaunchDarkly Setup Instructions

### 1. Create LaunchDarkly Account and Project

1. Sign up at https://launchdarkly.com
2. Create a new project called "farm-fresh-pet"
3. Note your SDK keys from the Account Settings

### 2. Install LaunchDarkly AI SDK

```bash
# For Node.js backend
npm install @launchdarkly/node-server-sdk @launchdarkly/ai-sdk

# For Python backend
pip install launchdarkly-server-sdk launchdarkly-ai-sdk
```

### 3. Configure AI Configs in LaunchDarkly

Create the following AI Configs in the LaunchDarkly dashboard:

#### System Prompt Config
```json
{
  "key": "chatbot-system-prompt",
  "name": "Chatbot System Prompt",
  "kind": "multiline-text",
  "variations": [
    {
      "value": "You are a friendly and knowledgeable customer service representative for Farm Fresh Pet, a premium pet food store. You have access to order information, product details, and can help with returns. Always be helpful, concise, and empathetic to pet owners' concerns.",
      "name": "default"
    },
    {
      "value": "You are Farm Fresh Pet's AI assistant. You specialize in helping customers with orders, product information, and returns. Provide accurate, helpful responses while maintaining a warm, professional tone. If you don't know something, offer to connect the customer with a human representative.",
      "name": "professional"
    }
  ]
}
```

#### Model Selection Config
```json
{
  "key": "llm-model-selection",
  "name": "LLM Model Selection",
  "kind": "json",
  "variations": [
    {
      "value": {
        "provider": "snowflake",
        "model": "mixtral-8x7b",
        "temperature": 0.7,
        "maxTokens": 500
      },
      "name": "snowflake-mixtral"
    },
    {
      "value": {
        "provider": "openai",
        "model": "gpt-4-turbo-preview",
        "temperature": 0.7,
        "maxTokens": 500
      },
      "name": "openai-gpt4"
    }
  ]
}
```

### 4. Implement LaunchDarkly in Your Code

```javascript
// launchdarkly-config.js
const LaunchDarkly = require('@launchdarkly/node-server-sdk');
const { AIConfig, AIConfigTracker } = require('@launchdarkly/ai-sdk');

class LDChatbotConfig {
    constructor(sdkKey) {
        this.ldClient = LaunchDarkly.init(sdkKey);
        this.aiTracker = new AIConfigTracker(this.ldClient);
    }

    async getSystemPrompt(userContext) {
        await this.ldClient.waitForInitialization();
        
        const config = await this.ldClient.variation(
            'chatbot-system-prompt',
            userContext,
            'You are a helpful assistant.'
        );
        
        return config;
    }

    async getModelConfig(userContext) {
        await this.ldClient.waitForInitialization();
        
        const config = await this.ldClient.variation(
            'llm-model-selection',
            userContext,
            {
                provider: 'snowflake',
                model: 'llama2-70b-chat',
                temperature: 0.7,
                maxTokens: 500
            }
        );
        
        return config;
    }

    async trackChatMetrics(userContext, metrics) {
        // Track custom metrics
        this.ldClient.track('chat-interaction', userContext, metrics);
        
        // Track AI-specific metrics
        this.aiTracker.trackDuration('response-time', metrics.duration);
        this.aiTracker.trackTokenUsage('tokens-used', metrics.tokens);
        this.aiTracker.trackFeedback('user-satisfaction', metrics.satisfaction);
    }
}
```

### 5. Integration Code Example

```javascript
// chatbot-service.js
const express = require('express');
const { SnowflakeConnector } = require('./snowflake-connector');
const { LDChatbotConfig } = require('./launchdarkly-config');

const app = express();
const ldConfig = new LDChatbotConfig(process.env.LD_SDK_KEY);
const snowflake = new SnowflakeConnector(/* connection params */);

app.post('/api/chat/message', async (req, res) => {
    const { message, sessionId, userEmail } = req.body;
    
    // Get LaunchDarkly configurations
    const userContext = {
        key: sessionId,
        email: userEmail,
        custom: { tier: 'premium' }
    };
    
    const systemPrompt = await ldConfig.getSystemPrompt(userContext);
    const modelConfig = await ldConfig.getModelConfig(userContext);
    
    const startTime = Date.now();
    
    try {
        // Generate response based on model config
        let response;
        if (modelConfig.provider === 'snowflake') {
            response = await snowflake.generateResponse(
                message,
                systemPrompt,
                modelConfig.model
            );
        } else if (modelConfig.provider === 'openai') {
            response = await snowflake.callOpenAI(
                `${systemPrompt}\n\nUser: ${message}\nAssistant:`
            );
        }
        
        // Track metrics
        const metrics = {
            duration: Date.now() - startTime,
            tokens: response.length / 4, // Rough estimate
            satisfaction: null, // Will be updated based on user feedback
            model: modelConfig.model,
            provider: modelConfig.provider
        };
        
        await ldConfig.trackChatMetrics(userContext, metrics);
        
        res.json({
            response: response,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});
```

## API Keys Required

1. **Snowflake Account Credentials**
   - Account identifier
   - Username and password
   - Warehouse name
   - CORTEX_USER role access

2. **LaunchDarkly SDK Key**
   - Server-side SDK key from your LD project
   - Client-side ID for frontend (if needed)

3. **OpenAI API Key** (Optional, if using OpenAI models)
   - Sign up at https://platform.openai.com
   - Create an API key
   - Add billing information
   - Estimated cost: ~$0.01-0.03 per chat interaction

## Sample Data for Testing

```sql
-- Insert sample products
INSERT INTO PRODUCTS (product_id, name, description, category, price, ingredients)
VALUES
    ('P001', 'Premium Dog Food - Chicken & Rice', 'High-quality dog food with real chicken', 'Dog Food', 29.99, 'Chicken, Brown Rice, Vegetables'),
    ('P002', 'Grain-Free Cat Food - Salmon', 'Nutritious grain-free formula for cats', 'Cat Food', 24.99, 'Salmon, Sweet Potato, Peas'),
    ('P003', 'Puppy Training Treats', 'Small, soft treats perfect for training', 'Treats', 12.99, 'Beef, Whole Wheat, Carrots');

-- Insert sample orders
INSERT INTO ORDERS (order_id, customer_email, order_date, status, tracking_number, total_amount)
VALUES
    ('ORD-001', 'customer@example.com', CURRENT_TIMESTAMP(), 'Shipped', 'TRK123456', 54.98),
    ('ORD-002', 'petlover@example.com', CURRENT_TIMESTAMP() - INTERVAL '2 days', 'Processing', NULL, 37.98);
```

## Environment Variables

```bash
# .env file
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=FARM_FRESH_PET_AI
SNOWFLAKE_SCHEMA=CHATBOT

LAUNCHDARKLY_SDK_KEY=sdk-xxxx-xxxx-xxxx
LAUNCHDARKLY_CLIENT_ID=xxxx

OPENAI_API_KEY=sk-xxxx  # Optional

PORT=3001
NODE_ENV=development
```

## Next Steps

1. **Clone and setup the frontend repository**
   ```bash
   git clone https://github.com/s-shindeldecker/farm-fresh-pet-frontend.git
   cd farm-fresh-pet-frontend
   npm install
   ```

2. **Create backend API service**
   - Initialize Node.js/Python project
   - Implement API endpoints
   - Connect to Snowflake and LaunchDarkly

3. **Add chat UI component to React app**
   - Create ChatWidget component
   - Implement WebSocket or polling for real-time chat
   - Add to main App component

4. **Deploy and test**
   - Test locally with sample data
   - Deploy backend to cloud provider
   - Configure production credentials
   - Monitor through LaunchDarkly dashboard

## Monitoring and Optimization

1. **LaunchDarkly Metrics to Track**
   - Average response time
   - Token usage per conversation
   - User satisfaction scores
   - Error rates by model
   - Feature adoption rate

2. **Snowflake Performance**
   - Query execution time
   - Warehouse credit usage
   - Vector search performance
   - Data freshness for RAG

3. **A/B Testing Ideas**
   - Different system prompts
   - Model selection (Mixtral vs GPT-4)
   - Response length variations
   - Conversation flow patterns