const snowflake = require('snowflake-sdk');
const { v4: uuidv4 } = require('uuid');
const { mockProducts, mockOrders, mockResponses, chatHistory } = require('./mock-data');

class SnowflakeConnector {
    constructor(config) {
        this.isDemo = process.env.DEMO_MODE === 'true' || 
                      !config.account || 
                      !config.username || 
                      !config.password;
        
        if (this.isDemo) {
            console.log('🎮 Running in DEMO MODE - Using mock data instead of Snowflake');
            this.mockDelay = () => new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
        } else {
            this.connectionConfig = {
                account: config.account,
                username: config.username,
                password: config.password,
                warehouse: config.warehouse,
                database: config.database,
                schema: config.schema,
                role: 'CORTEX_USER'
            };
        }
        
        this.connection = null;
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) return;
        
        if (this.isDemo) {
            this.isConnected = true;
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            this.connection = snowflake.createConnection(this.connectionConfig);
            
            this.connection.connect((err, conn) => {
                if (err) {
                    console.error('Failed to connect to Snowflake:', err);
                    reject(err);
                } else {
                    console.log('Successfully connected to Snowflake');
                    this.isConnected = true;
                    resolve(conn);
                }
            });
        });
    }

    async executeQuery(sqlText, binds = []) {
        if (!this.isConnected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.connection.execute({
                sqlText: sqlText,
                binds: binds,
                complete: (err, stmt, rows) => {
                    if (err) {
                        console.error('Failed to execute query:', err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            });
        });
    }

    async generateResponse(userMessage, context, model = 'mixtral-8x7b') {
        if (this.isDemo) {
            await this.mockDelay();
            
            // Simple mock response logic
            const lowerMessage = userMessage.toLowerCase();
            
            if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
                return mockResponses.greetings[Math.floor(Math.random() * mockResponses.greetings.length)];
            }
            
            if (lowerMessage.includes('help')) {
                return mockResponses.generalHelp;
            }
            
            if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
                return mockResponses.returnPolicy;
            }
            
            if (lowerMessage.includes('order') && !lowerMessage.includes('place')) {
                const orders = await this.lookupOrder('demo@example.com');
                if (orders.length > 0) {
                    return `I found ${orders.length} recent order(s) for you:\n\n` +
                           orders.map(o => `• Order ${o.orderId} (${o.status}) - $${o.totalAmount}`).join('\n') +
                           '\n\nWould you like more details about any of these orders?';
                }
                return mockResponses.orderNotFound[0];
            }
            
            if (lowerMessage.includes('product') || lowerMessage.includes('food')) {
                const products = await this.searchProducts(userMessage);
                if (products.length > 0) {
                    return `Here are some products that might interest you:\n\n` +
                           products.slice(0, 3).map(p => `• ${p.name} - $${p.price}\n  ${p.description}`).join('\n\n');
                }
                return mockResponses.productNotFound[0];
            }
            
            // Default response with context awareness
            return `I understand you're asking about "${userMessage}". ${mockResponses.generalHelp}`;
        }
        
        const prompt = `System: ${context}
User: ${userMessage}
Assistant:`;

        const query = `
            SELECT SNOWFLAKE.CORTEX.COMPLETE(?, ?) as response
        `;
        
        try {
            const result = await this.executeQuery(query, [model, prompt]);
            return result[0]?.RESPONSE || 'I apologize, but I encountered an error generating a response.';
        } catch (error) {
            console.error('Error generating response:', error);
            return 'I apologize, but I encountered an error. Please try again.';
        }
    }

    async searchProducts(searchQuery, limit = 5) {
        if (this.isDemo) {
            await this.mockDelay();
            const searchLower = searchQuery.toLowerCase();
            
            return mockProducts.filter(product => 
                product.name.toLowerCase().includes(searchLower) ||
                product.description.toLowerCase().includes(searchLower) ||
                product.category.toLowerCase().includes(searchLower) ||
                product.ingredients.toLowerCase().includes(searchLower)
            ).slice(0, limit);
        }
        
        const query = `
            SELECT product_id, name, description, category, price, ingredients
            FROM PRODUCTS
            WHERE LOWER(name) LIKE LOWER(?) 
               OR LOWER(description) LIKE LOWER(?)
               OR LOWER(category) LIKE LOWER(?)
               OR LOWER(ingredients) LIKE LOWER(?)
            LIMIT ?
        `;
        
        const searchPattern = `%${searchQuery}%`;
        
        try {
            const results = await this.executeQuery(query, [
                searchPattern, searchPattern, searchPattern, searchPattern, limit
            ]);
            
            return results.map(row => ({
                productId: row.PRODUCT_ID,
                name: row.NAME,
                description: row.DESCRIPTION,
                category: row.CATEGORY,
                price: row.PRICE,
                ingredients: row.INGREDIENTS
            }));
        } catch (error) {
            console.error('Error searching products:', error);
            return [];
        }
    }

    async lookupOrder(customerEmail, orderId = null) {
        if (this.isDemo) {
            await this.mockDelay();
            
            if (orderId) {
                const order = mockOrders.find(o => o.orderId === orderId);
                return order ? [order] : [];
            } else {
                // Return orders for demo email or the provided email
                return mockOrders.filter(o => 
                    o.customerEmail === customerEmail || 
                    customerEmail === 'demo@example.com' ||
                    customerEmail === 'guest@example.com'
                ).slice(0, 5);
            }
        }
        
        let query;
        let binds;
        
        if (orderId) {
            query = `
                SELECT order_id, customer_email, order_date, status, 
                       tracking_number, items, total_amount
                FROM ORDERS
                WHERE order_id = ?
            `;
            binds = [orderId];
        } else {
            query = `
                SELECT order_id, customer_email, order_date, status, 
                       tracking_number, items, total_amount
                FROM ORDERS
                WHERE customer_email = ?
                ORDER BY order_date DESC
                LIMIT 5
            `;
            binds = [customerEmail];
        }
        
        try {
            const results = await this.executeQuery(query, binds);
            
            return results.map(row => ({
                orderId: row.ORDER_ID,
                customerEmail: row.CUSTOMER_EMAIL,
                orderDate: row.ORDER_DATE,
                status: row.STATUS,
                trackingNumber: row.TRACKING_NUMBER,
                items: row.ITEMS,
                totalAmount: row.TOTAL_AMOUNT
            }));
        } catch (error) {
            console.error('Error looking up order:', error);
            return [];
        }
    }

    async saveChatHistory(sessionId, userMessage, assistantResponse) {
        const messageId = uuidv4();
        const timestamp = new Date().toISOString();
        
        if (this.isDemo) {
            // Store in memory for demo mode
            if (!chatHistory.has(sessionId)) {
                chatHistory.set(sessionId, []);
            }
            
            const history = chatHistory.get(sessionId);
            history.push(
                {
                    messageId: messageId + '-user',
                    timestamp,
                    role: 'user',
                    content: userMessage
                },
                {
                    messageId: messageId + '-assistant',
                    timestamp,
                    role: 'assistant',
                    content: assistantResponse
                }
            );
            
            // Keep only last 100 messages per session
            if (history.length > 100) {
                history.splice(0, history.length - 100);
            }
            
            return;
        }
        
        const queries = [
            {
                sqlText: `
                    INSERT INTO CHAT_HISTORY (session_id, message_id, timestamp, role, content)
                    VALUES (?, ?, ?, 'user', ?)
                `,
                binds: [sessionId, messageId + '-user', timestamp, userMessage]
            },
            {
                sqlText: `
                    INSERT INTO CHAT_HISTORY (session_id, message_id, timestamp, role, content)
                    VALUES (?, ?, ?, 'assistant', ?)
                `,
                binds: [sessionId, messageId + '-assistant', timestamp, assistantResponse]
            }
        ];
        
        try {
            for (const query of queries) {
                await this.executeQuery(query.sqlText, query.binds);
            }
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    async getChatHistory(sessionId, limit = 10) {
        if (this.isDemo) {
            const history = chatHistory.get(sessionId) || [];
            return history.slice(-limit);
        }
        
        const query = `
            SELECT message_id, timestamp, role, content
            FROM CHAT_HISTORY
            WHERE session_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        `;
        
        try {
            const results = await this.executeQuery(query, [sessionId, limit]);
            
            return results.map(row => ({
                messageId: row.MESSAGE_ID,
                timestamp: row.TIMESTAMP,
                role: row.ROLE,
                content: row.CONTENT
            })).reverse();
        } catch (error) {
            console.error('Error retrieving chat history:', error);
            return [];
        }
    }

    async disconnect() {
        if (this.connection && this.isConnected) {
            return new Promise((resolve) => {
                this.connection.destroy((err) => {
                    if (err) {
                        console.error('Error disconnecting from Snowflake:', err);
                    }
                    this.isConnected = false;
                    resolve();
                });
            });
        }
    }
}

module.exports = { SnowflakeConnector };