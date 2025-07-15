import express from 'express';
import { SnowflakeService } from '../services/snowflakeService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const snowflake = new SnowflakeService();

router.post('/lookup', async (req, res, next) => {
  try {
    const { orderId, email } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await snowflake.lookupOrder(orderId, email);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;