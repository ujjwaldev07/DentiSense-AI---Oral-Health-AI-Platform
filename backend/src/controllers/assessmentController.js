import mongoose from 'mongoose';
import { Assessment } from '../models/Assessment.js';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { evaluateSymptomAssessment } from '../services/assessmentService.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';

export const submitAssessment = async (req, res) => {
  const {
    primaryConcern,
    symptoms,
    duration,
    painScore,
    painType,
    location,
    language = 'en',
    additionalNotes
  } = req.body;

  const userId = req.user._id;

  // Run clinical evaluation rules
  const evaluation = evaluateSymptomAssessment({
    primaryConcern,
    symptoms,
    duration,
    painScore,
    painType,
    location,
    language
  });

  // Create assessment record
  const assessment = await Assessment.create({
    userId,
    language,
    primaryConcern,
    symptoms,
    duration,
    painScore,
    painType,
    location,
    redFlagsTriggered: evaluation.redFlagsTriggered,
    riskTier: evaluation.riskTier,
    educationalSummary: evaluation.educationalSummary,
    possibleConditionsToDiscuss: evaluation.possibleConditionsToDiscuss,
    preventiveSelfCareTips: evaluation.preventiveSelfCareTips,
    recommendedQuestionsForDentist: evaluation.recommendedQuestionsForDentist,
    urgencyTimeline: evaluation.urgencyTimeline,
    disclaimerAcknowledged: true
  });

  // Track analytics event
  AnalyticsEvent.create({
    eventType: 'symptom_assessment',
    userId,
    topic: primaryConcern,
    language,
    metadata: {
      riskTier: evaluation.riskTier,
      painScore,
      redFlagsCount: evaluation.redFlagsTriggered.length
    }
  }).catch(err => console.error('Analytics event error:', err.message));

  return sendSuccess(res, 'Assessment evaluated successfully', assessment, 201);
};

export const getUserAssessments = async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '10', 10);
  const skip = (page - 1) * limit;

  const [assessments, total] = await Promise.all([
    Assessment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Assessment.countDocuments({ userId: req.user._id })
  ]);

  return sendPaginated(res, 'Assessments retrieved', assessments, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
};

export const getAssessmentById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid assessment ID', null, 400);
  }

  const assessment = await Assessment.findOne({ _id: id, userId: req.user._id });
  if (!assessment) {
    return sendError(res, 'Assessment not found', null, 404);
  }

  return sendSuccess(res, 'Assessment retrieved', assessment);
};

export const deleteAssessment = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid assessment ID', null, 400);
  }

  const assessment = await Assessment.findOneAndDelete({ _id: id, userId: req.user._id });
  if (!assessment) {
    return sendError(res, 'Assessment not found', null, 404);
  }

  return sendSuccess(res, 'Assessment deleted successfully');
};
