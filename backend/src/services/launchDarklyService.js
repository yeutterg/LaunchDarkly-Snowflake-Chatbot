import LaunchDarkly from '@launchdarkly/node-server-sdk';
import { AIConfig, AIConfigTracker } from '@launchdarkly/ai-sdk';
import { logger } from '../utils/logger.js';

export class LaunchDarklyService {
  constructor() {
    this.ldClient = null;
    this.aiTracker = null;
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
      this.aiTracker = new AIConfigTracker(this.ldClient);
      this.initialized = true;
      logger.info('LaunchDarkly initialized successfully');
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
      const prompt = await this.ldClient.variation(
        'chatbot-system-prompt',
        userContext,
        defaultPrompt
      );
      
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
      const config = await this.ldClient.variation(
        'llm-model-selection',
        userContext,
        defaultConfig
      );
      
      return config;
    } catch (error) {
      logger.error('Error getting model config:', error);
      return defaultConfig;
    }
  }

  async trackChatMetrics(userContext, metrics) {
    await this.waitForInitialization();
    
    try {
      this.ldClient.track('chat-interaction', userContext, {
        duration: metrics.duration,
        tokens: metrics.tokens,
        model: metrics.model,
        provider: metrics.provider,
        success: metrics.success,
        error: metrics.error || null
      });

      if (this.aiTracker) {
        this.aiTracker.trackDuration('response-time', metrics.duration);
        this.aiTracker.trackTokenUsage('tokens-used', metrics.tokens);
        
        if (metrics.satisfaction !== undefined) {
          this.aiTracker.trackFeedback('user-satisfaction', metrics.satisfaction);
        }
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