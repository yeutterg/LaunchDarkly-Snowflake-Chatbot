import express from 'express';
import { SnowflakeService } from '../services/snowflakeService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const snowflake = new SnowflakeService();

router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const products = await snowflake.searchProducts(q, parseInt(limit));
    
    res.json({
      query: q,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
});

export default router;