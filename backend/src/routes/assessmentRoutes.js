import { Router } from 'express';
import {
  submitAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment
} from '../controllers/assessmentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { symptomAssessmentSchema } from '../validations/schemas.js';
import { asyncHandler } from '../utils/asyncWrapper.js';

const router = Router();

router.use(requireAuth);

router.post('/', validateRequest(symptomAssessmentSchema), asyncHandler(submitAssessment));
router.get('/', asyncHandler(getUserAssessments));
router.get('/:id', asyncHandler(getAssessmentById));
router.delete('/:id', asyncHandler(deleteAssessment));

export default router;
