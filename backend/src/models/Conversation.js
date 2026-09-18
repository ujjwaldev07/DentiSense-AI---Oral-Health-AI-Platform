import mongoose from 'mongoose';
import { LANGUAGES } from '../config/constants.js';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: Object.values(LANGUAGES),
      default: LANGUAGES.EN
    },
    sources: [
      {
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeDocument' },
        title: { type: String },
        category: { type: String },
        sourceUrl: { type: String },
        organization: { type: String },
        relevanceScore: { type: Number }
      }
    ],
    warningLevel: {
      type: String,
      enum: ['none', 'routine_check', 'warning_signs_detected', 'urgent_medical_attention'],
      default: 'none'
    },
    disclaimerShown: {
      type: Boolean,
      default: true
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New Dental Consultation',
      trim: true
    },
    primaryTopic: {
      type: String,
      default: 'General Oral Hygiene'
    },
    language: {
      type: String,
      enum: Object.values(LANGUAGES),
      default: LANGUAGES.EN
    },
    messages: [messageSchema],
    isArchived: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedbackComment: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ userId: 1, createdAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
