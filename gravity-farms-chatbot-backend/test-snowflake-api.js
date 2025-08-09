const fetch = require('node-fetch');

// Test script to verify Snowflake REST API access
async function testSnowflakeAPIs() {
    const PAT = 'eyJraWQiOiIzMTQzNDMwNzM2NTI4ODg2IiwiYWxnIjoiRVMyNTYifQ.eyJwIjoiNDc5NjQ5NDc5Njk6NDc5NjQ5NDY2OTMiLCJpc3MiOiJTRjoxMDQzIiwiZXhwIjoxNzg2MjEyNzI3fQ.gtTLDo6IeaBYbyrenLFbsLcI5uFpImWGLhRejaCPwQIthhW-4gEqDE-tKa1vbovCz-GWM1uFJJjsZXoKdPcPpQ';
    const ACCOUNT = 'idmxgka.snowflakecomputing.com';
    
    console.log('Testing Snowflake REST API endpoints...\n');
    
    // Test 1: Cortex Inference API
    console.log('1. Testing Cortex Inference API:');
    console.log(`   URL: https://${ACCOUNT}/api/v2/cortex/inference:complete`);
    
    try {
        const response1 = await fetch(`https://${ACCOUNT}/api/v2/cortex/inference:complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAT}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet',
                messages: [{ role: 'user', content: 'Hello' }],
                stream: false
            })
        });
        
        console.log(`   Status: ${response1.status} ${response1.statusText}`);
        if (response1.status === 200) {
            const data = await response1.json();
            console.log('   ✅ SUCCESS - Cortex Inference API is available');
            console.log('   Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('   ❌ FAILED - Cortex Inference API not available');
        }
    } catch (error) {
        console.log('   ❌ ERROR:', error.message);
    }
    
    console.log('\n2. Testing SQL Statements API:');
    console.log(`   URL: https://${ACCOUNT}/api/v2/statements`);
    
    try {
        const response2 = await fetch(`https://${ACCOUNT}/api/v2/statements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAT}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Snowflake-Authorization-Token-Type': 'OAUTH'
            },
            body: JSON.stringify({
                statement: "SELECT CURRENT_VERSION()",
                warehouse: "DEFAULT_WH",
                role: "ACCOUNTADMIN"
            })
        });
        
        console.log(`   Status: ${response2.status} ${response2.statusText}`);
        if (response2.status === 200) {
            const data = await response2.json();
            console.log('   ✅ SUCCESS - SQL Statements API is available');
            console.log('   Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('   ❌ FAILED - SQL Statements API not available');
        }
    } catch (error) {
        console.log('   ❌ ERROR:', error.message);
    }
    
    console.log('\n3. Testing Basic REST API (warehouses endpoint):');
    console.log(`   URL: https://${ACCOUNT}/api/v2/warehouses`);
    
    try {
        const response3 = await fetch(`https://${ACCOUNT}/api/v2/warehouses`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PAT}`,
                'Accept': 'application/json'
            }
        });
        
        console.log(`   Status: ${response3.status} ${response3.statusText}`);
        if (response3.status === 200) {
            const data = await response3.json();
            console.log('   ✅ SUCCESS - Basic REST API is available');
            console.log('   Warehouses found:', data.warehouses?.length || 0);
        } else {
            console.log('   ❌ FAILED - Basic REST API not available');
        }
    } catch (error) {
        console.log('   ❌ ERROR:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY:');
    console.log('If all APIs return 404, you may need to:');
    console.log('1. Contact Snowflake support to enable REST API access');
    console.log('2. Verify your account URL format');
    console.log('3. Check if your account has the necessary features enabled');
    console.log('4. For now, you can use DEMO_MODE=true to test the application');
}

testSnowflakeAPIs();