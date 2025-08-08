-- =====================================================
-- Snowflake Cortex Access & Permissions Diagnostic Script
-- =====================================================
-- Run this script in your Snowflake web interface to check Cortex access
-- Copy and paste this entire script into a new worksheet in Snowflake

-- =====================================================
-- SECTION 1: ACCOUNT INFORMATION
-- =====================================================

-- Check current account and user
SELECT 
    CURRENT_ACCOUNT() as account_identifier,
    CURRENT_USER() as current_user,
    CURRENT_ROLE() as current_role,
    CURRENT_DATABASE() as current_database,
    CURRENT_SCHEMA() as current_schema;

-- =====================================================
-- SECTION 2: ORGANIZATION & ACCOUNT FEATURES
-- =====================================================

-- Check organization accounts (requires ORGADMIN role)
-- Note: This may require elevated privileges
SELECT 'Checking organization accounts...' as status;
SHOW ORGANIZATION ACCOUNTS;

-- =====================================================
-- SECTION 3: FUNCTION AVAILABILITY CHECK
-- =====================================================

-- Check for Cortex-related functions (most reliable method)
SELECT 'Checking for Cortex functions...' as status;
SHOW FUNCTIONS LIKE '%cortex%';

-- Check for AI/ML related functions
SELECT 'Checking for AI/ML functions...' as status;
SHOW FUNCTIONS LIKE '%ai%';
SHOW FUNCTIONS LIKE '%ml%';
SHOW FUNCTIONS LIKE '%inference%';
SHOW FUNCTIONS LIKE '%complete%';
SHOW FUNCTIONS LIKE '%embed%';

-- Check for Cortex procedures
SELECT 'Checking for Cortex procedures...' as status;
SHOW PROCEDURES LIKE '%cortex%';

-- =====================================================
-- SECTION 4: ACCOUNT PARAMETERS
-- =====================================================

-- Check account parameters related to Cortex/AI
SELECT 'Checking Cortex-related parameters...' as status;
SHOW PARAMETERS LIKE '%cortex%';
SHOW PARAMETERS LIKE '%ai%';
SHOW PARAMETERS LIKE '%ml%';
SHOW PARAMETERS LIKE '%inference%';

-- =====================================================
-- SECTION 5: USER PRIVILEGES
-- =====================================================

-- Check current user's privileges
SELECT 'Checking user privileges...' as status;
SHOW GRANTS TO USER CURRENT_USER();

-- Check account-level grants
SELECT 'Checking account-level grants...' as status;
SHOW GRANTS ON ACCOUNT;

-- Check role privileges
SELECT 'Checking role privileges...' as status;
SHOW GRANTS TO ROLE CURRENT_ROLE();

-- =====================================================
-- SECTION 6: DATABASE & SCHEMA ACCESS
-- =====================================================

-- Check available databases
SELECT 'Checking available databases...' as status;
SHOW DATABASES;

-- Check available schemas
SELECT 'Checking available schemas...' as status;
SHOW SCHEMAS;

-- =====================================================
-- SECTION 7: WAREHOUSE & RESOURCE CHECK
-- =====================================================

-- Check warehouse usage (Cortex may require specific warehouse)
SELECT 'Checking warehouse usage...' as status;
SHOW WAREHOUSES;

-- Check resource monitors
SELECT 'Checking resource monitors...' as status;
SHOW RESOURCE MONITORS;

-- =====================================================
-- SECTION 8: CORTEX FUNCTIONALITY TEST
-- =====================================================

-- Try to call a basic Cortex function (if available)
SELECT 'Testing Cortex functionality...' as status;

-- Test 1: Check if CORTEX_COMPLETE function exists
-- Use SNOWFLAKE database for system functions
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ CORTEX_COMPLETE function is available'
        ELSE '❌ CORTEX_COMPLETE function is NOT available'
    END as cortex_complete_status
FROM SNOWFLAKE.INFORMATION_SCHEMA.FUNCTIONS
WHERE FUNCTION_NAME LIKE '%CORTEX_COMPLETE%';

-- Test 2: Check if CORTEX_EMBED function exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ CORTEX_EMBED function is available'
        ELSE '❌ CORTEX_EMBED function is NOT available'
    END as cortex_embed_status
FROM SNOWFLAKE.INFORMATION_SCHEMA.FUNCTIONS
WHERE FUNCTION_NAME LIKE '%CORTEX_EMBED%';

-- Test 3: Check for any Cortex-related functions
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Found Cortex-related functions'
        ELSE '❌ No Cortex-related functions found'
    END as cortex_functions_status
FROM SNOWFLAKE.INFORMATION_SCHEMA.FUNCTIONS
WHERE FUNCTION_NAME LIKE '%CORTEX%';

-- =====================================================
-- SECTION 9: ALTERNATIVE SERVICE STATUS CHECK
-- =====================================================

-- Try alternative methods to check service status
SELECT 'Checking alternative service status methods...' as status;

-- Method 1: Check if we can access system tables
SELECT 'Checking system table access...' as status;
SHOW TABLES IN SNOWFLAKE.INFORMATION_SCHEMA LIKE '%SERVICE%';
SHOW TABLES IN SNOWFLAKE.INFORMATION_SCHEMA LIKE '%SYSTEM%';

-- Method 2: Check for any system functions
SELECT 'Checking system functions...' as status;
SHOW FUNCTIONS LIKE '%SYSTEM%';
SHOW FUNCTIONS LIKE '%SERVICE%';

-- =====================================================
-- SECTION 10: ERROR HANDLING TEST
-- =====================================================

-- Try to execute a Cortex function to see the error message
SELECT 'Testing Cortex function execution...' as status;

-- This will fail if Cortex is not available, but will show us the exact error
-- Uncomment the line below to test (it will show an error if Cortex is not available)
-- SELECT CORTEX_COMPLETE('gpt-4', 'Hello, how are you?');

-- =====================================================
-- SECTION 11: SUMMARY REPORT
-- =====================================================

-- Generate a summary report
SELECT 'Generating summary report...' as status;

-- Simple summary without complex subqueries
SELECT 
    'CORTEX ACCESS DIAGNOSTIC SUMMARY' as report_title,
    CURRENT_TIMESTAMP() as check_timestamp,
    CURRENT_ACCOUNT() as account,
    CURRENT_USER() as user;

-- Check Cortex availability
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ CORTEX IS AVAILABLE'
        ELSE '❌ CORTEX IS NOT AVAILABLE'
    END as cortex_status
FROM SNOWFLAKE.INFORMATION_SCHEMA.FUNCTIONS
WHERE FUNCTION_NAME LIKE '%CORTEX%';

-- Count Cortex functions
SELECT 
    COUNT(*) as cortex_function_count,
    'Cortex functions found' as description
FROM SNOWFLAKE.INFORMATION_SCHEMA.FUNCTIONS
WHERE FUNCTION_NAME LIKE '%CORTEX%';

-- Count AI/ML functions
SELECT 
    COUNT(*) as ai_ml_function_count,
    'AI/ML functions found' as description
FROM SNOWFLAKE.INFORMATION_SCHEMA.FUNCTIONS
WHERE FUNCTION_NAME LIKE '%AI%' OR FUNCTION_NAME LIKE '%ML%';

-- =====================================================
-- SECTION 12: DETAILED FUNCTION LIST
-- =====================================================

-- Show all available functions for manual inspection
SELECT 'Listing all available functions for manual inspection...' as status;

-- List all functions that might be related to AI/ML/Cortex
SELECT 
    FUNCTION_NAME,
    FUNCTION_SCHEMA,
    FUNCTION_CATALOG,
    FUNCTION_LANGUAGE
FROM SNOWFLAKE.INFORMATION_SCHEMA.FUNCTIONS
WHERE FUNCTION_NAME LIKE '%CORTEX%' 
   OR FUNCTION_NAME LIKE '%AI%' 
   OR FUNCTION_NAME LIKE '%ML%'
   OR FUNCTION_NAME LIKE '%INFERENCE%'
   OR FUNCTION_NAME LIKE '%COMPLETE%'
   OR FUNCTION_NAME LIKE '%EMBED%'
ORDER BY FUNCTION_NAME;

-- =====================================================
-- INSTRUCTIONS FOR INTERPRETING RESULTS
-- =====================================================

/*
INTERPRETATION GUIDE:

✅ CORTEX IS AVAILABLE if you see:
- Functions like CORTEX_COMPLETE, CORTEX_EMBED in the function list
- Cortex-related functions in SHOW FUNCTIONS
- No "feature not available" errors when testing functions

❌ CORTEX IS NOT AVAILABLE if you see:
- No Cortex functions in SHOW FUNCTIONS
- "Feature not available" errors
- Empty results for Cortex function searches

ALTERNATIVE CHECKS:
- If SYSTEM$GET_SERVICE_STATUS is not available, focus on function availability
- Check the detailed function list in Section 12
- Look for any AI/ML related functions that might indicate Cortex access

NEXT STEPS:
1. If Cortex is NOT available:
   - Contact Snowflake Support to enable Cortex
   - Request Cortex credits allocation
   - Verify your account type supports Cortex

2. If Cortex IS available:
   - Check your user privileges
   - Verify you have the correct role assignments
   - Test with a simple Cortex function call

3. For REST API access:
   - Ensure your JWT token has the correct permissions
   - Verify the account identifier is correct
   - Check if REST API is enabled for your account

4. If you see some AI/ML functions but not Cortex specifically:
   - Your account might have partial AI capabilities
   - Contact Snowflake Support to upgrade to full Cortex access
*/ 