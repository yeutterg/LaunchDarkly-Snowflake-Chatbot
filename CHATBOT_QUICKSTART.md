# Farm Fresh Pet Chatbot - Quick Start Guide

## What's Been Implemented

I've successfully implemented a complete AI-powered customer service chatbot for Farm Fresh Pet with the following components:

### Frontend Components (React)
- **ChatWidget**: Floating chat button that opens a chat interface
- **ChatMessage**: Displays user and assistant messages with timestamps
- **ChatInput**: Text input with send functionality
- **ChatContext**: State management for chat sessions

### Backend API (Node.js/Express)
- **Chat Service**: Handles message processing and AI responses
- **Snowflake Integration**: Connects to Snowflake Cortex for LLM capabilities
- **LaunchDarkly Integration**: Manages AI configurations and tracking
- **API Endpoints**: Chat, orders, products, and returns

### Key Features
- Real-time chat with AI assistant
- Order lookup and tracking
- Product search with vector embeddings
- Returns processing
- Session persistence
- Conversation history
- A/B testing support via LaunchDarkly

## Quick Setup Steps

### 1. Prerequisites
- Docker and Docker Compose installed
- Snowflake account with Cortex enabled
- LaunchDarkly account
- OpenAI API key (optional)

### 2. Environment Setup

```bash
# Copy environment variables
cp backend/.env.example .env

# Edit .env with your credentials
# Required: Snowflake credentials, LaunchDarkly SDK key
```

### 3. Docker Setup

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

This will start:
- Frontend on http://localhost:5173
- Backend API on http://localhost:3001

#### Docker Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Snowflake Setup

Run the `backend/snowflake-setup.sql` script in your Snowflake console to:
- Create database and tables
- Set up Cortex functions
- Insert sample data

### 5. LaunchDarkly Setup

Create these AI Configs in LaunchDarkly:
- `chatbot-system-prompt`: System instructions for the AI
- `llm-model-selection`: Model configuration (provider, model, temperature)

## Alternative: Manual Setup (without Docker)

If you prefer to run without Docker:

```bash
# Terminal 1: Start frontend (from root directory)
npm install
npm run dev

# Terminal 2: Start backend
cd backend
npm install
npm run dev
```

## Testing the Chatbot

1. Open http://localhost:5173
2. Click the chat icon in the bottom-right corner
3. Try these example messages:
   - "Hello, I need help with my order"
   - "What's the status of order ORD-001?"
   - "Can you recommend dog food for a senior dog?"
   - "I want to return my order"

## File Structure

```
farm-fresh-pet-frontend/
├── src/
│   ├── components/
│   │   └── Chat/
│   │       ├── ChatWidget.tsx      # Main chat component
│   │       ├── ChatMessage.tsx     # Message display
│   │       └── ChatInput.tsx       # Input component
│   ├── context/
│   │   └── ChatContext.tsx         # Chat state management
│   └── App.tsx                     # Updated with ChatProvider
│
└── backend/
    ├── src/
    │   ├── routes/                 # API endpoints
    │   ├── services/               # Business logic
    │   └── utils/                  # Helpers
    ├── snowflake-setup.sql         # Database setup
    ├── .env.example                # Environment template
    └── README.md                   # Detailed documentation
```

## Next Steps

1. **Configure Credentials**: Add your Snowflake and LaunchDarkly credentials to backend/.env
2. **Run Snowflake Setup**: Execute the SQL script to create tables and functions
3. **Configure LaunchDarkly**: Set up AI Configs in your LD dashboard
4. **Customize**: Modify the system prompt and UI to match your brand
5. **Deploy**: Follow the backend README for production deployment

## Customization Options

- **Chat UI**: Modify colors and styling in ChatWidget.tsx
- **AI Behavior**: Update system prompts in LaunchDarkly
- **Models**: Switch between Snowflake Cortex models or OpenAI
- **Features**: Enable/disable features via LaunchDarkly flags

## Docker Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change ports in docker-compose.yml or stop conflicting services
   lsof -i :5173  # Check what's using the frontend port
   lsof -i :3001  # Check what's using the backend port
   ```

2. **Environment variables not loading**
   ```bash
   # Ensure .env file exists in the root directory
   cp backend/.env.example .env
   ```

3. **Container fails to start**
   ```bash
   # Check logs for specific service
   docker-compose logs backend
   docker-compose logs frontend
   ```

4. **Permission issues**
   ```bash
   # Rebuild containers
   docker-compose down
   docker-compose up --build
   ```

## Support

For detailed setup instructions and troubleshooting, see:
- `backend/README.md` - Complete backend documentation
- `Snowflake_Chatbot.md` - Original implementation guide

The chatbot is now ready to provide AI-powered customer support for Farm Fresh Pet!