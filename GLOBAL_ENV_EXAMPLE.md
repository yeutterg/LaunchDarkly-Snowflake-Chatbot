# Global Environment Configuration Example

## Complete .env File

Here's what your root `.env` file should look like with both LaunchDarkly server-side and client-side configuration:

```bash
# Snowflake Configuration
SNOWFLAKE_ACCOUNT=your_account_identifier
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=GRAVITY_FARMS_PETFOOD_AI
SNOWFLAKE_SCHEMA=CHATBOT

# LaunchDarkly Configuration
# Server-side SDK key for backend services (keep secure)
LAUNCHDARKLY_SDK_KEY=sdk-xxxx-xxxx-xxxx
# Client-side ID for frontend applications (safe to expose)
LAUNCHDARKLY_CLIENT_SIDE_ID=client-xxxx-xxxx-xxxx

# Demo Mode (set to true for testing without credentials)
DEMO_MODE=true

# Frontend API URL (for ChatWidget integration)
REACT_APP_API_URL=http://localhost:3001
```

## How to Get Your LaunchDarkly Credentials

### 1. Server-Side SDK Key
1. Go to your LaunchDarkly dashboard
2. Navigate to Account Settings > Projects
3. Select your project
4. Go to Environments tab
5. Copy the SDK key (starts with `sdk-`)

### 2. Client-Side ID
1. Go to your LaunchDarkly dashboard
2. Navigate to Account Settings > Projects
3. Select your project
4. Copy the Client-side ID (starts with `client-`)

## Environment-Specific Configuration

For different environments, you can create separate `.env` files:

### Development (.env.development)
```bash
LAUNCHDARKLY_SDK_KEY=sdk-dev-xxxx-xxxx-xxxx
LAUNCHDARKLY_CLIENT_SIDE_ID=client-dev-xxxx-xxxx-xxxx
DEMO_MODE=true
```

### Production (.env.production)
```bash
LAUNCHDARKLY_SDK_KEY=sdk-prod-xxxx-xxxx-xxxx
LAUNCHDARKLY_CLIENT_SIDE_ID=client-prod-xxxx-xxxx-xxxx
DEMO_MODE=false
```

## Security Notes

- **Never commit `.env` files to version control**
- **Server-side SDK key** contains sensitive information - keep secure
- **Client-side ID** is safe to expose in frontend code
- Use different credentials for different environments
- Regularly rotate your server-side SDK keys

## Testing Your Configuration

1. **Backend Test:**
   ```bash
   # Check if server-side SDK key is loaded
   echo $LAUNCHDARKLY_SDK_KEY
   ```

2. **Frontend Test:**
   ```bash
   # Build the frontend to verify client-side ID is loaded
   cd farm-fresh-pet-frontend
   npm run build
   ```

3. **Browser Console:**
   - Open browser developer tools
   - Look for LaunchDarkly debug logs
   - Verify the client-side ID is being loaded correctly 