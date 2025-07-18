# Docker Build Fixes

## Issues Resolved

### 1. Missing package-lock.json
- **Problem**: `npm ci` requires a package-lock.json file
- **Solution**: Generated package-lock.json by running `npm install`

### 2. Non-existent @launchdarkly/ai-sdk package
- **Problem**: The package `@launchdarkly/ai-sdk` doesn't exist in npm registry
- **Solution**: Removed this dependency from package.json

### 3. Node version warnings
- **Note**: Some Azure packages require Node 20+, but the app works fine with Node 18
- **Future**: Consider upgrading to Node 20 Alpine image if needed

## Working Docker Commands

```bash
# Build the image
docker build -t gravity-farms-chatbot ./gravity-farms-chatbot-backend

# Run with docker-compose (recommended)
docker-compose up chatbot-backend

# Run standalone
docker run -p 3001:3001 -e DEMO_MODE=true gravity-farms-chatbot
```

## Verified Output

The backend successfully starts in demo mode:
- 🎮 Running in DEMO MODE - Using mock data
- ✅ Service initialized successfully
- 📍 Health check working at http://localhost:3001/health

No credentials are required for demo mode!