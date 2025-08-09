# Gravity Farms Petfood AI Chatbot

A production-ready AI-powered customer service chatbot for Gravity Farms Petfood, using LaunchDarkly AI Configs and Snowflake Cortex REST API.

## 🚀 Quick Start with Docker (Recommended)

### 1. Run Complete Application (Backend + Frontend + ChatWidget)

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Start everything: backend API + frontend website + chat widget
docker-compose --profile demo up

# 📱 Gravity Farms Frontend: http://localhost:3000
# 🔌 Chatbot API: http://localhost:3001
# 💬 Chat button appears in bottom-right corner
```

This runs the complete application with:
- **Backend API** (Express.js + Snowflake + LaunchDarkly)
- **Frontend Website** (Gravity Farms website with embedded chat widget)
- **Demo Mode** (no credentials needed - uses mock data)

### 2. Run Backend Only (For Integration)

```bash
# If you just need the API for your existing frontend
docker-compose up chatbot-backend

# The chatbot API will be available at http://localhost:3001
```

## 🏗️ Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Gravity Farms      │     │  Chatbot API     │     │ External Services│
│  Frontend (Vite)    │────▶│  (Docker)        │────▶│ - Snowflake     │
│  + ChatWidget       │     │  - Express       │     │ - LaunchDarkly  │
└─────────────────────┘     │  - AI Configs    │     └─────────────────┘
                            └──────────────────┘
```

## 📦 What's Included

### Backend Service (`gravity-farms-chatbot-backend/`)
- **Express.js API** with health checks and CORS support
- **Snowflake Cortex REST API** integration for LLM capabilities
- **LaunchDarkly AI Configs** for dynamic model and prompt management
- **Demo Mode** with mock data when credentials aren't available
- **Docker support** with optimized multi-stage builds

### Frontend Integration
- **ChatWidget** component added to existing Gravity Farms frontend
- **TypeScript** compatible implementation
- **Responsive design** for desktop and mobile
- **Real-time messaging** with typing indicators
- **Quick action buttons** for common queries

## 🎮 Demo Mode Features

When running without credentials, the chatbot provides:

- ✅ Mock product catalog (5 sample products)
- ✅ Sample order history (3 demo orders)
- ✅ Intelligent responses for common queries
- ✅ Simulated response delays for realism
- ✅ Console logging of metrics

Try these demo queries:
- "Hello" or "Hi" - Greeting responses
- "Show me my orders" - Display demo orders
- "What dog food do you have?" - Product search
- "I need to return something" - Return policy
- "Help" - General assistance

## 🔧 Production Setup

### 1. Environment Configuration

Copy the example environment file and configure it:

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your actual credentials
nano .env  # or use your preferred editor
```

Update the `.env` file with your credentials:

```bash
# Snowflake REST API Configuration
SNOWFLAKE_ACCOUNT_IDENTIFIER=your_account_identifier
SNOWFLAKE_PAT=your_personal_access_token

# LaunchDarkly Configuration
LAUNCHDARKLY_SDK_KEY=sdk-xxxx-xxxx-xxxx
LAUNCHDARKLY_AI_CONFIG_KEY=gravity-farms-chatbot-config

# Disable demo mode
DEMO_MODE=false

# Frontend API URL (for ChatWidget integration)
REACT_APP_API_URL=http://localhost:3001
```

### 2. LaunchDarkly AI Configs Setup

#### Create an AI Config in LaunchDarkly

1. Navigate to your LaunchDarkly instance and go to "AI Configs"
2. Click "Create AI Config" on the top-right side
3. Give your Config a name: "gravity-farms-chatbot-config"
4. Give the variation a name: "Claude Sonnet"
4. Select "Cortex" from the provider dropdown
5. Choose a model (e.g., `claude-3-5-sonnet` or similar)
6. Add your system message for the completion (paste the following):

**System Message:**
```
You are a friendly and knowledgeable customer service representative for Gravity Farms Petfood, a premium pet food store. You have access to order information, product details, and can help with returns. Always be helpful, concise, and empathetic to pet owners' concerns.

Context: {{context}}
```

7. Add your user message: Click "Add another message", then change the Role to "user." Then paste the following:

**User Message Template:**
```
{{userInput}}
```

7. Click "Review and save"

#### Configure Targeting

1. Click the "Targeting" tab on your AI Config
2. Click "Edit" on the default rule
3. Select your "Claude" variation from the dropdown
4. Click "Review and save" and confirm the changes

#### Copy the Config Key

1. Copy the key from the sidebar (e.g., "gravity-farms-chatbot-config")
2. Add this key to your `.env` file as `LAUNCHDARKLY_AI_CONFIG_KEY`

### 3. Snowflake Setup

> **Important**: Follow these steps carefully to ensure proper authentication with the Snowflake Cortex REST API.

#### Prerequisites

Before starting, ensure you have:
- ACCOUNTADMIN role access in your Snowflake account
- Access to Snowflake Cortex features (contact Snowflake support if not enabled)
- REST API access enabled for your account (contact Snowflake support if needed)

#### Step 1: Grant Cortex Permissions to Your Role

Grant the necessary Cortex permissions to your existing role:

1. **Switch to ACCOUNTADMIN role**:
   ```sql
   -- Switch to ACCOUNTADMIN role
   USE ROLE ACCOUNTADMIN;
   
   -- Verify your current role
   SELECT CURRENT_ROLE();
   ```

2. **Grant CORTEX_USER permissions**:
   ```sql
   -- Grant the CORTEX_USER database role to ACCOUNTADMIN
   GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE ACCOUNTADMIN;
   
   -- Verify the grant was successful
   SHOW GRANTS TO ROLE ACCOUNTADMIN;
   ```

3. **Test Cortex access**:
   ```sql
   -- Test that Cortex functions work
   SELECT SNOWFLAKE.CORTEX.COMPLETE(
       'claude-3-5-sonnet',
       'Hello, are you working?'
   ) as test_response;
   ```

   If this returns a response, Cortex is properly configured for your account.

#### Step 2: Create Personal Access Token (PAT)

1. **Via Snowflake UI (Snowsight)**:
   - Navigate to **Admin** → **Users & Roles**
   - Click on your username
   - Under **Programmatic Access Tokens**, click **"Generate new token"**
   - Name: `LD-Cortex-Chatbot`
   - Expiration: Choose an appropriate duration (e.g., 90 days)
   - Role: Select `ACCOUNTADMIN` (or whichever role you granted CORTEX_USER to)
   - Click **"Generate"**
   - **IMPORTANT**: Copy the token immediately - it won't be shown again!

2. **Via SQL Command** (replace YOUR_USERNAME with your actual username):
   ```sql
   -- Generate a PAT for your user
   SELECT SYSTEM$GENERATE_PROGRAMMATIC_ACCESS_TOKEN('YOUR_USERNAME', 90);
   ```

3. Add the token to your `.env` file:
   ```bash
   SNOWFLAKE_PAT=your_generated_token_here
   ```

#### Step 3: Configure Network Policy

Personal Access Tokens require a Network Policy for security. Follow these steps:

1. **Find Your IP Address**:
   ```bash
   # Get your public IPv4 address
   curl -4 -s ifconfig.me
   ```

2. **Create Network Policy via SQL** (replace YOUR_USERNAME with your actual username):
   ```sql
   -- Create a network policy for API access
   CREATE NETWORK POLICY IF NOT EXISTS CHATBOT_API_POLICY
       ALLOWED_IP_LIST = ('YOUR.IP.ADDRESS.HERE')
       COMMENT = 'Network policy for LaunchDarkly Cortex chatbot API access';

   -- Apply the policy to your user
   ALTER USER YOUR_USERNAME SET NETWORK_POLICY = CHATBOT_API_POLICY;
   ```

3. **Or via Snowflake UI**:
   - Go to **Admin** → **Security** → **Network Policies**
   - Click **"+ Network Policy"**
   - Name: `CHATBOT_API_POLICY`
   - Description: "Network policy for LaunchDarkly Cortex chatbot"
   - Add a new rule:
     - Name: `API_ACCESS`
     - Type: IPv4, Ingress
     - Add your IP address from step 1
   - Create the policy
   - Apply it to your user in **Admin** → **Users & Roles** → **Your User** → **Edit**

> **Important**: If your IP address changes (e.g., dynamic IP), you'll need to update the network policy.

#### Step 4: Get Your Account Identifier

The account identifier format is crucial for REST API access:

1. **Via Snowflake UI**:
   - Click your name in the bottom-left corner
   - Hover over your active account
   - Select **"View account details"**
   - Copy the **"Account/Server URL"** field

2. **Via SQL**:
   ```sql
   SELECT CURRENT_ACCOUNT();
   ```

3. **Format for `.env`**:
   ```bash
   # Include the full domain for REST API access
   SNOWFLAKE_ACCOUNT_IDENTIFIER=your-account.snowflakecomputing.com
   
   # Or if you have a regional deployment
   SNOWFLAKE_ACCOUNT_IDENTIFIER=your-account.region.aws.snowflakecomputing.com
   ```

> **Note**: For REST API access, always use the full URL format including `.snowflakecomputing.com`

#### Step 5: Verify Cortex Access

Run this diagnostic query to ensure Cortex is available:

```sql
-- Check if Cortex functions are available
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'claude-3-5-sonnet',
    'Hello, are you working?'
) as test_response;

-- If this fails, Cortex might not be enabled for your account
```

#### Step 6: Configure Environment Variables

Update your `.env` file with all the necessary values:

```bash
# Snowflake Configuration
SNOWFLAKE_ACCOUNT_IDENTIFIER=your-account.snowflakecomputing.com
SNOWFLAKE_PAT=your_personal_access_token_here
SNOWFLAKE_WAREHOUSE=DEFAULT_WH  # Or your preferred warehouse
SNOWFLAKE_ROLE=ACCOUNTADMIN  # Or whichever role you granted CORTEX_USER to

# Optional: If using specific database/schema
SNOWFLAKE_DATABASE=SNOWFLAKE
SNOWFLAKE_SCHEMA=CORTEX
```

#### Troubleshooting Common Issues

1. **"Permission denied" or "Not authorized" errors**:
   - Ensure you're using `ACCOUNTADMIN` role:
     ```sql
     USE ROLE ACCOUNTADMIN;
     ```
   - If you can't switch roles, ask your Snowflake administrator to grant you the necessary permissions
   - Verify CORTEX_USER role is granted:
     ```sql
     SHOW GRANTS TO ROLE ACCOUNTADMIN;
     ```

2. **404 Error on REST API calls**:
   - Ensure your account identifier includes the full domain
   - Verify Cortex is enabled: Contact Snowflake support if needed
   - Check that the `/api/v2/cortex/inference:complete` endpoint is available
   - Try this test:
     ```bash
     curl -X POST https://YOUR-ACCOUNT.snowflakecomputing.com/api/v2/cortex/inference:complete \
       -H "Authorization: Bearer YOUR_PAT" \
       -H "Content-Type: application/json" \
       -d '{"model":"claude-3-5-sonnet","messages":[{"role":"user","content":"Hi"}],"stream":false}'
     ```

3. **Authentication Failed (401/403)**:
   - Verify your PAT is valid and not expired
   - Ensure the Network Policy includes your current IP
   - Check that the user has the `SNOWFLAKE.CORTEX_USER` database role:
     ```sql
     SHOW GRANTS TO ROLE YOUR_ROLE_NAME;
     ```

4. **Model Not Found**:
   - Verify the model name (e.g., `claude-3-5-sonnet`, `llama3.1-8b`)
   - Some models may require additional permissions or credits
   - Test available models:
     ```sql
     SELECT SNOWFLAKE.CORTEX.COMPLETE('claude-3-5-sonnet', 'test');
     ```

5. **Network Policy Issues**:
   - If behind a corporate firewall, you may need to whitelist multiple IPs
   - Consider using a VPN with a static IP for consistent access
   - Temporarily disable network policy to test:
     ```sql
     ALTER USER YOUR_USER UNSET NETWORK_POLICY;
     ```

#### Additional Resources

- [Snowflake REST API Authentication Guide](https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/authentication)
- [Cortex REST API Documentation](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api)
- [Network Policies Documentation](https://docs.snowflake.com/en/user-guide/network-policies)
- [Personal Access Tokens Guide](https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/authentication#label-sfrest-authenticating-pat)

### 4. Run in Production Mode

```bash
# Start with real credentials
docker-compose up chatbot-backend
```

## 🔧 Manual Installation (Without Docker)

### Backend Setup

```bash
cd gravity-farms-chatbot-backend
npm install
npm start
```

### Frontend Integration

Add the ChatWidget to your existing React app:

```javascript
// 1. Copy the ChatWidget component to your project
cp -r gravity-farms-chatbot-frontend/src/components/ChatWidget.* your-app/src/components/

// 2. Import in your App.js
import ChatWidget from './components/ChatWidget';

// 3. Add to your JSX
function App() {
  return (
    <div>
      {/* Your existing components */}
      <ChatWidget />
    </div>
  );
}

// 4. Set the API URL in your .env
REACT_APP_API_URL=http://localhost:3001
```

## 📊 API Endpoints

### POST `/api/chat/message`
Send a message to the chatbot.

```json
{
  "message": "What products do you have for dogs?",
  "sessionId": "session-123",
  "userEmail": "customer@example.com"
}
```

**Response:**
```json
{
  "response": "We have several great dog food options...",
  "model": "claude-3-5-sonnet",
  "metrics": {
    "responseTime": 1250,
    "model": "claude-3-5-sonnet",
    "intent": "product_search"
  }
}
```

### GET `/api/chat/history/:sessionId`
Retrieve chat history for a session.

### GET `/health`
Health check endpoint for monitoring.

## 🚀 Benefits of AI Configs

With this setup, you can now:

- **Change models at runtime** without code deployment
- **Update prompts and system messages** instantly
- **A/B test different configurations** in real-time
- **Track usage metrics and performance** automatically
- **Roll back changes quickly** if needed
- **Monitor token usage and response times** for cost optimization

## 🔐 Security Considerations

- Never commit `.env` files with real credentials
- Use environment variables for all sensitive data
- Enable CORS only for trusted domains in production
- Implement rate limiting for production use
- Use HTTPS in production environments
- Rotate Personal Access Tokens regularly

## 🚢 Local Docker Deployment

The application is optimized for local development and testing using Docker Compose:

### Quick Start
```bash
# Run everything locally
docker-compose --profile demo up

# Access the application
# 📱 Frontend: http://localhost:3000
# 🔌 API: http://localhost:3001
```

### Production Mode
```bash
# 1. Set up your .env file with real credentials
# 2. Update docker-compose.yml to set DEMO_MODE=false
# 3. Run in production mode
docker-compose up chatbot-backend
```

### Development Mode
```bash
# Run backend only for integration with existing frontends
docker-compose up chatbot-backend
```

## 🧪 Testing

### In Demo Mode
```bash
# Test the API
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "sessionId": "test-session",
    "userEmail": "test@example.com"
  }'
```

### With Real Data
1. Set up LaunchDarkly AI Config following the setup guide
2. Configure Snowflake Personal Access Token
3. Update `.env` with credentials
4. Run integration tests

## 📈 Monitoring

The service logs important metrics:
- Response times
- Detected intents
- Model usage (demo/production)
- Error rates
- Token usage (when using real AI Configs)

In production, these metrics are sent to LaunchDarkly for analysis.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in demo mode
5. Submit a pull request

## 📝 License

Copyright (c) 2024 Gravity Farms Petfood

---

## Need Help?

- 📧 Email: support@gravityfarms.com
- 📚 Docs: See `/docs` folder
- 🐛 Issues: GitHub Issues

**Made with ❤️ for pet lovers everywhere**