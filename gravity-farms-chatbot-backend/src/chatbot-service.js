const { SnowflakeConnector } = require('./snowflake-connector');
const { LDChatbotConfig } = require('./launchdarkly-config');

class ChatbotService {
    constructor() {
        this.snowflake = new SnowflakeConnector({
            account: process.env.SNOWFLAKE_ACCOUNT,
            username: process.env.SNOWFLAKE_USER,
            password: process.env.SNOWFLAKE_PASSWORD,
            warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
            database: process.env.SNOWFLAKE_DATABASE || 'GRAVITY_FARMS_PETFOOD_AI',
            schema: process.env.SNOWFLAKE_SCHEMA || 'CHATBOT'
        });
        
        this.ldConfig = new LDChatbotConfig(process.env.LAUNCHDARKLY_SDK_KEY);
        this.isInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            await this.snowflake.connect();
            await this.ldConfig.initialize();
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
            const userContext = { 
                key: sessionId, 
                email: userEmail,
                custom: {
                    sessionStartTime: new Date().toISOString()
                }
            };
            
            const [systemPrompt, modelConfig] = await Promise.all([
                this.ldConfig.getSystemPrompt(userContext),
                this.ldConfig.getModelConfig(userContext)
            ]);
            
            metrics.model = modelConfig.model;
            
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
                        context = `Relevant Products:\n${JSON.stringify(contextData, null, 2)}`;
                    } else {
                        context = 'No products found matching the search criteria.';
                    }
                    break;
                    
                case 'return_request':
                    context = `Return Policy: Customers can return unopened products within 30 days of purchase for a full refund. Opened products can be returned within 14 days if the pet has an adverse reaction, with veterinary documentation.`;
                    break;
                    
                default:
                    const recentHistory = await this.snowflake.getChatHistory(sessionId, 5);
                    if (recentHistory.length > 0) {
                        context = `Recent conversation:\n${recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
                    }
            }
            
            const finalPrompt = `${systemPrompt}\n\nContext:\n${context}`;
            
            const response = await this.snowflake.generateResponse(
                message,
                finalPrompt,
                modelConfig.model
            );
            
            await this.snowflake.saveChatHistory(sessionId, message, response);
            
            metrics.responseTime = Date.now() - startTime;
            await this.ldConfig.trackChatMetrics(userContext, metrics);
            
            return response;
            
        } catch (error) {
            console.error('Error processing message:', error);
            metrics.error = error.message;
            metrics.errorType = error.constructor.name;
            metrics.responseTime = Date.now() - startTime;
            
            await this.ldConfig.trackChatMetrics(
                { key: sessionId, email: userEmail },
                metrics
            );
            
            return 'I apologize, but I encountered an error processing your request. Please try again or contact our support team for assistance.';
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
    
    async getChatHistory(sessionId) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        return await this.snowflake.getChatHistory(sessionId);
    }
    
    async shutdown() {
        await this.snowflake.disconnect();
        await this.ldConfig.close();
        this.isInitialized = false;
    }
}

module.exports = { ChatbotService };