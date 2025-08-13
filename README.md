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

**Important**: You only need ONE `.env` file at the root of the project. All services will use this single configuration file.

```bash
# Create your .env file in the root directory
cp env.example .env

# Edit the .env file with your actual credentials
nano .env  # or use your preferred editor
```

Update the `.env` file in the root directory with your credentials:

```bash
# Snowflake REST API Configuration
SNOWFLAKE_ACCOUNT_IDENTIFIER=your-account.region.snowflakecomputing.com  # e.g., ppb67821.us-east-1.snowflakecomputing.com
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

#### Step 2: Configure Network Policy

> ⚠️ **CRITICAL**: You MUST set up the network policy BEFORE generating the PAT token!
> PATs generated without a network policy will not work and will return "Network policy is required" errors.

Personal Access Tokens require a Network Policy for security. This must be done before generating the PAT:

1. **Find Your IP Address**:
   ```bash
   # Get your public IPv4 address
   curl -4 -s ifconfig.me
   ```

2. **Create and Apply Network Policy via SQL**:
   
   Run these commands in order in your Snowflake SQL worksheet:
   
   ```sql
   -- Step 1: Switch to ACCOUNTADMIN role (REQUIRED)
   USE ROLE ACCOUNTADMIN;

   -- Step 2: Get your current username
   SELECT CURRENT_USER();
   -- Note this username for the next steps

   -- Step 3: Create the network policy with your IP
   -- Replace YOUR.IP.ADDRESS.HERE with the IP from step 1 above
   CREATE OR REPLACE NETWORK POLICY CHATBOT_API_POLICY
       ALLOWED_IP_LIST = ('YOUR.IP.ADDRESS.HERE')
       COMMENT = 'Network policy for LaunchDarkly Cortex chatbot API access';

   -- Step 4: Apply the policy to your user
   -- Replace YOUR_USERNAME with the result from Step 2
   ALTER USER YOUR_USERNAME SET NETWORK_POLICY = CHATBOT_API_POLICY;

   -- Step 5: Verify the policy was created
   SHOW NETWORK POLICIES LIKE 'CHATBOT_API_POLICY';

   -- Step 6: Verify it's applied to your user
   SHOW PARAMETERS FOR USER YOUR_USERNAME;
   -- Look for NETWORK_POLICY in the results
   ```

3. **Or via Snowflake UI**:
   - Click on your name at the bottom left, and ensure your role is set to ACCOUNTADMIN
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

#### Step 3: Create Personal Access Token (PAT)

> **Important**: Only generate the PAT AFTER the network policy is configured and applied to your user!

1. **Via Snowflake UI (Snowsight)** (Recommended):
   - First, verify the network policy is applied by running this SQL in a worksheet:
     ```sql
     -- Check user parameters
     SHOW PARAMETERS FOR USER YOUR_USERNAME;
     -- Look for NETWORK_POLICY in the results
     
     -- Alternative: Check the network policy directly
     SHOW NETWORK POLICIES;
     -- Verify CHATBOT_API_POLICY exists
     
     -- To see which users have the policy:
     SELECT * FROM TABLE(RESULT_SCAN(LAST_QUERY_ID())) 
     WHERE "name" = 'CHATBOT_API_POLICY';
     ```
   - Once confirmed, click on your name at the bottom left, ensure role is ACCOUNTADMIN
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
   -- First verify the network policy is set
   DESC USER YOUR_USERNAME;
   -- Look for NETWORK_POLICY = CHATBOT_API_POLICY
   
   -- Then generate a PAT for your user
   SELECT SYSTEM$GENERATE_PROGRAMMATIC_ACCESS_TOKEN('YOUR_USERNAME', 90);
   ```

3. Add the token to your `.env` file:
   ```bash
   SNOWFLAKE_PAT=your_generated_token_here
   ```

#### Step 4: Get Your Account Identifier

The account identifier format is crucial for REST API access:

1. **Via SQL** (Recommended):
   ```sql
   -- Get your account locator and region
   SELECT CURRENT_ACCOUNT() as account_locator;
   SELECT CURRENT_REGION() as region;
   ```

2. **Via Snowflake UI**:
   - Click your name in the bottom-left corner
   - Hover over your active account
   - Select **"View account details"**
   - Look for **"Account"** (e.g., PPB67821)
   - Look for **"Region"** (e.g., AWS_US_EAST_1)

3. **Format for `.env`**:
   ```bash
   # Format: <account_locator>.<region>.snowflakecomputing.com
   # The region format for REST API is lowercase with hyphens
   
   # Examples:
   # For account PPB67821 in AWS_US_EAST_1:
   SNOWFLAKE_ACCOUNT_IDENTIFIER=ppb67821.us-east-1.snowflakecomputing.com
   
   # For other regions:
   # AWS_US_WEST_2 → account.us-west-2.snowflakecomputing.com
   # AZURE_EASTUS2 → account.east-us-2.azure.snowflakecomputing.com
   # GCP_US_CENTRAL1 → account.us-central1.gcp.snowflakecomputing.com
   ```

> **Important**: The account identifier must be lowercase and the region format changes:
> - `AWS_US_EAST_1` becomes `us-east-1`
> - `AZURE_EASTUS2` becomes `east-us-2.azure`
> - Remove `PUBLIC.` prefix if present

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

Create a single `.env` file in the **root directory** of the project (not in subdirectories):

```bash
# Location: /LaunchDarkly-Snowflake-Chatbot/.env (root directory)

# Snowflake Configuration
SNOWFLAKE_ACCOUNT=PPB67821  # Your account locator from CURRENT_ACCOUNT()
SNOWFLAKE_ACCOUNT_IDENTIFIER=ppb67821.us-east-1.snowflakecomputing.com  # Format: account.region.snowflakecomputing.com
SNOWFLAKE_PAT=your_personal_access_token_here  # Generate this in Step 3 (AFTER network policy)
SNOWFLAKE_USER=your_snowflake_username  # Your Snowflake username
SNOWFLAKE_PASSWORD=not_used_with_pat  # Not needed when using PAT
SNOWFLAKE_WAREHOUSE=DEFAULT_WH  # Or your preferred warehouse
SNOWFLAKE_DATABASE=GRAVITY_FARMS_PETFOOD_AI
SNOWFLAKE_SCHEMA=CHATBOT
SNOWFLAKE_ROLE=ACCOUNTADMIN  # Must have CORTEX_USER permissions
SNOWFLAKE_REGION=AWS_US_EAST_1  # Optional: for reference
SNOWFLAKE_NETWORK_POLICY=CHATBOT_API_POLICY  # The network policy name from Step 2

# LaunchDarkly Configuration
LAUNCHDARKLY_SDK_KEY=sdk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
LAUNCHDARKLY_CLIENT_SIDE_ID=xxxxxxxxxxxxxxxxxxxxxxxx
LAUNCHDARKLY_AI_CONFIG_KEY=gravity-farms-chatbot-config

# Demo Mode
DEMO_MODE=false  # Set to true to use mock data without credentials
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

#### Common Setup Issues & Solutions

1. **"Network policy is required" error**:
   - You generated the PAT before setting up the network policy
   - Solution: Set up network policy first (Step 2), then regenerate PAT (Step 3)

2. **"Programmatic access token is invalid" error**:
   - The PAT is expired, revoked, or for the wrong account
   - Solution: Generate a new PAT token after verifying network policy is active

3. **"401 Unauthorized" errors**:
   - Check the order: Network Policy (Step 2) → Generate PAT (Step 3)
   - Verify network policy is applied: `DESC USER YOUR_USERNAME;`
   - Regenerate PAT if it was created before the network policy

4. **IP address changes (VPN, different network)**:
   - Update the network policy with your new IP
   - Or use a broader range for development: `ALLOWED_IP_LIST = ('0.0.0.0/0')`
   - ⚠️ Only use `0.0.0.0/0` for testing, not production!

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