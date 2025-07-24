const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { ChatbotService } = require('./chatbot-service');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));

const chatbotService = new ChatbotService();

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
        
        // For demo mode, check if we need to send a follow-up message
        console.log('DEMO_MODE:', process.env.DEMO_MODE, 'Type:', typeof process.env.DEMO_MODE);
        if (process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === true) {
            const lowerMessage = message.toLowerCase();
            const responses = [response];
            
            // Add follow-up message for any query except "human"
            if (!lowerMessage.includes('human')) {
                responses.push("Is there anything else I can help with?");
            }
            
            console.log('Sending responses array:', responses);
            res.json({ 
                responses,
                sessionId,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('Sending single response');
            res.json({ 
                response,
                sessionId,
                timestamp: new Date().toISOString()
            });
        }
        
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

async function startServer() {
    try {
        await chatbotService.initialize();
        
        app.listen(PORT, () => {
            console.log(`🚀 Chatbot backend running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
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