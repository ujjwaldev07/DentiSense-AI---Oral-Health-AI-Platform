import { Router } from 'express';
import {
  sendMessage,
  streamMessage,
  getConversations,
  getConversationById,
  deleteConversation,
  rateConversation
} from '../controllers/chatController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { chatMessageSchema } from '../validations/schemas.js';
import { asyncHandler } from '../utils/asyncWrapper.js';

const router = Router();

router.use(requireAuth);

router.post('/message', aiLimiter, validateRequest(chatMessageSchema), asyncHandler(sendMessage));
router.post('/stream', aiLimiter, validateRequest(chatMessageSchema), streamMessage);
router.get('/conversations', asyncHandler(getConversations));
router.get('/conversations/:id', asyncHandler(getConversationById));
router.delete('/conversations/:id', asyncHandler(deleteConversation));
router.post('/conversations/:id/rate', asyncHandler(rateConversation));

export default router;
