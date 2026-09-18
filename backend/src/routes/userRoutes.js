import { Router } from 'express';
import { getAllUsers, updateUserStatus, deleteUser } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncWrapper.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', asyncHandler(getAllUsers));
router.put('/:id', asyncHandler(updateUserStatus));
router.delete('/:id', asyncHandler(deleteUser));

export default router;
