import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendError } from './utils/apiResponse.js';
import { ENV } from './config/env.js';

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin) || ENV.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logger
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to all api routes
app.use('/api', globalLimiter);

// Main API Router
app.use('/api', routes);

// Root route for quick verification
app.get('/', (req, res) => {
  res.json({
    message: 'DentiSense AI — AI-Powered Oral Health & Dental Disease Prediction Platform API is running.',
    healthCheck: '/api/health',
    docs: '/api/knowledge'
  });
});



// 404 Handler
app.use('*', (req, res) => {
  sendError(res, `Route ${req.originalUrl} not found on this server.`, null, 404);
});

// Centralized error handler
app.use(errorHandler);

export default app;
