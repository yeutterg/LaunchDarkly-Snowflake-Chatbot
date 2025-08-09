const { getLaunchDarklyClients } = require('./launchdarkly-ai-client');
const fetch = require('node-fetch');

console.log('📦 Loading SnowflakeSimpleConnector module...');

class SnowflakeSimpleConnector {
    constructor() {
        console.log('🔧 Environment check:');
        console.log('   DEMO_MODE:', process.env.DEMO_MODE);
        console.log('   SNOWFLAKE_ACCOUNT_IDENTIFIER:', process.env.SNOWFLAKE_ACCOUNT_IDENTIFIER ? 'SET' : 'NOT SET');
        console.log('   SNOWFLAKE_PAT:', process.env.SNOWFLAKE_PAT ? 'SET' : 'NOT SET');
        
        this.isDemo = process.env.DEMO_MODE === 'true';
        
        if (!this.isDemo && (!process.env.SNOWFLAKE_ACCOUNT_IDENTIFIER || !process.env.SNOWFLAKE_PAT)) {
            console.log('⚠️  DEMO_MODE is false but missing Snowflake credentials. Falling back to demo mode.');
            this.isDemo = true;
        }
        
        if (this.isDemo) {
            console.log('🎮 Running in DEMO MODE - Using mock data instead of Snowflake SDK');
        } else {
            console.log('🚀 Running in PRODUCTION MODE - Using Snowflake SDK and LaunchDarkly AI Configs');
        }
    }

    async callSnowflakeCortexAPI(model, messages, parameters = {}) {
        // Use Snowflake Cortex inference API endpoint (matching the working tutorial implementation)
        const SNOWFLAKE_BASE_URL = `https://${process.env.SNOWFLAKE_ACCOUNT_IDENTIFIER}`;
        const SNOWFLAKE_COMPLETE_URL = `${SNOWFLAKE_BASE_URL}/api/v2/cortex/inference:complete`;
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SNOWFLAKE_PAT}`,
            'Accept': 'application/json'
        };
        
        const body = {
            model: model,
            messages: messages,
            stream: false  // Important: We don't want streaming responses
        };
        
        console.log('🚀 Making Snowflake Cortex inference API call:');
        console.log('   Base URL:', SNOWFLAKE_BASE_URL);
        console.log('   Complete URL:', SNOWFLAKE_COMPLETE_URL);
        console.log('   Model:', model);
        console.log('   Messages count:', messages.length);
        console.log('   Stream:', false);
        console.log('   Full request body:', JSON.stringify(body, null, 2));
        console.log('   Authorization header present:', !!headers.Authorization);
        
        try {
            const response = await fetch(SNOWFLAKE_COMPLETE_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Snowflake Cortex API error:');
                console.error('   Status:', response.status);
                console.error('   Status Text:', response.statusText);
                console.error('   Headers:', response.headers.raw());
                console.error('   Error Body (first 500 chars):', errorText.substring(0, 500));
                throw new Error(`Snowflake Cortex API error: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Snowflake Cortex API response received');
            
            // The response should already be in the correct format from the Cortex API
            // It should have a structure like: { choices: [{ message: { content: "..." } }], usage: {...} }
            return result;
            
        } catch (error) {
            console.error('❌ Error calling Snowflake Cortex API:', error);
            throw error;
        }
    }

    async generateResponse(userMessage, context, sessionId) {
        console.log('🎯 SnowflakeSimpleConnector.generateResponse called with:');
        console.log('   Message:', userMessage);
        console.log('   Context:', context);
        console.log('   SessionId:', sessionId);
        console.log('   IsDemo:', this.isDemo);
        
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

            // Use the model name directly from LaunchDarkly
            // Snowflake Cortex supports models like: claude-3-5-sonnet, llama3.1-8b, etc.
            const snowflakeModel = config.model.name;
            console.log(`📦 Using model from LaunchDarkly config: ${snowflakeModel}`);
            
            // Use the REST API to call Snowflake Cortex
            let result;
            try {
                result = await this.callSnowflakeCortexAPI(
                    snowflakeModel,
                    messagesForSQL,
                    config.model.parameters || {}
                );
            } catch (apiError) {
                console.error('❌ Cortex inference API call failed:', apiError);
                if (apiError.message?.includes('404')) {
                    throw new Error('Snowflake Cortex inference endpoint not found. Please check if Cortex is enabled for your account.');
                } else if (apiError.message?.includes('401') || apiError.message?.includes('403')) {
                    throw new Error('Authentication failed. Please check your Snowflake PAT token.');
                } else if (apiError.message?.includes('422')) {
                    throw new Error('Invalid request. Please check the model name and message format.');
                } else if (apiError.message?.includes('timeout')) {
                    throw new Error('Request timed out. The Cortex model may be overloaded. Please try again.');
                } else {
                    throw apiError;
                }
            }

            console.log('📡 Snowflake API result received');

            const durationEnd = Date.now();

            // Track successful completion
            tracker.trackSuccess();
            tracker.trackDuration(durationEnd - durationStart);

            if (result?.usage) {
                tracker.trackTokens({
                    total: result.usage.total_tokens || 0,
                    input: result.usage.prompt_tokens || 0,
                    output: result.usage.completion_tokens || 0,
                });
            }

            // Extract the response from the API result
            let response = result?.choices?.[0]?.message?.content || 
                          result?.choices?.[0]?.text || 
                          result?.message?.content ||
                          "No response from Snowflake Cortex";
            
            console.log('📝 Extracted response from API result');

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
        console.log('Product search not implemented for simple connector yet');
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
        console.log('Order lookup not implemented for simple connector yet');
        return [];
    }
}

module.exports = { SnowflakeSimpleConnector }; 