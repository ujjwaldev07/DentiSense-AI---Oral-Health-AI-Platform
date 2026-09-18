import mongoose from 'mongoose';
import { Feedback } from '../models/Feedback.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';

export const submitFeedback = async (req, res) => {
  const { conversationId, assessmentId, rating, category, comment } = req.body;
  const userId = req.user ? req.user._id : undefined;

  const feedback = await Feedback.create({
    userId,
    conversationId: conversationId && mongoose.Types.ObjectId.isValid(conversationId) ? conversationId : undefined,
    assessmentId: assessmentId && mongoose.Types.ObjectId.isValid(assessmentId) ? assessmentId : undefined,
    rating,
    category: category || 'general',
    comment
  });

  return sendSuccess(res, 'Thank you for your feedback! It helps improve our oral health awareness system.', feedback, 201);
};

export const getAllFeedbacks = async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const skip = (page - 1) * limit;

  const [feedbacks, total] = await Promise.all([
    Feedback.find()
      .populate('userId', 'name email role')
      .populate('conversationId', 'title primaryTopic')
      .populate('assessmentId', 'primaryConcern riskTier')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Feedback.countDocuments()
  ]);

  return sendPaginated(res, 'Feedbacks retrieved', feedbacks, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
};

export const updateFeedbackStatus = async (req, res) => {
  const { id } = req.params;
  const { isReviewedByAdmin } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid feedback ID', null, 400);
  }

  const feedback = await Feedback.findByIdAndUpdate(
    id,
    { isReviewedByAdmin: Boolean(isReviewedByAdmin) },
    { new: true }
  );

  if (!feedback) {
    return sendError(res, 'Feedback not found', null, 404);
  }

  return sendSuccess(res, 'Feedback status updated', feedback);
};

export const getMyFeedbacks = async (req, res) => {
  const feedbacks = await Feedback.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  return sendSuccess(res, 'User feedbacks retrieved', { feedbacks, total: feedbacks.length });
};
