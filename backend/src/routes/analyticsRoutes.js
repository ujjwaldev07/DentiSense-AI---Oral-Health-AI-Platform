import { Router } from 'express';
import { getAdminAnalytics, getUserPersonalAnalytics } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncWrapper.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(getUserPersonalAnalytics));
router.get('/admin', requireAuth, requireAdmin, asyncHandler(getAdminAnalytics));

export default router;
