import multer from 'multer';
import { sendError } from '../utils/apiResponse.js';

// Use memory storage for direct buffer processing
const storage = multer.memoryStorage();

// File filter to strictly validate PDF files
const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf';
  const hasPdfExt = file.originalname && file.originalname.toLowerCase().endsWith('.pdf');

  if (isPdfMime || hasPdfExt) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only clinical PDF documents (.pdf) are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

export const pdfUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB limit
  }
});

// Middleware wrapper that captures Multer errors cleanly
export const handlePdfUpload = (req, res, next) => {
  pdfUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'PDF file is too large. Maximum allowed size is 15 MB.', null, 400);
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(res, 'Unexpected upload field. Expected file under field name "file".', null, 400);
        }
        return sendError(res, `Upload error: ${err.message}`, null, 400);
      }
      return sendError(res, err.message || 'File upload failed', null, err.statusCode || 400);
    }
    next();
  });
};

