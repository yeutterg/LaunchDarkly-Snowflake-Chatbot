import express from 'express';
import { ChatService } from '../services/chatService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const chatService = new ChatService();

router.post('/message', async (req, res, next) => {
  try {
    const { message, sessionId, userEmail } = req.body;
    
    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }

    logger.info(`Chat message received for session ${sessionId}`);
    
    const response = await chatService.processMessage(message, sessionId, userEmail);
    
    res.json({
      response: response.content,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      metadata: response.metadata
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const history = await chatService.getChatHistory(sessionId);
    
    res.json({
      sessionId: sessionId,
      messages: history
    });
  } catch (error) {
    next(error);
  }
});

export default router;