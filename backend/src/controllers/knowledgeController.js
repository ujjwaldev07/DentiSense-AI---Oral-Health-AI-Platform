import mongoose from 'mongoose';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { Category } from '../models/Category.js';
import { DENTAL_CATEGORIES } from '../config/constants.js';
import { processAndIndexDocument, reindexDocument } from '../services/ragService.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';

export const getAllDocuments = async (req, res) => {
  const { search, category, topic, language, page = 1, limit = 12 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const filter = { isPublished: true };

  const targetCategory = category || topic;
  if (targetCategory && targetCategory !== 'All') {
    filter.$or = [{ category: targetCategory }, { topic: targetCategory }];
  }

  if (language && language !== 'all') {
    filter.language = language;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { summary: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const [documents, total] = await Promise.all([
    KnowledgeDocument.find(filter)
      .select('title slug topic category language summary tags symptomsAddressed sourceReference metadata createdAt viewCount retrievalCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    KnowledgeDocument.countDocuments(filter)
  ]);

  return sendPaginated(res, 'Knowledge documents retrieved', documents, {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  });
};

export const getDocumentBySlug = async (req, res) => {
  const { slug } = req.params;

  let query;
  if (mongoose.Types.ObjectId.isValid(slug)) {
    query = { _id: slug, isPublished: true };
  } else {
    query = { slug, isPublished: true };
  }

  const doc = await KnowledgeDocument.findOneAndUpdate(
    query,
    { $inc: { viewCount: 1 } },
    { new: true }
  );

  if (!doc) {
    return sendError(res, 'Dental knowledge article not found', null, 404);
  }

  return sendSuccess(res, 'Document retrieved successfully', doc);
};

export const createDocument = async (req, res) => {
  const data = req.body;

  const baseSlug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  let slug = baseSlug;
  const existing = await KnowledgeDocument.findOne({ slug });
  if (existing) {
    slug = `${baseSlug}-${Date.now()}`;
  }

  const doc = new KnowledgeDocument({
    ...data,
    topic: data.topic || data.category,
    slug,
    createdBy: req.user._id
  });

  // Index document chunks and embeddings
  await processAndIndexDocument(doc);

  return sendSuccess(res, 'Knowledge document created and indexed for RAG vector search', doc, 201);
};

export const updateDocument = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid document ID', null, 400);
  }

  const doc = await KnowledgeDocument.findById(id);
  if (!doc) {
    return sendError(res, 'Document not found', null, 404);
  }

  Object.assign(doc, updates);
  if (updates.category && !updates.topic) {
    doc.topic = updates.category;
  }

  // Re-index chunks and embeddings if content or title changed
  if (updates.content || updates.title || updates.summary) {
    await processAndIndexDocument(doc);
  } else {
    await doc.save();
  }

  return sendSuccess(res, 'Document updated successfully', doc);
};

export const deleteDocument = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid document ID', null, 400);
  }

  const doc = await KnowledgeDocument.findByIdAndDelete(id);
  if (!doc) {
    return sendError(res, 'Document not found', null, 404);
  }

  return sendSuccess(res, 'Document deleted successfully');
};

export const reindexSingleDocument = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid document ID', null, 400);
  }

  const doc = await reindexDocument(id);
  return sendSuccess(res, 'Document chunks and dense embeddings re-indexed successfully', doc);
};

import { extractTextFromPdf } from '../services/pdfService.js';

// In-Memory Ingestion Job Tracker (Supports real-time progress polling)
const INGESTION_JOBS = new Map();

// Helper to update job status safely
const updateJob = (jobId, patch) => {
  const existing = INGESTION_JOBS.get(jobId);
  if (existing) {
    INGESTION_JOBS.set(jobId, {
      ...existing,
      ...patch,
      updatedAt: new Date()
    });
  }
};

// Periodic cleanup of jobs older than 2 hours
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, job] of INGESTION_JOBS.entries()) {
    if (new Date(job.createdAt).getTime() < twoHoursAgo) {
      INGESTION_JOBS.delete(id);
    }
  }
}, 30 * 60 * 1000).unref();

/**
 * Background worker executing PDF extraction, semantic chunking, and embedding generation
 */
const runPdfIngestionPipeline = async (jobId, fileBuffer, originalname, body, user) => {
  try {
    // 1. Text Extraction
    updateJob(jobId, {
      status: 'extracting',
      stepLabel: 'Extracting clean text from clinical PDF...',
      progress: 15
    });

    const { text: extractedText, numPages } = await extractTextFromPdf(fileBuffer);

    if (!extractedText || extractedText.length < 30) {
      throw new Error('Extracted text from PDF is too short or unreadable. Please ensure the PDF contains searchable text.');
    }

    // 2. Metadata Preparation
    const rawTitle = body.title || originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const category = body.category || 'Tooth Decay & Cavities';
    const language = body.language || 'en';
    const summary = (body.summary || extractedText.substring(0, 300)).trim();

    const baseSlug = rawTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    let slug = baseSlug || `doc-${Date.now()}`;
    const existingDoc = await KnowledgeDocument.findOne({ slug });
    if (existingDoc) {
      slug = `${slug}-${Date.now()}`;
    }

    const doc = new KnowledgeDocument({
      title: rawTitle,
      slug,
      category,
      topic: body.topic || category,
      language,
      summary,
      content: extractedText,
      tags: body.tags
        ? (typeof body.tags === 'string' ? body.tags.split(',').map(t => t.trim()).filter(Boolean) : body.tags)
        : ['pdf-upload', 'clinical-guideline'],
      sourceReference: {
        organization: body.organization || 'Uploaded Clinical PDF Reference',
        publishedYear: parseInt(body.publishedYear || new Date().getFullYear(), 10),
        url: body.url || ''
      },
      metadata: {
        targetAudience: body.targetAudience || 'General Public',
        difficulty: 'basic',
        isVerified: true,
        originalFilename: originalname,
        pageCount: numPages
      },
      createdBy: user?._id
    });

    updateJob(jobId, {
      title: rawTitle,
      category,
      numPages,
      status: 'chunking',
      stepLabel: `Extracted ${numPages} pages (${extractedText.length.toLocaleString()} chars). Chunking text...`,
      progress: 30
    });

    // 3. Chunking, Embedding Generation & Vector Storage
    await processAndIndexDocument(doc, {
      onProgress: (p) => {
        updateJob(jobId, {
          status: p.step,
          stepLabel: p.stepLabel,
          progress: p.progress,
          chunkCount: p.chunkCount
        });
      }
    });

    // 4. Mark Completed
    updateJob(jobId, {
      status: 'completed',
      stepLabel: `Ingestion complete! ${doc.chunks.length} chunks indexed with 768-dim vector embeddings.`,
      progress: 100,
      documentId: doc._id,
      chunkCount: doc.chunks.length,
      docTitle: doc.title,
      chunksSummary: doc.chunks.slice(0, 5).map(c => ({
        chunkIndex: c.chunkIndex,
        tokenCount: c.tokenCount,
        embeddingLength: c.embedding?.length || 0
      }))
    });
  } catch (error) {
    console.error(`❌ [PDF Ingestion Job ${jobId}] Failed:`, error.message);
    updateJob(jobId, {
      status: 'failed',
      stepLabel: error.message,
      error: error.message,
      progress: 0
    });
  }
};

export const uploadPdfDocument = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return sendError(res, 'No PDF file uploaded. Please attach a valid PDF document with field name "file".', null, 400);
  }

  const { originalname, size, buffer } = req.file;
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Register initial job
  INGESTION_JOBS.set(jobId, {
    jobId,
    status: 'uploaded',
    stepLabel: 'File uploaded successfully. Initializing ingestion pipeline...',
    progress: 5,
    filename: originalname,
    fileSize: size,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Launch background pipeline asynchronously (non-blocking for proxy/client)
  runPdfIngestionPipeline(jobId, buffer, originalname, req.body, req.user);

  return sendSuccess(
    res,
    'PDF document uploaded successfully. Ingestion and vector indexing started.',
    {
      jobId,
      status: 'uploaded',
      filename: originalname,
      fileSize: size
    },
    202
  );
};

export const getIngestionStatus = async (req, res) => {
  const { jobId } = req.params;
  const job = INGESTION_JOBS.get(jobId);

  if (!job) {
    return sendError(res, 'Ingestion job not found or expired', null, 404);
  }

  return sendSuccess(res, 'Ingestion status retrieved', job);
};

export const reindexAllDocuments = async (req, res) => {
  const documents = await KnowledgeDocument.find();
  let reindexedCount = 0;

  for (const doc of documents) {
    await processAndIndexDocument(doc);
    reindexedCount++;
  }

  return sendSuccess(res, `Successfully re-chunked and generated embeddings for ${reindexedCount} documents`, {
    reindexedCount
  });
};

export const getCategories = async (req, res) => {
  let dbCategories = await Category.find().sort({ isDefault: -1, name: 1 }).lean();

  if (dbCategories.length === 0) {
    const seedData = DENTAL_CATEGORIES.map(name => ({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: `Dental clinical awareness topic: ${name}`,
      isDefault: true
    }));
    try {
      dbCategories = await Category.insertMany(seedData, { ordered: false });
    } catch (e) {
      dbCategories = await Category.find().sort({ isDefault: -1, name: 1 }).lean();
    }
  }

  // Aggregate any existing doc categories not yet in Category collection
  const docCategories = await KnowledgeDocument.distinct('category');
  const existingNames = new Set(dbCategories.map(c => c.name.toLowerCase()));
  const extraCategories = [];

  for (const cat of docCategories) {
    if (cat && !existingNames.has(cat.toLowerCase())) {
      extraCategories.push({
        name: cat,
        slug: cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: 'Knowledge category',
        isDefault: false
      });
      existingNames.add(cat.toLowerCase());
    }
  }

  const allCategories = [...dbCategories, ...extraCategories];
  return sendSuccess(res, 'Categories retrieved successfully', allCategories);
};

export const createCategory = async (req, res) => {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return sendError(res, 'Category name must be at least 2 characters long.', null, 400);
  }

  const trimmedName = name.trim();
  const normalizedLower = trimmedName.toLowerCase();

  const matchesDefault = DENTAL_CATEGORIES.some(cat => cat.toLowerCase() === normalizedLower);
  if (matchesDefault) {
    return sendError(res, 'This dental category already exists as a platform default.', null, 409);
  }

  const existingCategory = await Category.findOne({
    name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });

  if (existingCategory) {
    return sendError(res, 'A dental category with this name already exists.', null, 409);
  }

  const newCategory = await Category.create({
    name: trimmedName,
    description: description ? description.trim() : '',
    isDefault: false,
    createdBy: req.user?._id
  });

  return sendSuccess(res, 'New dental category created successfully', newCategory, 201);
};
