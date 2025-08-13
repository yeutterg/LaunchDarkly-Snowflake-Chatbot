#!/bin/bash

# =====================================================
# Snowflake REST API & Cortex Access Test Script
# =====================================================
# This script tests REST API connectivity and Cortex endpoints
# Run this script from your terminal

# Configuration - Update these values
ACCOUNT_IDENTIFIER="idmxgka.snowflakecomputing.com"
JWT_TOKEN="${SNOWFLAKE_PAT:-YOUR_PAT_TOKEN_HERE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================="
echo "Snowflake REST API & Cortex Access Test"
echo "=====================================================${NC}"
echo ""

# Function to test an endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local method=${3:-GET}
    local data=${4:-""}
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "$endpoint" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "$endpoint" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json")
    fi
    
    # Extract HTTP status code
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo "Status: $http_status"
    
    if [ "$http_status" = "200" ]; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        echo "Response: $response_body" | head -c 200
        echo "..."
    elif [ "$http_status" = "404" ]; then
        echo -e "${RED}❌ NOT FOUND - Endpoint doesn't exist${NC}"
        echo "This likely means Cortex is not enabled for your account"
    elif [ "$http_status" = "401" ]; then
        echo -e "${RED}❌ UNAUTHORIZED - Check your JWT token${NC}"
    elif [ "$http_status" = "403" ]; then
        echo -e "${RED}❌ FORBIDDEN - Check your permissions${NC}"
    else
        echo -e "${YELLOW}⚠️  UNEXPECTED STATUS: $http_status${NC}"
        echo "Response: $response_body" | head -c 200
        echo "..."
    fi
    echo ""
}

# Test 1: Basic connectivity
echo -e "${BLUE}=== TEST 1: Basic Connectivity ===${NC}"
test_endpoint "https://$ACCOUNT_IDENTIFIER/api/v2" "Basic API endpoint"

# Test 2: Cortex base endpoint
echo -e "${BLUE}=== TEST 2: Cortex Base Endpoint ===${NC}"
test_endpoint "https://$ACCOUNT_IDENTIFIER/api/v2/cortex" "Cortex base endpoint"

# Test 3: Cortex models endpoint
echo -e "${BLUE}=== TEST 3: Cortex Models Endpoint ===${NC}"
test_endpoint "https://$ACCOUNT_IDENTIFIER/api/v2/cortex/models" "Cortex models endpoint"

# Test 4: Cortex completion endpoint
echo -e "${BLUE}=== TEST 4: Cortex Completion Endpoint ===${NC}"
test_endpoint "https://$ACCOUNT_IDENTIFIER/api/v2/cortex/inference:complete" "Cortex completion endpoint" "POST" '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'

# Test 5: Alternative Cortex endpoints
echo -e "${BLUE}=== TEST 5: Alternative Cortex Endpoints ===${NC}"
test_endpoint "https://$ACCOUNT_IDENTIFIER/api/v2/cortex/complete" "Alternative completion endpoint"
test_endpoint "https://$ACCOUNT_IDENTIFIER/api/v2/cortex/embed" "Cortex embed endpoint"

# Test 6: Check for other AI endpoints
echo -e "${BLUE}=== TEST 6: Other AI Endpoints ===${NC}"
test_endpoint "https://$ACCOUNT_IDENTIFIER/api/v2/ai" "AI base endpoint"
test_endpoint "https://$ACCOUNT_IDENTIFIER/api/v2/ml" "ML base endpoint"

# Test 7: Account information
echo -e "${BLUE}=== TEST 7: Account Information ===${NC}"
test_endpoint "https://$ACCOUNT_IDENTIFIER/api/v2/account" "Account information endpoint"

# Summary
echo -e "${BLUE}====================================================="
echo "TEST SUMMARY"
echo "=====================================================${NC}"

echo ""
echo -e "${YELLOW}INTERPRETATION GUIDE:${NC}"
echo ""
echo -e "${GREEN}✅ CORTEX IS AVAILABLE if:${NC}"
echo "  - Any Cortex endpoint returns 200 status"
echo "  - You see valid JSON responses"
echo "  - No 404 errors on Cortex endpoints"
echo ""
echo -e "${RED}❌ CORTEX IS NOT AVAILABLE if:${NC}"
echo "  - All Cortex endpoints return 404"
echo "  - You see 'Error 404 Not Found' responses"
echo "  - No Cortex functions in SQL queries"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. If Cortex is NOT available:"
echo "   - Contact Snowflake Support to enable Cortex"
echo "   - Request Cortex credits allocation"
echo "   - Verify your account type supports Cortex"
echo ""
echo "2. If Cortex IS available:"
echo "   - Check your JWT token permissions"
echo "   - Verify the account identifier is correct"
echo "   - Test with actual Cortex function calls"
echo ""
echo -e "${BLUE}=====================================================${NC}" 