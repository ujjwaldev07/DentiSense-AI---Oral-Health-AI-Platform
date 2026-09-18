import mongoose from 'mongoose';
import { DENTAL_CATEGORIES, LANGUAGES } from '../config/constants.js';

const chunkSchema = new mongoose.Schema(
  {
    chunkIndex: { type: Number, required: true },
    chunkText: { type: String, required: true },
    tokenCount: { type: Number, default: 0 },
    embedding: {
      type: [Number],
      default: []
    }
  },
  { _id: true }
);

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    topic: {
      type: String,
      default: function() { return this.category; }
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    language: {
      type: String,
      enum: Object.values(LANGUAGES),
      default: LANGUAGES.EN
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      maxlength: [500, 'Summary cannot exceed 500 characters']
    },
    content: {
      type: String,
      required: [true, 'Full content is required']
    },
    tags: [{
      type: String,
      trim: true
    }],
    symptomsAddressed: [{
      type: String,
      trim: true
    }],
    preventiveTips: [{
      type: String
    }],
    warningSigns: [{
      type: String
    }],
    whenToSeeDentist: {
      type: String
    },
    sourceReference: {
      organization: { type: String, default: 'World Dental Federation / ADA / IDA Guidelines' },
      url: { type: String, default: '' },
      publishedYear: { type: Number, default: 2025 }
    },
    metadata: {
      targetAudience: { type: String, default: 'General Public' },
      difficulty: { type: String, enum: ['basic', 'intermediate', 'advanced'], default: 'basic' },
      isVerified: { type: Boolean, default: true }
    },
    chunks: [chunkSchema],
    isPublished: {
      type: Boolean,
      default: true
    },
    viewCount: {
      type: Number,
      default: 0
    },
    retrievalCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Virtual for source alias
knowledgeDocumentSchema.virtual('source').get(function () {
  return this.sourceReference?.organization || 'Clinical Dental Guidelines';
});

// Text index for standard text search fallback (with dummy language override so 'hi'/'mr' are allowed)
knowledgeDocumentSchema.index(
  { title: 'text', summary: 'text', content: 'text', tags: 'text' },
  { default_language: 'none', language_override: 'text_search_language' }
);
knowledgeDocumentSchema.index({ category: 1, language: 1 });
knowledgeDocumentSchema.index({ topic: 1 });
knowledgeDocumentSchema.index({ isPublished: 1 });
knowledgeDocumentSchema.index({ retrievalCount: -1 });

export const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema, 'knowledgeDocuments');
