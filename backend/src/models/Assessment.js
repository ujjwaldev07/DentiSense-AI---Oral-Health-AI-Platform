import mongoose from 'mongoose';
import { LANGUAGES, RISK_TIERS } from '../config/constants.js';

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    language: {
      type: String,
      enum: Object.values(LANGUAGES),
      default: LANGUAGES.EN
    },
    primaryConcern: {
      type: String,
      required: true
    },
    symptoms: [
      {
        id: String,
        label: String,
        category: String,
        severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'moderate' }
      }
    ],
    duration: {
      type: String,
      enum: ['less_than_24_hours', '1_to_3_days', '1_to_2_weeks', 'over_2_weeks', 'months'],
      required: true
    },
    painScore: {
      type: Number,
      min: 0,
      max: 10,
      required: true
    },
    painType: {
      type: String,
      enum: ['none', 'dull_ache', 'sharp_shooting', 'throbbing', 'sensitivity_hot_cold', 'pain_on_chewing']
    },
    location: {
      type: String,
      enum: ['upper_teeth', 'lower_teeth', 'gums', 'tongue_cheeks', 'jaw_tmj', 'entire_mouth', 'unspecified'],
      default: 'unspecified'
    },
    redFlagsTriggered: [
      {
        code: String,
        description: String,
        urgentActionRequired: Boolean
      }
    ],
    riskTier: {
      type: String,
      enum: Object.values(RISK_TIERS),
      required: true
    },
    educationalSummary: {
      type: String,
      required: true
    },
    possibleConditionsToDiscuss: [
      {
        name: String,
        description: String,
        educationalNote: String
      }
    ],
    preventiveSelfCareTips: [String],
    recommendedQuestionsForDentist: [String],
    urgencyTimeline: {
      type: String,
      enum: ['routine_6_month', 'schedule_within_week', 'schedule_within_24_48h', 'immediate_emergency_visit'],
      required: true
    },
    disclaimerAcknowledged: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

assessmentSchema.index({ userId: 1, createdAt: -1 });

export const Assessment = mongoose.model('Assessment', assessmentSchema);
