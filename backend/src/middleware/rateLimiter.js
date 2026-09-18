import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';

export const globalLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please wait a few minutes before trying again.',
    timestamp: new Date().toISOString()
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    timestamp: new Date().toISOString()
  }
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: ENV.AI_RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'AI query limit reached for your session. Please wait before asking more questions.',
    timestamp: new Date().toISOString()
  }
});
