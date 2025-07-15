import LaunchDarkly from '@launchdarkly/node-server-sdk';
import { initAI } from '@launchdarkly/server-sdk-ai';
import { logger } from '../utils/logger.js';

export class LaunchDarklyService {
  constructor() {
    this.ldClient = null;
    this.ldAI = null;
    this.initialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY;
      if (!sdkKey) {
        throw new Error('LaunchDarkly SDK key not configured');
      }

      this.ldClient = LaunchDarkly.init(sdkKey, {
        logger: {
          debug: (msg) => logger.debug(`LD: ${msg}`),
          info: (msg) => logger.info(`LD: ${msg}`),
          warn: (msg) => logger.warn(`LD: ${msg}`),
          error: (msg) => logger.error(`LD: ${msg}`)
        }
      });

      await this.ldClient.waitForInitialization();
      
      // Initialize AI SDK
      this.ldAI = initAI(this.ldClient);
      
      this.initialized = true;
      logger.info('LaunchDarkly and AI SDK initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize LaunchDarkly:', error);
      throw error;
    }
  }

  async waitForInitialization() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async getSystemPrompt(userContext) {
    await this.waitForInitialization();
    
    const defaultPrompt = `You are a friendly and knowledgeable customer service representative for Farm Fresh Pet, a premium pet food store. You have access to order information, product details, and can help with returns. Always be helpful, concise, and empathetic to pet owners' concerns.`;
    
    try {
      // Use AI SDK for model configuration
      const config = this.ldAI.config('chatbot-system-prompt', userContext, {
        prompt: [
          { text: defaultPrompt, role: 'system' }
        ]
      });
      
      const prompt = config.prompt?.[0]?.text || defaultPrompt;
      return prompt;
    } catch (error) {
      logger.error('Error getting system prompt:', error);
      return defaultPrompt;
    }
  }

  async getModelConfig(userContext) {
    await this.waitForInitialization();
    
    const defaultConfig = {
      provider: 'snowflake',
      model: 'mixtral-8x7b',
      temperature: 0.7,
      maxTokens: 500
    };
    
    try {
      // Use AI SDK for model configuration
      const aiConfig = this.ldAI.config('llm-model-selection', userContext, {
        model: {
          id: defaultConfig.model,
          parameters: {
            temperature: defaultConfig.temperature,
            maxTokens: defaultConfig.maxTokens
          }
        }
      });
      
      // Extract model configuration
      const config = {
        provider: aiConfig.model?.provider || defaultConfig.provider,
        model: aiConfig.model?.id || defaultConfig.model,
        temperature: aiConfig.model?.parameters?.temperature || defaultConfig.temperature,
        maxTokens: aiConfig.model?.parameters?.maxTokens || defaultConfig.maxTokens
      };
      
      return config;
    } catch (error) {
      logger.error('Error getting model config:', error);
      return defaultConfig;
    }
  }

  async trackChatMetrics(userContext, metrics) {
    await this.waitForInitialization();
    
    try {
      // Track main chat interaction event
      this.ldClient.track('chat-interaction', userContext, {
        duration: metrics.duration,
        tokens: metrics.tokens,
        model: metrics.model,
        provider: metrics.provider,
        success: metrics.success,
        error: metrics.error || null
      });

      // Use AI SDK tracking for AI-specific metrics
      const tracker = this.ldAI.track(userContext);
      
      // Track generation metrics
      tracker.generation({
        configKey: 'llm-model-selection',
        input: { tokens: metrics.inputTokens || 0 },
        output: { tokens: metrics.tokens || 0 },
        duration: metrics.duration,
        success: metrics.success
      });
      
      // Track feedback if provided
      if (metrics.satisfaction !== undefined) {
        tracker.feedback({
          configKey: 'llm-model-selection',
          positive: metrics.satisfaction > 3,
          score: metrics.satisfaction
        });
      }
    } catch (error) {
      logger.error('Error tracking metrics:', error);
    }
  }

  async isFeatureEnabled(featureKey, userContext, defaultValue = false) {
    await this.waitForInitialization();
    
    try {
      return await this.ldClient.variation(
        featureKey,
        userContext,
        defaultValue
      );
    } catch (error) {
      logger.error(`Error checking feature flag ${featureKey}:`, error);
      return defaultValue;
    }
  }

  async close() {
    if (this.ldClient) {
      await this.ldClient.close();
    }
  }
}