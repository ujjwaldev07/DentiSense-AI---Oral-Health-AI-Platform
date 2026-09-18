import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5060,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5174',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dental_awareness_db',
  ATLAS_VECTOR_INDEX_NAME: process.env.ATLAS_VECTOR_INDEX_NAME || 'dental_knowledge_vector_index',
  JWT_SECRET: process.env.JWT_SECRET || 'oral_health_ai_super_secure_jwt_secret_key_2026_dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
  AI_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '50', 10),
  ADMIN_REGISTRATION_CODE: process.env.ADMIN_REGISTRATION_CODE || 'DENTA_ADMIN_2026'
};
