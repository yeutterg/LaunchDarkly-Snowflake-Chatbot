import snowflake from 'snowflake-sdk';
import { logger } from '../utils/logger.js';

export class SnowflakeService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.connect();
  }

  async connect() {
    try {
      this.connection = snowflake.createConnection({
        account: process.env.SNOWFLAKE_ACCOUNT,
        username: process.env.SNOWFLAKE_USER,
        password: process.env.SNOWFLAKE_PASSWORD,
        warehouse: process.env.SNOWFLAKE_WAREHOUSE,
        database: process.env.SNOWFLAKE_DATABASE,
        schema: process.env.SNOWFLAKE_SCHEMA,
        role: 'CORTEX_USER'
      });

      await new Promise((resolve, reject) => {
        this.connection.connect((err, conn) => {
          if (err) {
            logger.error('Unable to connect to Snowflake:', err);
            reject(err);
          } else {
            logger.info('Successfully connected to Snowflake');
            this.isConnected = true;
            resolve(conn);
          }
        });
      });
    } catch (error) {
      logger.error('Snowflake connection error:', error);
      throw error;
    }
  }

  async execute(sqlText, binds = []) {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.connection.execute({
        sqlText: sqlText,
        binds: binds,
        complete: (err, stmt, rows) => {
          if (err) {
            logger.error('Failed to execute statement:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      });
    });
  }

  async generateResponse(message, systemPrompt, context, modelConfig) {
    const prompt = `${systemPrompt}

Context: ${context}

User: ${message}
Assistant:`;

    try {
      const query = `
        SELECT SNOWFLAKE.CORTEX.COMPLETE(
          ?,
          ?,
          OBJECT_CONSTRUCT(
            'temperature', ?,
            'max_tokens', ?
          )
        ) as response
      `;

      const result = await this.execute(query, [
        modelConfig.model || 'mixtral-8x7b',
        prompt,
        modelConfig.temperature || 0.7,
        modelConfig.maxTokens || 500
      ]);

      return result[0].RESPONSE;
    } catch (error) {
      logger.error('Error generating Cortex response:', error);
      throw error;
    }
  }

  async callOpenAI(message, systemPrompt, context, modelConfig) {
    try {
      const query = `
        SELECT CALL_OPENAI_CHAT(?) as response
      `;

      const prompt = `${systemPrompt}\n\nContext: ${context}\n\nUser: ${message}\nAssistant:`;
      const result = await this.execute(query, [prompt]);

      return result[0].RESPONSE;
    } catch (error) {
      logger.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  async searchProducts(query, limit = 5) {
    try {
      const searchQuery = `
        WITH query_embedding AS (
          SELECT SNOWFLAKE.CORTEX.EMBED_TEXT('e5-base-v2', ?) as embedding
        )
        SELECT 
          p.product_id,
          p.name,
          p.description,
          p.category,
          p.price,
          p.ingredients,
          VECTOR_COSINE_SIMILARITY(p.embedding, q.embedding) as similarity
        FROM PRODUCTS p, query_embedding q
        ORDER BY similarity DESC
        LIMIT ?
      `;

      const results = await this.execute(searchQuery, [query, limit]);
      return results;
    } catch (error) {
      logger.error('Error searching products:', error);
      return [];
    }
  }

  async lookupOrder(orderId, customerEmail) {
    try {
      const query = `
        SELECT 
          order_id,
          customer_email,
          order_date,
          status,
          tracking_number,
          items,
          total_amount
        FROM ORDERS
        WHERE order_id = ?
        ${customerEmail ? 'AND customer_email = ?' : ''}
      `;

      const binds = customerEmail ? [orderId, customerEmail] : [orderId];
      const results = await this.execute(query, binds);

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Error looking up order:', error);
      return null;
    }
  }

  async saveChatMessage(sessionId, role, content) {
    try {
      const query = `
        INSERT INTO CHAT_HISTORY (
          session_id,
          message_id,
          timestamp,
          role,
          content,
          metadata
        ) VALUES (?, ?, CURRENT_TIMESTAMP(), ?, ?, OBJECT_CONSTRUCT())
      `;

      const messageId = `${sessionId}-${Date.now()}-${role}`;
      await this.execute(query, [sessionId, messageId, role, content]);
    } catch (error) {
      logger.error('Error saving chat message:', error);
    }
  }

  async getChatHistory(sessionId) {
    try {
      const query = `
        SELECT 
          message_id as id,
          role,
          content,
          timestamp
        FROM CHAT_HISTORY
        WHERE session_id = ?
        ORDER BY timestamp ASC
      `;

      const results = await this.execute(query, [sessionId]);
      return results;
    } catch (error) {
      logger.error('Error getting chat history:', error);
      return [];
    }
  }

  async getRecentChatHistory(sessionId, limit = 5) {
    try {
      const query = `
        SELECT 
          role,
          content,
          timestamp
        FROM CHAT_HISTORY
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;

      const results = await this.execute(query, [sessionId, limit]);
      return results.reverse();
    } catch (error) {
      logger.error('Error getting recent chat history:', error);
      return [];
    }
  }
}