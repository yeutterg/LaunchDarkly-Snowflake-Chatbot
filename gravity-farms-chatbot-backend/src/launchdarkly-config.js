const LaunchDarkly = require('@launchdarkly/node-server-sdk');

class LDChatbotConfig {
    constructor(sdkKey) {
        this.sdkKey = sdkKey;
        this.ldClient = null;
        this.initialized = false;
        this.isDemo = process.env.DEMO_MODE === 'true' || !sdkKey || sdkKey === '';
        
        if (this.isDemo) {
            console.log('🎮 Running in DEMO MODE - Using default LaunchDarkly configurations');
        }
    }

    async initialize() {
        if (this.initialized) return;
        
        if (this.isDemo) {
            this.initialized = true;
            return;
        }
        
        try {
            this.ldClient = LaunchDarkly.init(this.sdkKey);
            await this.ldClient.waitForInitialization();
            this.initialized = true;
            console.log('LaunchDarkly initialized successfully');
        } catch (error) {
            console.error('Failed to initialize LaunchDarkly:', error);
            throw error;
        }
    }

    async getSystemPrompt(userContext) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        const defaultPrompt = `You are a friendly and knowledgeable customer service representative for Gravity Farms Petfood, a premium pet food store. You have access to order information, product details, and can help with returns. Always be helpful, concise, and empathetic to pet owners' concerns.`;
        
        if (this.isDemo) {
            return defaultPrompt;
        }
        
        try {
            const prompt = await this.ldClient.variation(
                'chatbot-system-prompt',
                userContext,
                defaultPrompt
            );
            
            return prompt;
        } catch (error) {
            console.error('Error fetching system prompt:', error);
            return defaultPrompt;
        }
    }

    async getModelConfig(userContext) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        const defaultConfig = {
            provider: 'snowflake',
            model: 'mixtral-8x7b',
            temperature: 0.7,
            maxTokens: 500
        };
        
        if (this.isDemo) {
            return {
                provider: 'demo',
                model: 'demo-model',
                temperature: 0.7,
                maxTokens: 500
            };
        }
        
        try {
            const config = await this.ldClient.variation(
                'llm-model-selection',
                userContext,
                defaultConfig
            );
            
            return config;
        } catch (error) {
            console.error('Error fetching model config:', error);
            return defaultConfig;
        }
    }

    async trackChatMetrics(userContext, metrics) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        if (this.isDemo) {
            console.log('📊 Demo Metrics:', {
                responseTime: metrics.responseTime,
                model: metrics.model,
                intent: metrics.intent,
                sessionId: userContext.key
            });
            return;
        }
        
        try {
            await this.ldClient.track('chat-interaction', userContext, {
                responseTime: metrics.responseTime,
                model: metrics.model,
                intent: metrics.intent,
                sessionId: userContext.key,
                timestamp: new Date().toISOString()
            });

            if (metrics.tokens) {
                await this.ldClient.track('token-usage', userContext, metrics.tokens);
            }

            if (metrics.satisfaction !== undefined) {
                await this.ldClient.track('user-satisfaction', userContext, metrics.satisfaction);
            }

            if (metrics.error) {
                await this.ldClient.track('chat-error', userContext, {
                    error: metrics.error,
                    errorType: metrics.errorType || 'unknown'
                });
            }

            await this.ldClient.flush();
        } catch (error) {
            console.error('Error tracking metrics:', error);
        }
    }

    async getFeatureFlag(flagKey, userContext, defaultValue = false) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        if (this.isDemo) {
            return defaultValue;
        }
        
        try {
            return await this.ldClient.variation(flagKey, userContext, defaultValue);
        } catch (error) {
            console.error(`Error fetching feature flag ${flagKey}:`, error);
            return defaultValue;
        }
    }

    async close() {
        if (this.ldClient) {
            await this.ldClient.close();
            this.initialized = false;
        }
    }
}

module.exports = { LDChatbotConfig };