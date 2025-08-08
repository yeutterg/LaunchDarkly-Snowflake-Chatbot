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

#### Create Personal Access Token

1. Log into your Snowflake web interface
2. Go to **Admin** → **Users & roles** → **Your Username**
3. Under Programmatic access tokens, click **"Generate new token"**
4. Give it a name like "LD-Cortex-Chatbot" and an appropriate expiration date. Choose the appropriate role (for me it was ACCOUNTADMIN"). Click **"Generate"**
5. Copy the token, then paste it into `.env` as `SNOWFLAKE_PAT`
6. Make sure your user has the `SNOWFLAKE.CORTEX_USER` role

#### Create Network Policy

If you see a warning about a missing network policy, do the following (instructions only for the new Snowsight interface):

1. In Snowflake, go to **Admin** → **Security** → **Network Policies**
2. Ensure your Role is set to an Admin role, such as ACCOUNTADMIN (click on your name at the bottom left, then **Switch Role**)
3. Click **"+ Network Policy"**
4. Give it a name like "LDCORTEXCHATBOT"
5. In the comment box, add a description like "Network policy for LaunchDarkly + Snowflake Cortex chatbot demo"
6. Click **New rule**
7. Give it a name like "[yourname]MacBook" (no spaces allowed) and select the appropriate database (e.g. FARM_FRESH_PET)
8. Under Type, select IPv4 and Ingress
9. Find your public IPv4 address by running the following in your Terminal:
```bash
curl -4 -s ifconfig.me
```
10. In **Search or add identifier,** paste your IPv4 address and hit Return on your keyboard.
11. Click **Create Network Rule**
12. Click **Create Network Policy**
13. Go back to **Settings** → **Admin** → **Users & roles** → **Your Username**
14. Ensure there is no longer a warning about a Network Policy, and that your role (e.g. ACCOUNTADMIN) is now listed under Privileges.

Your PAT will now only work from the allowed IP addresses.

#### Account Identifier

Look at the URL bar to find your account identifier:
- **Classic interface**: URL will be `https://your-account-identifier.snowflakecomputing.com`
- **New Snowsight interface**: URL will be `https://app.snowflake.com/your-account-identifier`

Your account identifier is either:
- The part before `.snowflakecomputing.com` (classic)
- The part after `app.snowflake.com/` (Snowsight)

Paste this into `.env` under `SNOWFLAKE_ACCOUNT_IDENTIFIER`

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