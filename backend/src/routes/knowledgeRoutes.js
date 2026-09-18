import { Router } from 'express';
import {
  getAllDocuments,
  getDocumentBySlug,
  getCategories,
  createCategory,
  createDocument,
  updateDocument,
  deleteDocument,
  reindexSingleDocument,
  reindexAllDocuments,
  uploadPdfDocument,
  getIngestionStatus
} from '../controllers/knowledgeController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { handlePdfUpload } from '../middleware/uploadMiddleware.js';
import { knowledgeDocumentSchema, categoryCreateSchema } from '../validations/schemas.js';
import { asyncHandler } from '../utils/asyncWrapper.js';

const router = Router();

// Category routes (Must precede /:slug to avoid collision)
router.get('/categories', asyncHandler(getCategories));
router.post('/categories', requireAuth, requireAdmin, validateRequest(categoryCreateSchema), asyncHandler(createCategory));

// Public routes
router.get('/', asyncHandler(getAllDocuments));
router.get('/:slug', asyncHandler(getDocumentBySlug));

// Admin protected routes
router.post('/', requireAuth, requireAdmin, validateRequest(knowledgeDocumentSchema), asyncHandler(createDocument));
router.post('/upload-pdf', requireAuth, requireAdmin, handlePdfUpload, asyncHandler(uploadPdfDocument));
router.get('/ingestion-status/:jobId', requireAuth, requireAdmin, asyncHandler(getIngestionStatus));
router.put('/:id', requireAuth, requireAdmin, asyncHandler(updateDocument));
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(deleteDocument));
router.post('/admin/reindex', requireAuth, requireAdmin, asyncHandler(reindexAllDocuments));
router.post('/:id/reindex', requireAuth, requireAdmin, asyncHandler(reindexSingleDocument));

export default router;
