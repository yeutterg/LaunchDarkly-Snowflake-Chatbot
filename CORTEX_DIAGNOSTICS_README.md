# Snowflake Cortex Access Diagnostics

This directory contains comprehensive diagnostic tools to check if your Snowflake account has Cortex access and the necessary permissions.

## 📋 Files Included

1. **`snowflake-cortex-diagnostics.sql`** - SQL worksheet script for Snowflake web interface
2. **`snowflake-rest-api-test.sh`** - Shell script for testing REST API endpoints
3. **`CORTEX_DIAGNOSTICS_README.md`** - This instruction file

## 🔍 How to Use These Diagnostics

### Method 1: SQL Worksheet (Recommended)

1. **Log into your Snowflake account** at `https://idmxgka.snowflakecomputing.com`
2. **Open a new worksheet**
3. **Copy and paste** the entire contents of `snowflake-cortex-diagnostics.sql`
4. **Run the script** (Ctrl+Enter or Cmd+Enter)
5. **Review the results** section by section

### Method 2: REST API Testing

1. **Open your terminal**
2. **Navigate to this directory**
3. **Run the shell script:**
   ```bash
   ./snowflake-rest-api-test.sh
   ```
4. **Review the output** for each endpoint test

## 📊 What the Diagnostics Check

### SQL Script Checks:
- ✅ Account information and current user
- ✅ Organization and account features
- ✅ Service status (including Cortex)
- ✅ Available functions and procedures
- ✅ Account parameters
- ✅ User privileges and grants
- ✅ Database and schema access
- ✅ Cortex functionality tests
- ✅ Billing and usage information
- ✅ Summary report with clear status

### REST API Script Checks:
- ✅ Basic API connectivity
- ✅ Cortex base endpoints
- ✅ Cortex models endpoint
- ✅ Cortex completion endpoint
- ✅ Alternative Cortex endpoints
- ✅ Other AI/ML endpoints
- ✅ Account information endpoint

## 🎯 Expected Results

### ✅ If Cortex is AVAILABLE:
```
✅ CORTEX IS AVAILABLE
- Functions like CORTEX_COMPLETE, CORTEX_EMBED in SHOW FUNCTIONS
- Cortex services in SYSTEM$GET_SERVICE_STATUS()
- REST API endpoints return 200 status
- Valid JSON responses from Cortex endpoints
```

### ❌ If Cortex is NOT AVAILABLE:
```
❌ CORTEX IS NOT AVAILABLE
- No Cortex functions in SHOW FUNCTIONS
- "Feature not available" errors
- REST API endpoints return 404 errors
- Empty results for Cortex service status
```

## 🚨 Common Issues & Solutions

### Issue 1: "Feature not available" errors
**Solution:** Contact Snowflake Support to enable Cortex for your account

### Issue 2: 404 errors on REST API endpoints
**Solution:** Cortex is not enabled - contact Snowflake Support

### Issue 3: 401/403 errors on REST API
**Solution:** Check your JWT token permissions and account identifier

### Issue 4: No Cortex functions available
**Solution:** Verify your account type supports Cortex and request activation

## 📞 Next Steps

### If Cortex is NOT Available:

1. **Contact Snowflake Support**
   - Request Cortex activation for your account
   - Ask about Cortex credits allocation
   - Verify account type compatibility

2. **Alternative Solutions**
   - Use demo mode for testing
   - Consider other AI providers (OpenAI, Anthropic, etc.)
   - Implement alternative AI integration

### If Cortex IS Available:

1. **Verify Permissions**
   - Check user role assignments
   - Verify JWT token permissions
   - Test with simple Cortex function calls

2. **Test Integration**
   - Update your application configuration
   - Test with actual Cortex API calls
   - Verify REST API connectivity

## 🔧 Configuration Updates

If Cortex becomes available, update your environment variables:

```bash
# In your .env file or docker-compose.yml
SNOWFLAKE_ACCOUNT_IDENTIFIER=your-account.snowflakecomputing.com
SNOWFLAKE_PAT=your-jwt-token
DEMO_MODE=false  # Set to false when Cortex is available
```

## 📈 Monitoring & Troubleshooting

### Check Cortex Usage:
```sql
-- Monitor Cortex usage (if available)
SELECT * FROM TABLE(INFORMATION_SCHEMA.SYSTEM$GET_SERVICE_STATUS('CORTEX'));
```

### Test Simple Cortex Function:
```sql
-- Test basic Cortex function (uncomment when Cortex is available)
-- SELECT CORTEX_COMPLETE('gpt-4', 'Hello, how are you?');
```

## 🆘 Support Resources

- **Snowflake Documentation:** https://docs.snowflake.com/en/user-guide/cortex
- **Snowflake Support:** Contact through your Snowflake account
- **REST API Documentation:** https://docs.snowflake.com/en/developer-guide/sql-api
- **Cortex Pricing:** Check your Snowflake billing section

## 📝 Notes

- The SQL script requires appropriate privileges to run all sections
- Some commands may require elevated roles (ORGADMIN, ACCOUNTADMIN)
- The REST API script uses your current JWT token - update if needed
- Results may vary based on your account type and permissions

---

**Last Updated:** August 8, 2025  
**Version:** 1.0  
**Compatibility:** Snowflake Standard, Enterprise, Business Critical editions 