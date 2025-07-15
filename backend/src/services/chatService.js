import { SnowflakeService } from './snowflakeService.js';
import { LaunchDarklyService } from './launchDarklyService.js';
import { logger } from '../utils/logger.js';

export class ChatService {
  constructor() {
    this.snowflake = new SnowflakeService();
    this.launchDarkly = new LaunchDarklyService();
  }

  async processMessage(message, sessionId, userEmail) {
    try {
      const userContext = {
        key: sessionId,
        email: userEmail || 'anonymous',
        custom: {
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }
      };

      const systemPrompt = await this.launchDarkly.getSystemPrompt(userContext);
      const modelConfig = await this.launchDarkly.getModelConfig(userContext);

      const chatContext = await this.buildChatContext(message, sessionId, userEmail);

      await this.snowflake.saveChatMessage(sessionId, 'user', message);

      const startTime = Date.now();
      let response;

      try {
        if (modelConfig.provider === 'snowflake') {
          response = await this.snowflake.generateResponse(
            message,
            systemPrompt,
            chatContext,
            modelConfig
          );
        } else if (modelConfig.provider === 'openai') {
          response = await this.snowflake.callOpenAI(
            message,
            systemPrompt,
            chatContext,
            modelConfig
          );
        } else {
          throw new Error(`Unsupported model provider: ${modelConfig.provider}`);
        }

        await this.snowflake.saveChatMessage(sessionId, 'assistant', response);

        const metrics = {
          duration: Date.now() - startTime,
          tokens: Math.ceil(response.length / 4),
          model: modelConfig.model,
          provider: modelConfig.provider,
          success: true
        };

        await this.launchDarkly.trackChatMetrics(userContext, metrics);

        return {
          content: response,
          metadata: {
            model: modelConfig.model,
            provider: modelConfig.provider,
            processingTime: metrics.duration
          }
        };
      } catch (error) {
        logger.error('Error generating response:', error);
        
        const metrics = {
          duration: Date.now() - startTime,
          tokens: 0,
          model: modelConfig.model,
          provider: modelConfig.provider,
          success: false,
          error: error.message
        };

        await this.launchDarkly.trackChatMetrics(userContext, metrics);
        throw error;
      }
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }

  async buildChatContext(message, sessionId, userEmail) {
    const contexts = [];

    const orderMatch = message.match(/\b(?:order|tracking|shipment)\s*#?\s*([A-Z0-9-]+)\b/i);
    if (orderMatch) {
      const orderInfo = await this.snowflake.lookupOrder(orderMatch[1], userEmail);
      if (orderInfo) {
        contexts.push(`Order Information: ${JSON.stringify(orderInfo)}`);
      }
    }

    const productKeywords = message.match(/\b(?:food|treat|product|ingredient|nutrition)\b/i);
    if (productKeywords) {
      const products = await this.snowflake.searchProducts(message);
      if (products.length > 0) {
        contexts.push(`Related Products: ${JSON.stringify(products)}`);
      }
    }

    const recentMessages = await this.snowflake.getRecentChatHistory(sessionId, 5);
    if (recentMessages.length > 0) {
      contexts.push(`Recent Conversation: ${JSON.stringify(recentMessages)}`);
    }

    return contexts.join('\n\n');
  }

  async getChatHistory(sessionId) {
    try {
      return await this.snowflake.getChatHistory(sessionId);
    } catch (error) {
      logger.error('Error getting chat history:', error);
      throw error;
    }
  }
}