const { getLaunchDarklyClients } = require('./launchdarkly-ai-client');

// Base URL for Snowflake REST API
const SNOWFLAKE_BASE_URL = `https://${process.env.SNOWFLAKE_ACCOUNT_IDENTIFIER}`;
// Completion endpoint
const SNOWFLAKE_COMPLETE_URL = `${SNOWFLAKE_BASE_URL}/api/v2/cortex/inference:complete`;

class SnowflakeRestConnector {
    constructor() {
        this.isDemo = process.env.DEMO_MODE === 'true' || 
                      !process.env.SNOWFLAKE_ACCOUNT_IDENTIFIER || 
                      !process.env.SNOWFLAKE_PAT;
        
        if (this.isDemo) {
            console.log('🎮 Running in DEMO MODE - Using mock data instead of Snowflake REST API');
        }
    }

    async snowflakeCompletionClient(body) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SNOWFLAKE_PAT}`,
            'Accept': 'application/json'
        };

        return fetch(SNOWFLAKE_COMPLETE_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...body, stream: false }),
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
            const config = await aiClient.config(
                process.env.LAUNCHDARKLY_AI_CONFIG_KEY || 'gravity-farms-chatbot-config',
                userContext,
                {},
                { userInput: userMessage, context }
            );

            // Extract the tracker from the AI Config
            const { tracker } = config;

            // Check that the config is enabled and conforms to the expected shape
            if (!config.enabled || !config.model || !config.messages) {
                tracker.trackError();
                throw new Error("Malformed AI config");
            }

            const durationStart = Date.now();

            // Make the call to the Snowflake API
            const run = await this.snowflakeCompletionClient({
                model: config.model.name,
                messages: config.messages,
            });

            const durationEnd = Date.now();
            const result = await run.json();

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

            // Extract the top choice of message and return it
            const response = result.choices?.[0]?.message.content ?? "No response from Snowflake";

            return { response, model: config.model.name };
        } catch (error) {
            console.error('Error generating response:', error);
            return { response: 'I apologize, but I encountered an error. Please try again.', model: 'error' };
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

        // For production, you would implement REST API calls to your Snowflake data
        // This would require additional endpoints in your Snowflake setup
        console.log('Product search not implemented for REST API yet');
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

        // For production, you would implement REST API calls to your Snowflake data
        console.log('Order lookup not implemented for REST API yet');
        return [];
    }
}

module.exports = { SnowflakeRestConnector }; 