const { SnowflakeSQLRestConnector } = require('./snowflake-sql-rest-connector');
const { getLaunchDarklyClients } = require('./launchdarkly-ai-client');

class ChatbotService {
    constructor() {
        this.snowflake = new SnowflakeSQLRestConnector();
        this.isInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Initialize LaunchDarkly clients
            await getLaunchDarklyClients();
            this.isInitialized = true;
            
            if (process.env.DEMO_MODE === 'true') {
                console.log('✅ Chatbot service initialized in DEMO MODE');
            } else {
                console.log('✅ Chatbot service initialized with live connections');
            }
        } catch (error) {
            console.error('Failed to initialize chatbot service:', error);
            
            // In demo mode, we should still initialize successfully
            if (process.env.DEMO_MODE === 'true') {
                console.log('⚠️  Running in DEMO MODE due to initialization error');
                this.isInitialized = true;
            } else {
                throw error;
            }
        }
    }
    
    async processMessage(message, sessionId, userEmail = 'guest@example.com') {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const startTime = Date.now();
        let metrics = {
            responseTime: 0,
            model: '',
            intent: '',
            error: null
        };
        
        try {
            const intent = await this.detectIntent(message);
            metrics.intent = intent;
            
            let context = '';
            let contextData = null;
            
            switch (intent) {
                case 'order_lookup':
                    const orderPattern = /\b(ORD-\d+)\b/i;
                    const orderMatch = message.match(orderPattern);
                    
                    if (orderMatch) {
                        contextData = await this.snowflake.lookupOrder(null, orderMatch[1]);
                    } else {
                        contextData = await this.snowflake.lookupOrder(userEmail);
                    }
                    
                    if (contextData && contextData.length > 0) {
                        context = `Customer Orders:\n${JSON.stringify(contextData, null, 2)}`;
                    } else {
                        context = 'No orders found for this customer.';
                    }
                    break;
                    
                case 'product_search':
                    const searchTerm = this.extractSearchTerm(message);
                    contextData = await this.snowflake.searchProducts(searchTerm);
                    
                    if (contextData && contextData.length > 0) {
                        context = `Available Products:\n${JSON.stringify(contextData, null, 2)}`;
                    } else {
                        context = 'No products found matching your search.';
                    }
                    break;
                    
                default:
                    context = 'You are a helpful customer service representative for Gravity Farms Petfood.';
            }
            
            // Generate response using the new REST-based approach
            const result = await this.snowflake.generateResponse(message, context, sessionId);
            
            metrics.responseTime = Date.now() - startTime;
            metrics.model = result.model || 'unknown';
            
            // Save chat history (simplified for now)
            await this.saveChatHistory(sessionId, message, result.response);
            
            return {
                response: result.response,
                model: result.model,
                metrics: metrics
            };
            
        } catch (error) {
            console.error('Error processing message:', error);
            metrics.error = error.message;
            metrics.responseTime = Date.now() - startTime;
            
            // Create a user-friendly error message based on the error type
            let userMessage = 'I apologize, but I encountered an error. Please try again.';
            
            if (error.message.includes('Snowflake Cortex API not available')) {
                userMessage = '🔧 **Configuration Issue Detected**\n\nI\'m unable to connect to Snowflake Cortex AI service. This usually means:\n\n• Snowflake Cortex is not enabled for your account\n• Contact Snowflake support to enable Cortex\n• Or switch to demo mode for testing\n\n**Status:** AI Config streaming ✅ | Snowflake Cortex ❌';
            } else if (error.message.includes('Unknown feature flag') || error.message.includes('Malformed AI config')) {
                userMessage = '🔧 **LaunchDarkly Configuration Issue**\n\nI\'m unable to find the AI configuration in LaunchDarkly. This usually means:\n\n• The AI config `gravity-farms-chatbot-config` doesn\'t exist\n• Create the AI config in your LaunchDarkly project\n• Or set DEMO_MODE=true in your environment\n\n**Status:** LaunchDarkly AI Config ❌ | Demo Mode Available ✅';
            } else if (error.message.includes('Invalid JSON response')) {
                userMessage = '🔧 **API Connection Issue**\n\nI\'m getting an invalid response from the AI service. This could be:\n\n• Network connectivity issues\n• Service temporarily unavailable\n• Authentication problems\n\n**Status:** Service Connection ❌ | Please try again later';
            }
            
            return {
                response: userMessage,
                model: 'error',
                metrics: metrics
            };
        }
    }
    
    async detectIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        const intents = [
            {
                name: 'order_lookup',
                patterns: ['order', 'track', 'shipment', 'delivery', 'ord-', 'purchase', 'bought']
            },
            {
                name: 'product_search',
                patterns: ['product', 'food', 'dog food', 'cat food', 'ingredients', 'price', 'available', 'recommend']
            },
            {
                name: 'return_request',
                patterns: ['return', 'refund', 'exchange', 'money back', 'send back']
            },
            {
                name: 'store_info',
                patterns: ['store', 'hours', 'location', 'address', 'open', 'closed']
            }
        ];
        
        for (const intent of intents) {
            for (const pattern of intent.patterns) {
                if (lowerMessage.includes(pattern)) {
                    return intent.name;
                }
            }
        }
        
        return 'general';
    }
    
    extractSearchTerm(message) {
        const stopWords = ['what', 'which', 'where', 'how', 'can', 'you', 'tell', 'me', 'about', 'is', 'are', 'the', 'a', 'an', 'do', 'have', 'any'];
        
        const words = message.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => !stopWords.includes(word) && word.length > 2);
        
        const relevantTerms = words.filter(word => 
            ['dog', 'cat', 'puppy', 'kitten', 'food', 'treat', 'grain', 'free', 'chicken', 'beef', 'salmon', 'fish'].includes(word)
        );
        
        return relevantTerms.length > 0 ? relevantTerms.join(' ') : words.slice(0, 3).join(' ');
    }
    
    async saveChatHistory(sessionId, userMessage, assistantResponse) {
        // For now, we'll just log the chat history
        // In a production environment, you would save this to a database
        console.log(`Chat History - Session: ${sessionId}`);
        console.log(`User: ${userMessage}`);
        console.log(`Assistant: ${assistantResponse}`);
    }
    
    async getChatHistory(sessionId) {
        // For now, return empty array as we're not persisting chat history
        // In a production environment, you would retrieve this from a database
        return [];
    }
    
    async shutdown() {
        // No explicit disconnect needed for REST-based connector
        this.isInitialized = false;
    }
}

module.exports = { ChatbotService };