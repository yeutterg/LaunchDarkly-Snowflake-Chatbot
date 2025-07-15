import { logger } from './logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    error: err,
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      ip: req.ip
    }
  });

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: {
      message: message,
      status: status,
      timestamp: new Date().toISOString()
    }
  });
};