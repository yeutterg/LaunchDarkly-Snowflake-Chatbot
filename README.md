# Gravity Farms Petfood AI Chatbot

A production-ready AI-powered customer service chatbot for Gravity Farms Petfood, using LaunchDarkly AI Configs and Snowflake Cortex REST API.

## 🚀 Quick Start with Docker (Recommended)

### 1. Run Complete Application (Backend + Frontend with ChatWidget)

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Start both backend and the existing Gravity Farms frontend with ChatWidget
docker-compose --profile demo up

# 📱 Gravity Farms Frontend: http://localhost:3000
# 🔌 Chatbot API: http://localhost:3001
# 💬 Chat button appears in bottom-right corner
```

The existing Gravity Farms website now includes the AI chatbot widget. No credentials needed for demo mode!

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

### 1. LaunchDarkly AI Config Setup

#### Create an AI Config in LaunchDarkly

1. Navigate to your LaunchDarkly instance and go to "AI Configs"
2. Click "Create AI Config" on the top-right side
3. Give your Config a name (e.g., "gravity-farms-chatbot-config")
4. Select "Cortex" from the provider dropdown
5. Choose a model (e.g., `claude-3-5-sonnet` or `mixtral-8x7b`)
6. Add your messages for the completion:

**System Message:**
```
You are a friendly and knowledgeable customer service representative for Gravity Farms Petfood, a premium pet food store. You have access to order information, product details, and can help with returns. Always be helpful, concise, and empathetic to pet owners' concerns.

Context: {{context}}
```

**User Message Template:**
```
{{userInput}}
```

7. Click "Review and save"

#### Configure Targeting

1. Click the "Targeting" tab on your AI Config
2. Click "Edit" on the default rule
3. Select your variation from the dropdown
4. Click "Review and save" and confirm the changes

#### Copy the Config Key

1. Copy the key from the sidebar (e.g., "gravity-farms-chatbot-config")
2. Add this key to your `.env` file as `LAUNCHDARKLY_AI_CONFIG_KEY`

### 2. Snowflake Setup

#### Create Personal Access Token

1. Log into your Snowflake web interface
2. Go to **Admin** → **Users** → **Your Username**
3. Click **"Keys & Tokens"**
4. Click **"Create Token"**
5. Set an expiration date and copy the token
6. Make sure your user has the `SNOWFLAKE.CORTEX_USER` role

#### Account Identifier

Find your account identifier:
- **Traditional format**: URL will be `https://your-account-identifier.snowflakecomputing.com`
- **New format**: URL will be `https://app.snowflake.com/your-account-identifier`

Your account identifier is either:
- The part before `.snowflakecomputing.com` (traditional)
- The part after `app.snowflake.com/` (new format)

### 3. Environment Configuration

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
SNOWFLAKE_ACCOUNT_IDENTIFIER=your_account_identifier.snowflakecomputing.com
SNOWFLAKE_PAT=your_personal_access_token

# LaunchDarkly Configuration
LAUNCHDARKLY_SDK_KEY=sdk-xxxx-xxxx-xxxx
LAUNCHDARKLY_AI_CONFIG_KEY=gravity-farms-chatbot-config

# Disable demo mode
DEMO_MODE=false

# Frontend API URL (for ChatWidget integration)
REACT_APP_API_URL=http://localhost:3001
```

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

## 🚢 Deployment Options

### Using Docker Hub

```bash
# Build and push to Docker Hub
docker build -t yourusername/gravity-farms-chatbot ./gravity-farms-chatbot-backend
docker push yourusername/gravity-farms-chatbot

# Run from Docker Hub
docker run -p 3001:3001 -e DEMO_MODE=true yourusername/gravity-farms-chatbot
```

### Cloud Deployment

The Docker image is compatible with:
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **Azure Container Instances**
- **Heroku** (with container registry)
- **DigitalOcean App Platform**

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gravity-farms-chatbot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chatbot
  template:
    metadata:
      labels:
        app: chatbot
    spec:
      containers:
      - name: chatbot
        image: gravity-farms-chatbot:latest
        ports:
        - containerPort: 3001
        env:
        - name: DEMO_MODE
          value: "false"
        envFrom:
        - secretRef:
            name: chatbot-secrets
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