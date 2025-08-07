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

Copy the example environment file and configure it with your credentials:

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your actual credentials
# nano .env  # or use your preferred editor
```

Update the `.env` file with your actual credentials:

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

### 🔍 Finding Your Snowflake Credentials

**Account Identifier:**
- Log into your Snowflake web interface
- **Traditional format**: URL will be `https://your-account-identifier.snowflakecomputing.com`
- **New format**: URL will be `https://app.snowflake.com/your-account-identifier`
- Your account identifier is either:
  - The part before `.snowflakecomputing.com` (traditional)
  - The part after `app.snowflake.com/` (new format)

**Username & Password:**
- Use your Snowflake login credentials
- For service accounts, create a dedicated user in Snowflake Admin → Users
- Consider using key pair authentication for production

**Warehouse, Database, Schema:**
- **Warehouse**: Use `COMPUTE_WH` (default) or create a dedicated warehouse
- **Database**: Create using the provided `snowflake-setup.sql` script
- **Schema**: Will be created automatically by the setup script

**Need help?** Contact your Snowflake administrator or refer to the [Snowflake documentation](https://docs.snowflake.com/en/user-guide/admin-security-overview.html).

### 🏗️ Running the Snowflake Setup Script

To enable the chatbot to access product, order, and chat data, you must run the provided `snowflake-setup.sql` script in your Snowflake account. This script creates the required database, schema, and tables.

#### 1. Download the Script

The script is located at the project root as `snowflake-setup.sql`.

#### 2. Open the Snowflake Web Interface

You can use either the **Classic Console** (traditional interface) or the **Snowsight** (new interface):

- **Classic Console:**  
  Go to [https://<your-account-identifier>.snowflakecomputing.com](https://<your-account-identifier>.snowflakecomputing.com)
- **Snowsight (New UI):**  
  Go to [https://app.snowflake.com/<your-account-identifier>](https://app.snowflake.com/<your-account-identifier>)

#### 3. Run the Script

**A. Using the Classic Console:**
1. Log in with your Snowflake credentials.
2. Click on the **"Worksheets"** tab.
3. Open a new worksheet.
4. Copy the contents of `snowflake-setup.sql` and paste them into the worksheet.
5. Click the **"Run"** button (or press `Ctrl+Enter`) to execute the script.

**B. Using Snowsight (New UI):**
1. Log in with your Snowflake credentials.
2. Click on **"Data"** or **"Worksheets"** in the left sidebar.
3. Click **"+ Worksheet"** to create a new worksheet.
4. Copy and paste the contents of `snowflake-setup.sql` into the worksheet editor.
5. Click **"Run"** (or press `Ctrl+Enter`) to execute.

> **Tip:**  
> You can also use the **"Upload File"** feature in Snowsight to upload and run the script directly.

#### Snowflake worksheet quick selections (summary)

- **Warehouse**: Use any small warehouse you have access to (e.g., `COMPUTE_WH`). For demos, an `XSMALL` is sufficient. If you need to create one:

```sql
CREATE WAREHOUSE IF NOT EXISTS GRAVITY_WH
  WAREHOUSE_SIZE = 'XSMALL'
  AUTO_SUSPEND = 60
  AUTO_RESUME = TRUE
  INITIALLY_SUSPENDED = TRUE;
USE WAREHOUSE GRAVITY_WH;
```

- **Database/Schema**: No pre-selection required. The script runs:
  - `CREATE DATABASE IF NOT EXISTS GRAVITY_FARMS_PETFOOD_AI;`
  - `USE DATABASE GRAVITY_FARMS_PETFOOD_AI;`
  - `CREATE SCHEMA IF NOT EXISTS CHATBOT;`
  - `USE SCHEMA CHATBOT;`

- **Role to run the script**: A role with the following capabilities:
  - Ability to switch to an admin role (script starts with `USE ROLE ACCOUNTADMIN;`) or use an equivalent admin role
  - `USAGE` on the selected warehouse
  - `CREATE DATABASE` at account level, and ability to `CREATE SCHEMA`, `CREATE TABLE`, `CREATE FUNCTION`

#### Minimal runtime permissions (for the application)

After running the setup, grant your app a least-privilege role. Replace names as needed.

```sql
CREATE ROLE IF NOT EXISTS APP_CHATBOT_ROLE;

-- Warehouse access used by the app
GRANT USAGE ON WAREHOUSE GRAVITY_WH TO ROLE APP_CHATBOT_ROLE;

-- Database and schema access
GRANT USAGE ON DATABASE GRAVITY_FARMS_PETFOOD_AI TO ROLE APP_CHATBOT_ROLE;
GRANT USAGE ON SCHEMA GRAVITY_FARMS_PETFOOD_AI.CHATBOT TO ROLE APP_CHATBOT_ROLE;

-- Tables (read/write as needed)
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA GRAVITY_FARMS_PETFOOD_AI.CHATBOT TO ROLE APP_CHATBOT_ROLE;
GRANT SELECT, INSERT ON FUTURE TABLES IN SCHEMA GRAVITY_FARMS_PETFOOD_AI.CHATBOT TO ROLE APP_CHATBOT_ROLE;

-- Functions
GRANT USAGE ON ALL FUNCTIONS IN SCHEMA GRAVITY_FARMS_PETFOOD_AI.CHATBOT TO ROLE APP_CHATBOT_ROLE;
GRANT USAGE ON FUTURE FUNCTIONS IN SCHEMA GRAVITY_FARMS_PETFOOD_AI.CHATBOT TO ROLE APP_CHATBOT_ROLE;

-- Assign to user
GRANT ROLE APP_CHATBOT_ROLE TO USER YOUR_USERNAME;
```

Optional (only if Snowflake AI/Cortex is enabled and your org requires explicit grants): grant `USAGE` on `SNOWFLAKE.CORTEX` or `SNOWFLAKE.AI` as per your governance.

#### 4. Verify Setup

After running the script, you should see the following objects in your Snowflake account:
- Database: `GRAVITY_FARMS_PETFOOD_AI`
- Schema: `CHATBOT`
- Tables: `PRODUCTS`, `ORDERS`, `CHAT_HISTORY`

If you encounter any errors, double-check your account permissions or contact your Snowflake administrator.

#### 5. Troubleshooting Common Issues

- **AI function returns fallback message**: If Snowflake AI/Cortex isn’t available to your account/role, `CHATBOT_RESPONSE` will return a fallback string. This is expected and the app can use demo mode or external LLMs.
- **Insufficient privileges**: If you see errors creating the database/schema/tables/functions, rerun with an admin role (e.g., `ACCOUNTADMIN`) or a role that has `CREATE DATABASE`, `CREATE SCHEMA`, `CREATE TABLE`, and `CREATE FUNCTION`, plus `USAGE` on the selected warehouse.
- **Indexes**: Snowflake doesn’t support user-defined indexes. The setup uses Snowflake’s automatic micro-partitioning; no index creation is required.

For more details, see the [Snowflake Worksheets documentation](https://docs.snowflake.com/en/user-guide/ui-worksheets).


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

## 🚩 Feature Flags & Analytics

This application uses LaunchDarkly for feature flag management and analytics tracking. Below is a comprehensive list of all feature flags and track events used throughout the system.

### Feature Flags

#### Frontend Feature Flags

| Flag Key | Type | Default Value | Description | Location |
|----------|------|---------------|-------------|----------|
| `hero-banner-text` | JSON Object | `{"banner-text": "Control Banner", ...}` | Controls hero banner content, styling, and layout | `HeroSection.tsx` |
| `number-of-days-trial` | Number | `7` | Number of free trial days offered | `useTrialDays.ts` |
| `seasonal-sale-banner-text` | String | `""` | Seasonal promotional banner text | `SeasonalBanner.tsx` |
| `show-trial-button` | Boolean | `false` | Controls visibility of trial signup button | `HeroSection.tsx` |
| `modernize-frontend` | Boolean | `false` | Enables modern UI components and styling | `App.tsx` |
| `site-tagline` | String | `"Crafted in Gravity Falls, delivered to your door"` | Website tagline in footer | `Footer.tsx` |

#### Backend Feature Flags

| Flag Key | Type | Default Value | Description | Location |
|----------|------|---------------|-------------|----------|
| `chatbot-system-prompt` | String | Default customer service prompt | AI chatbot system prompt | `launchdarkly-config.js` |
| `llm-model-selection` | JSON Object | `{"provider": "snowflake", "model": "mixtral-8x7b", ...}` | LLM model configuration | `launchdarkly-config.js` |

### Track Events

#### Frontend Track Events

| Event Name | Context | Description | Location |
|------------|---------|-------------|----------|
| `banner_click` | `{banner_text, timestamp}` | User clicks seasonal banner | `SeasonalBanner.tsx` |

#### Backend Track Events

| Event Name | Context | Description | Location |
|------------|---------|-------------|----------|
| `chat-interaction` | `{responseTime, model, intent, sessionId, timestamp}` | Chat interaction metrics | `launchdarkly-config.js` |
| `token-usage` | `tokens` | LLM token consumption | `launchdarkly-config.js` |
| `user-satisfaction` | `satisfaction` | User satisfaction rating | `launchdarkly-config.js` |
| `chat-error` | `{error, errorType}` | Chat error tracking | `launchdarkly-config.js` |

#### Simulation Track Events

The following events are tracked during data simulation runs:

| Event Name | Context | Description | Location |
|------------|---------|-------------|----------|
| `page_view` | User context | Page view event | `gravityfarms_simulation.py` |
| `trial_signup` | User context | User signs up for trial | `gravityfarms_simulation.py` |
| `trial_to_paid_conversion` | User context | Trial user converts to paid | `gravityfarms_simulation.py` |
| `total_revenue` | `{metric_value: revenue}` | Total revenue generated | `gravityfarms_simulation.py` |
| `adjusted_revenue` | `{metric_value: adjusted_revenue}` | Revenue minus trial costs | `gravityfarms_simulation.py` |
| `banner_click` | User context | Seasonal banner click | `gravityfarms_simulation.py` |
| `hero_engagement` | User context | Hero section engagement | `gravityfarms_simulation.py` |

### Feature Flag Usage Examples

#### Hero Banner Configuration
```typescript
const { value: bannerConfig } = useFeatureFlag('hero-banner-text', DEFAULT_BANNER);
// Controls: banner-text, banner-text-color, horiz-justification, image-file, 
// sub-banner-text, sub-banner-text-color, vert-justification
```

#### Trial Days Configuration
```typescript
const { trialDays, isLoading } = useTrialDays(7);
// Returns number of trial days from LaunchDarkly
```

#### Modern UI Toggle
```typescript
const { value: modernizeFrontend } = useFeatureFlag('modernize-frontend', false);
// Enables/disables modern UI components
```

### Analytics Context

All track events include user context with the following attributes:
- `key`: Unique user identifier
- `name`: User's name
- `country`: User's country (US, UK, FR, DE, CA)
- `state`: User's state/province
- `petType`: Pet type (dog, cat, both)
- `planType`: Subscription plan (basic, premium, trial)
- `paymentType`: Payment method (credit_card, paypal, apple_pay, google_pay, bank)

### Demo Mode Behavior

When running in demo mode (`DEMO_MODE=true`):
- Feature flags return default values
- Track events are logged to console instead of sent to LaunchDarkly
- No external LaunchDarkly calls are made

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