const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { ChatbotService } = require('./chatbot-service');
const { getLaunchDarklyClients } = require('./launchdarkly-ai-client');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));

const chatbotService = new ChatbotService();

// Store connected clients for SSE
const connectedClients = new Set();

// SSE endpoint for AI config updates
app.get('/api/chat/ai-config-stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write('data: {"type": "connected", "message": "AI Config stream connected"}\n\n');

    // Add client to connected set
    connectedClients.add(res);

    // Handle client disconnect
    req.on('close', () => {
        connectedClients.delete(res);
        console.log('Client disconnected from AI config stream');
    });

    console.log('Client connected to AI config stream');
});

// Function to broadcast AI config updates to all connected clients
function broadcastAIConfigUpdate(configData) {
    const message = `data: ${JSON.stringify({
        type: 'ai-config-update',
        config: configData
    })}\n\n`;

    connectedClients.forEach(client => {
        if (!client.destroyed) {
            client.write(message);
        }
    });
}

app.post('/api/chat/message', async (req, res) => {
    try {
        const { message, sessionId, userEmail } = req.body;
        
        if (!message || !sessionId) {
            return res.status(400).json({ 
                error: 'Message and sessionId are required' 
            });
        }
        
        const response = await chatbotService.processMessage(
            message, 
            sessionId, 
            userEmail
        );
        
        // Send the response in the expected format
        console.log('Sending response:', response);
        res.json({ 
            response: response.response,
            model: response.model,
            sessionId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({ 
            response: 'I apologize, but I encountered an error. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/api/chat/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return res.status(400).json({ 
                error: 'SessionId is required' 
            });
        }
        
        const history = await chatbotService.getChatHistory(sessionId);
        
        res.json({ 
            sessionId,
            history,
            count: history.length
        });
        
    } catch (error) {
        console.error('History endpoint error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve chat history',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        service: 'gravity-farms-chatbot',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test endpoint to trigger AI config update (for demonstration)
app.post('/api/test/trigger-ai-config-update', (req, res) => {
    const testConfig = {
        name: 'gravity-farms-chatbot-config',
        model: 'gpt-4-turbo',
        enabled: true,
        messagesCount: 2,
        systemMessage: 'You are now a more advanced AI assistant with updated capabilities.',
        timestamp: new Date().toISOString()
    };
    
    console.log('🧪 Test AI config update triggered:', testConfig);
    broadcastAIConfigUpdate(testConfig);
    
    res.json({ 
        message: 'AI config update triggered',
        config: testConfig
    });
});

app.get('/', (req, res) => {
    res.json({
        service: 'Gravity Farms Petfood Chatbot API',
        version: '1.0.0',
        endpoints: {
            chat: 'POST /api/chat/message',
            history: 'GET /api/chat/history/:sessionId',
            health: 'GET /health'
        }
    });
});

// Function to monitor AI config changes
async function monitorAIConfigChanges() {
    if (process.env.DEMO_MODE === 'true') {
        console.log('🎮 Demo mode: AI config monitoring disabled');
        return;
    }

    try {
        const { aiClient } = await getLaunchDarklyClients();
        const configKey = process.env.LAUNCHDARKLY_AI_CONFIG_KEY || 'gravity-farms-chatbot-config';
        
        // Set up a user context for monitoring
        const userContext = {
            type: 'user',
            name: 'AI Config Monitor',
            key: 'ai-config-monitor'
        };

        // Initial config fetch
        const initialConfig = await aiClient.config(configKey, userContext, {}, {});
        
        if (initialConfig.enabled && initialConfig.model && initialConfig.messages) {
            const configData = {
                name: configKey,
                model: initialConfig.model.name,
                enabled: initialConfig.enabled,
                messagesCount: initialConfig.messages.length,
                systemMessage: initialConfig.messages.find(msg => msg.role === 'system')?.content || '',
                timestamp: new Date().toISOString()
            };
            
            console.log('🎯 Initial AI config loaded:', configData);
            broadcastAIConfigUpdate(configData);
        }

        // Set up periodic monitoring (every 30 seconds)
        setInterval(async () => {
            try {
                const config = await aiClient.config(configKey, userContext, {}, {});
                
                if (config.enabled && config.model && config.messages) {
                    const configData = {
                        name: configKey,
                        model: config.model.name,
                        enabled: config.enabled,
                        messagesCount: config.messages.length,
                        systemMessage: config.messages.find(msg => msg.role === 'system')?.content || '',
                        timestamp: new Date().toISOString()
                    };
                    
                    console.log('🔄 AI config update detected:', configData);
                    broadcastAIConfigUpdate(configData);
                }
            } catch (error) {
                console.error('Error monitoring AI config:', error);
            }
        }, 30000); // Check every 30 seconds

    } catch (error) {
        console.error('Failed to set up AI config monitoring:', error);
    }
}

async function startServer() {
    try {
        await chatbotService.initialize();
        
        // Start AI config monitoring
        await monitorAIConfigChanges();
        
        app.listen(PORT, () => {
            console.log(`🚀 Chatbot backend running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📡 AI Config stream: http://localhost:${PORT}/api/chat/ai-config-stream`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    console.log('\n📴 Shutting down gracefully...');
    await chatbotService.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n📴 Shutting down gracefully...');
    await chatbotService.shutdown();
    process.exit(0);
});

startServer();