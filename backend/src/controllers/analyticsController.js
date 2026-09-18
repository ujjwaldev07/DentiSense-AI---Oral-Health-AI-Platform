import { getPlatformAnalytics, getUserAnalytics } from '../services/analyticsService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getAdminAnalytics = async (req, res) => {
  const analytics = await getPlatformAnalytics();
  return sendSuccess(res, 'Platform analytics retrieved', analytics);
};

export const getUserPersonalAnalytics = async (req, res) => {
  const days = parseInt(req.query.days || '30', 10);
  const userAnalytics = await getUserAnalytics(req.user._id, { days });
  return sendSuccess(res, 'User personal analytics retrieved', userAnalytics);
};
