import { Router } from 'express';
import authRoutes from './authRoutes.js';
import chatRoutes from './chatRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';
import knowledgeRoutes from './knowledgeRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import userRoutes from './userRoutes.js';
import { getDbStatus } from '../config/db.js';
import { hasGeminiApiKey } from '../config/gemini.js';
import { ENV } from '../config/env.js';

const router = Router();

// Health check and System Status endpoint
router.get('/health', (req, res) => {
  const dbStatus = getDbStatus();
  return res.json({
    status: 'online',
    platform: 'AI-Powered Oral Health & Dental Disease Awareness Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
    database: {
      connected: dbStatus.isConnected,
      readyState: dbStatus.readyState,
      name: dbStatus.name
    },
    aiService: {
      hasGeminiApiKey: hasGeminiApiKey(),
      model: ENV.GEMINI_MODEL,
      embeddingModel: ENV.GEMINI_EMBEDDING_MODEL,
      engine: hasGeminiApiKey() ? 'Google Gemini AI (Active)' : 'Clinical Rule Engine (Active Fallback)'
    },
    safetyGuardrails: {
      educationalOnly: true,
      prescriptionsBlocked: true,
      mandatoryDisclaimer: true,
      emergencyTriage: true
    }
  });
});

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/users', userRoutes);

export default router;
