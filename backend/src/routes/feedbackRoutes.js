import { Router } from 'express';
import { submitFeedback, getAllFeedbacks, updateFeedbackStatus, getMyFeedbacks } from '../controllers/feedbackController.js';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { feedbackSchema } from '../validations/schemas.js';
import { asyncHandler } from '../utils/asyncWrapper.js';

const router = Router();

router.post('/', optionalAuth, validateRequest(feedbackSchema), asyncHandler(submitFeedback));
router.get('/me', requireAuth, asyncHandler(getMyFeedbacks));
router.get('/', requireAuth, requireAdmin, asyncHandler(getAllFeedbacks));
router.put('/:id', requireAuth, requireAdmin, asyncHandler(updateFeedbackStatus));

export default router;
