import mongoose from 'mongoose';
import { LANGUAGES } from '../config/constants.js';

const analyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        'chat_message',
        'chat_query',
        'symptom_assessment',
        'knowledge_search',
        'document_view',
        'disease_view',
        'red_flag_alert',
        'voice_query_used',
        'ai_embedding_failure',
        'ai_generation_failure',
        'retrieval_failure'
      ],
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    topic: {
      type: String,
      default: 'General'
    },
    category: {
      type: String
    },
    language: {
      type: String,
      enum: Object.values(LANGUAGES),
      default: LANGUAGES.EN
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ topic: 1 });

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
