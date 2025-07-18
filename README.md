# Gravity Farms Petfood AI Chatbot

A production-ready AI-powered customer service chatbot for Gravity Farms Petfood, with full Docker support and demo mode for easy testing.

## 🚀 Quick Start with Docker (Recommended)

### 1. Run Complete Application (Backend + Frontend with ChatWidget)

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Important: Run from the root directory containing docker-compose.yml
# You should see these directories: gravity-farms-chatbot-backend/, farm-fresh-pet-frontend/

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

### 3. Production Mode with Real Credentials

Create a `.env` file in the root directory:

```bash
# Snowflake Configuration
SNOWFLAKE_ACCOUNT=your_account_identifier
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=GRAVITY_FARMS_PETFOOD_AI
SNOWFLAKE_SCHEMA=CHATBOT

# LaunchDarkly Configuration
LAUNCHDARKLY_SDK_KEY=sdk-xxxx-xxxx-xxxx

# Disable demo mode
DEMO_MODE=false
```

Then run:

```bash
docker-compose up chatbot-backend
```

## 🏗️ Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Gravity Farms      │     │  Chatbot API     │     │ External Services│
│  Frontend (Vite)    │────▶│  (Docker)        │────▶│ - Snowflake     │
│  + ChatWidget       │     │  - Express       │     │ - LaunchDarkly  │
└─────────────────────┘     │  - Demo Mode     │     └─────────────────┘
                            └──────────────────┘
```

## 📦 What's Included

### Backend Service (`gravity-farms-chatbot-backend/`)
- **Express.js API** with health checks and CORS support
- **Snowflake Cortex** integration for LLM capabilities
- **LaunchDarkly** integration for configuration management
- **Demo Mode** with mock data when credentials aren't available
- **Docker support** with optimized multi-stage builds

### Frontend Integration
- **ChatWidget** component added to existing Gravity Farms frontend
- **TypeScript** compatible implementation
- **Responsive design** for desktop and mobile
- **Real-time messaging** with typing indicators
- **Quick action buttons** for common queries

### Database Setup
- **Snowflake SQL scripts** for schema creation
- **Sample data** for testing
- **Cortex functions** for AI processing

## 🎮 Demo Mode Features

When running without credentials, the chatbot provides:

- ✅ Mock product catalog (5 sample products)
- ✅ Sample order history (3 demo orders)
- ✅ Intelligent responses for common queries
- ✅ Simulated response delays for realism
- ✅ In-memory chat history
- ✅ Console logging of metrics

Try these demo queries:
- "Hello" or "Hi" - Greeting responses
- "Show me my orders" - Display demo orders
- "What dog food do you have?" - Product search
- "I need to return something" - Return policy
- "Help" - General assistance

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

### GET `/api/chat/history/:sessionId`
Retrieve chat history for a session.

### GET `/health`
Health check endpoint for monitoring.

## 🔐 Security Considerations

- Never commit `.env` files with real credentials
- Use environment variables for all sensitive data
- Enable CORS only for trusted domains in production
- Implement rate limiting for production use
- Use HTTPS in production environments

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
1. Set up Snowflake tables using `snowflake-setup.sql`
2. Configure LaunchDarkly feature flags
3. Update `.env` with credentials
4. Run integration tests

## 📈 Monitoring

The service logs important metrics in demo mode:
- Response times
- Detected intents
- Model usage (demo/production)
- Error rates

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