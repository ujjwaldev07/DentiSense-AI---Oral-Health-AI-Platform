import { Router } from 'express';
import { signup, login, getProfile, updateProfile, logout } from '../controllers/authController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { signupSchema, loginSchema, updateProfileSchema } from '../validations/schemas.js';
import { asyncHandler } from '../utils/asyncWrapper.js';

const router = Router();

router.post('/signup', authLimiter, validateRequest(signupSchema), asyncHandler(signup));
router.post('/login', authLimiter, validateRequest(loginSchema), asyncHandler(login));
router.post('/logout', optionalAuth, asyncHandler(logout));
router.get('/profile', requireAuth, asyncHandler(getProfile));
router.put('/profile', requireAuth, validateRequest(updateProfileSchema), asyncHandler(updateProfile));

export default router;
