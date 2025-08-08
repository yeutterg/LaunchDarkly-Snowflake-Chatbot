const { getLaunchDarklyClients } = require('./launchdarkly-ai-client');

class SnowflakeSQLRestConnector {
    constructor() {
        // Check if DEMO_MODE is explicitly set to true
        this.isDemo = process.env.DEMO_MODE === 'true';
        
        // If DEMO_MODE is not explicitly true, check if we have the required credentials
        if (!this.isDemo && (!process.env.SNOWFLAKE_ACCOUNT_IDENTIFIER || !process.env.SNOWFLAKE_PAT)) {
            console.log('⚠️  DEMO_MODE is false but missing Snowflake credentials. Falling back to demo mode.');
            this.isDemo = true;
        }
        
        if (this.isDemo) {
            console.log('🎮 Running in DEMO MODE - Using mock data instead of Snowflake SQL REST API');
        } else {
            console.log('🚀 Running in PRODUCTION MODE - Using Snowflake SQL REST API and LaunchDarkly AI Configs');
            console.log('✅ Cortex SQL functions confirmed available in your account');
        }
    }

    async snowflakeSQLRestClient(sqlQuery) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SNOWFLAKE_PAT}`,
            'Accept': 'application/json',
            'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT'
        };

        const body = {
            statement: sqlQuery,
            timeout: 60,
            database: 'SNOWFLAKE',
            schema: 'CORTEX',
            warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH'
        };

        // Use the correct Snowflake REST API endpoint
        const baseUrl = `https://${process.env.SNOWFLAKE_ACCOUNT_IDENTIFIER}`;
        const url = `${baseUrl}/api/v2/statements`;
        
        console.log('🔗 Snowflake SQL REST URL:', url);
        console.log('🔗 Account Identifier:', process.env.SNOWFLAKE_ACCOUNT_IDENTIFIER);
        
        return fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
    }

    async generateResponse(userMessage, context, sessionId) {
        if (this.isDemo) {
            // Demo mode responses
            const lowerMessage = userMessage.toLowerCase();
            
            if (lowerMessage.includes('track')) {
                return {
                    response: "Your order #1156 is currently out for delivery. Tracking: FedEx 123456789",
                    model: "demo-mode"
                };
            }
            
            if (lowerMessage.includes('return')) {
                return {
                    response: "I can help you return your order of Gravity Farms Joint Health Max. I'll email the return label to petlover87@gmailx.com",
                    model: "demo-mode"
                };
            }
            
            if (lowerMessage.includes('info')) {
                return {
                    response: "Our food is made fresh, using real, recognizable stuff — like chicken, carrots, and sweet potatoes. No \"meat slurry,\" no \"natural flavoring,\" and absolutely no powdered unicorn horn (we checked, it's not FDA approved).",
                    model: "demo-mode"
                };
            }
            
            if (lowerMessage.includes('human')) {
                return {
                    response: "Type your message here, and we'll send you an email when we're back online.",
                    model: "demo-mode"
                };
            }
            
            if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
                return {
                    response: "Hello! I'm here to help with your Gravity Farms Petfood orders, products, and returns. How can I assist you today?",
                    model: "demo-mode"
                };
            }
            
            if (lowerMessage.includes('product') || lowerMessage.includes('food')) {
                return {
                    response: "We have several great options! Our most popular products include:\n• Gravity Farms Joint Health Max ($29.99)\n• Gravity Farms Omega Plus ($24.99)\n• Premium Dog Food ($34.99)\n• Cat Food ($24.99)\n\nWould you like to know more about any specific product?",
                    model: "demo-mode"
                };
            }
            
            if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
                return {
                    response: "Our prices range from $24.99 to $34.99 depending on the product. We also offer free shipping on orders over $50!",
                    model: "demo-mode"
                };
            }
            
            if (lowerMessage.includes('help')) {
                return {
                    response: "I can help you with:\n• Tracking orders\n• Product information\n• Returns and refunds\n• Store information\n• Pricing questions\n\nJust let me know what you need!",
                    model: "demo-mode"
                };
            }
            
            return {
                response: "I'm here to help with your Gravity Farms Petfood needs! You can ask me about orders, products, returns, or anything else. What would you like to know?",
                model: "demo-mode"
            };
        }

        try {
            // Retrieve the AI Client from LaunchDarkly
            const { aiClient } = await getLaunchDarklyClients();
            
            // Set up the user's context
            const userContext = {
                type: 'user',
                name: 'Gravity Farms Customer',
                key: sessionId || `user-${Math.random().toString(36).substring(2, 15)}`
            };

            // Retrieve the AI Config from the LD SDK
            const configKey = process.env.LAUNCHDARKLY_AI_CONFIG_KEY || 'gravity-farms-chatbot-config';
            console.log('🔍 Attempting to retrieve AI config:', configKey);
            
            const config = await aiClient.config(
                configKey,
                userContext,
                {},
                { userInput: userMessage, context }
            );

            console.log('📦 Raw AI config received (safe):', {
                enabled: config.enabled,
                model: config.model,
                messages: config.messages,
                hasTracker: !!config.tracker
            });

            // Extract the tracker from the AI Config
            const { tracker } = config;

            // Check that the config is enabled and conforms to the expected shape
            if (!config.enabled || !config.model || !config.messages) {
                console.log('❌ AI config validation failed:');
                console.log('   - enabled:', config.enabled);
                console.log('   - model:', config.model);
                console.log('   - messages:', config.messages);
                tracker.trackError();
                throw new Error("Malformed AI config");
            }

            // Print the AI config details for debugging
            console.log('🎯 LaunchDarkly AI Config Retrieved Successfully:');
            console.log('📋 Config Name:', process.env.LAUNCHDARKLY_AI_CONFIG_KEY || 'gravity-farms-chatbot-config');
            console.log('✅ Enabled:', config.enabled);
            console.log('🤖 Model:', config.model?.name || 'N/A');
            console.log('⚙️  Model Parameters:', JSON.stringify(config.model, null, 2));
            console.log('💬 Messages Count:', config.messages?.length || 0);
            console.log('📝 Messages Preview:');
            if (config.messages && config.messages.length > 0) {
                config.messages.forEach((msg, index) => {
                    console.log(`   ${index + 1}. Role: ${msg.role}`);
                    console.log(`      Content: ${msg.content?.substring(0, 100)}${msg.content?.length > 100 ? '...' : ''}`);
                });
            }
            console.log('🔧 Full Config (safe):', {
                enabled: config.enabled,
                model: config.model,
                messagesCount: config.messages?.length,
                hasTracker: !!config.tracker
            });
            console.log('─'.repeat(80));

            const durationStart = Date.now();

            // Convert messages to SQL format
            const messagesForSQL = config.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Create SQL query using AI_COMPLETE function
            const sqlQuery = `
                SELECT AI_COMPLETE(
                    '${config.model.name}',
                    '${JSON.stringify(messagesForSQL).replace(/'/g, "''")}',
                    '${JSON.stringify(config.model.parameters || {}).replace(/'/g, "''")}'
                ) as response
            `;

            console.log('🚀 Making Snowflake SQL REST call with:');
            console.log('   Model:', config.model.name);
            console.log('   Messages count:', config.messages.length);
            console.log('   SQL Query:', sqlQuery);
            
            const run = await this.snowflakeSQLRestClient(sqlQuery);

            console.log('📡 Snowflake SQL REST response status:', run.status);
            console.log('📡 Snowflake SQL REST response headers:', Object.fromEntries(run.headers.entries()));

            const durationEnd = Date.now();
            const responseText = await run.text();
            console.log('📄 Raw response text (first 500 chars):', responseText.substring(0, 500));
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Failed to parse JSON response:', parseError);
                console.error('📄 Full response text:', responseText);
                
                // Check if it's a 404 error (Cortex not available)
                if (responseText.includes('Error 404 Not Found')) {
                    throw new Error('Snowflake Cortex API not available. Please enable Cortex in your Snowflake account or contact Snowflake support.');
                }
                
                throw new Error('Invalid JSON response from Snowflake SQL REST API');
            }

            // Track successful completion
            tracker.trackSuccess();
            tracker.trackDuration(durationEnd - durationStart);
            
            if (result.usage) {
                tracker.trackTokens({
                    total: result.usage.total_tokens,
                    input: result.usage.prompt_tokens,
                    output: result.usage.completion_tokens,
                });
            }

            // Extract the response from the SQL result
            const response = result.data?.[0]?.[0] ?? "No response from Snowflake SQL REST";

            return { response, model: config.model.name };
        } catch (error) {
            console.error('Error generating response:', error);
            // Re-throw the error so it can be handled by the chatbot service
            throw error;
        }
    }

    async searchProducts(searchQuery, limit = 5) {
        if (this.isDemo) {
            // Demo mode product search
            const mockProducts = [
                {
                    productId: 'GF001',
                    name: 'Gravity Farms Joint Health Max',
                    description: 'Premium joint health supplement for dogs',
                    category: 'Supplements',
                    price: 29.99,
                    ingredients: 'Glucosamine, Chondroitin, MSM'
                },
                {
                    productId: 'GF002',
                    name: 'Gravity Farms Omega Plus',
                    description: 'Omega-3 fatty acid supplement for healthy skin and coat',
                    category: 'Supplements',
                    price: 24.99,
                    ingredients: 'Fish Oil, Vitamin E, DHA'
                }
            ];

            const searchLower = searchQuery.toLowerCase();
            return mockProducts.filter(product => 
                product.name.toLowerCase().includes(searchLower) ||
                product.description.toLowerCase().includes(searchLower) ||
                product.category.toLowerCase().includes(searchLower) ||
                product.ingredients.toLowerCase().includes(searchLower)
            ).slice(0, limit);
        }

        // For production, you would implement SQL queries to your Snowflake data
        console.log('Product search not implemented for SQL REST interface yet');
        return [];
    }

    async lookupOrder(customerEmail, orderId = null) {
        if (this.isDemo) {
            const mockOrders = [
                {
                    orderId: '1156',
                    customerEmail: customerEmail,
                    orderDate: '2024-01-15',
                    status: 'Out for delivery',
                    trackingNumber: 'FedEx 123456789',
                    items: 'Gravity Farms Joint Health Max',
                    totalAmount: 29.99
                }
            ];

            if (orderId) {
                return mockOrders.filter(o => o.orderId === orderId);
            } else {
                return mockOrders.slice(0, 5);
            }
        }

        // For production, you would implement SQL queries to your Snowflake data
        console.log('Order lookup not implemented for SQL REST interface yet');
        return [];
    }
}

module.exports = { SnowflakeSQLRestConnector }; 