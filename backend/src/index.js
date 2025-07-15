import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';

import chatRoutes from './routes/chat.js';
import orderRoutes from './routes/orders.js';
import returnRoutes from './routes/returns.js';
import productRoutes from './routes/products.js';
import { errorHandler } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use('/api', limiter);

app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/products', productRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});