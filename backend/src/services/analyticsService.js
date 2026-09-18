
import { Conversation } from '../models/Conversation.js';
import { Assessment } from '../models/Assessment.js';
import { Feedback } from '../models/Feedback.js';
import { User } from '../models/User.js';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';

export const getPlatformAnalytics = async () => {
  const [
    totalUsers,
    totalConversations,
    totalAssessments,
    totalDocuments,
    feedbacks,
    assessments,
    conversations,
    topRetrievedDocs,
    analyticsEvents
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Conversation.countDocuments(),
    Assessment.countDocuments(),
    KnowledgeDocument.countDocuments({ isPublished: true }),
    Feedback.find().select('rating category createdAt').lean(),
    Assessment.find().select('riskTier symptoms duration createdAt language').lean(),
    Conversation.find().select('primaryTopic language rating messages createdAt').lean(),
    KnowledgeDocument.find({ isPublished: true })
      .select('title topic category retrievalCount viewCount')
      .sort({ retrievalCount: -1, viewCount: -1 })
      .limit(6)
      .lean(),
    AnalyticsEvent.find({ eventType: 'chat_message', 'metadata.simulated': { $ne: true } })
      .select('metadata language topic createdAt')
      .limit(500)
      .lean()
  ]);

  // Topic frequency across conversations
  const topicCounts = {};
  for (const conv of conversations) {
    const topic = conv.primaryTopic || 'General Oral Hygiene';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }
  const topTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Language distribution
  const languageCounts = { en: 0, hi: 0, mr: 0 };
  for (const conv of conversations) {
    const lang = conv.language || 'en';
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  }
  for (const assess of assessments) {
    const lang = assess.language || 'en';
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  }
  const languageDistribution = [
    { language: 'English', code: 'en', count: languageCounts.en || 0 },
    { language: 'हिंदी (Hindi)', code: 'hi', count: languageCounts.hi || 0 },
    { language: 'मराठी (Marathi)', code: 'mr', count: languageCounts.mr || 0 }
  ];

  // Risk tier distribution
  const riskCounts = {
    'Low Risk / Routine Care': 0,
    'Moderate Risk / Consultation Recommended': 0,
    'High Risk / Urgent Dental Attention': 0
  };
  for (const assess of assessments) {
    if (assess.riskTier && riskCounts[assess.riskTier] !== undefined) {
      riskCounts[assess.riskTier]++;
    } else {
      riskCounts['Low Risk / Routine Care']++;
    }
  }
  const riskDistribution = Object.entries(riskCounts).map(([tier, count]) => ({ tier, count }));

  // Real feedback breakdown
  const ratings = feedbacks.map(f => f.rating).filter(Boolean);
  const avgRating = ratings.length > 0
    ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
    : null;
  const helpfulCount = feedbacks.filter(f => f.rating >= 4).length;
  const unhelpfulCount = feedbacks.filter(f => f.rating <= 2).length;

  const ratingDistribution = [1, 2, 3, 4, 5].map(stars => ({
    stars,
    count: feedbacks.filter(f => f.rating === stars).length
  }));

  // Latency calculation from real events
  let totalLatency = 0;
  let latencyCount = 0;
  let lowConfidenceCount = 0;

  for (const ev of analyticsEvents) {
    if (ev.metadata?.totalLatencyMs) {
      totalLatency += ev.metadata.totalLatencyMs;
      latencyCount++;
    }
    if (ev.metadata?.isLowConfidence) {
      lowConfidenceCount++;
    }
  }

  const averageLatencyMs = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : null;
  const questionsPerUser = totalUsers > 0 ? Number((conversations.length / totalUsers).toFixed(1)) : 0;

  // Real Activity Trends (Last 7 Days) using safe non-mutating date math
  const now = new Date();
  const activityTrends = [];
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const chatCount = conversations.filter(c => {
      const d = new Date(c.createdAt);
      return d >= startOfDay && d <= endOfDay;
    }).length;

    const assessCount = assessments.filter(a => {
      const d = new Date(a.createdAt);
      return d >= startOfDay && d <= endOfDay;
    }).length;

    activityTrends.push({
      date: dateStr,
      chats: chatCount,
      assessments: assessCount,
      total: chatCount + assessCount
    });
  }

  return {
    summary: {
      totalUsers,
      totalConversations,
      totalAssessments,
      totalDocuments,
      totalFeedback: feedbacks.length,
      helpfulCount,
      unhelpfulCount,
      averageSatisfaction: avgRating,
      questionsPerUser,
      averageLatencyMs,
      lowConfidenceCount
    },
    topTopics,
    topRetrievedDocs,
    languageDistribution,
    riskDistribution,
    ratingDistribution,
    activityTrends
  };
};

/**
 * Generate 100% genuine personal health journey analytics for an individual user.
 * Supports customizable timeframes (7d, 30d, 90d).
 */
export const getUserAnalytics = async (userId, options = {}) => {
  const days = Math.min(Math.max(parseInt(options.days || '30', 10), 7), 90);

  const [conversations, assessments, feedbacks] = await Promise.all([
    Conversation.find({ userId })
      .select('title primaryTopic language rating messages createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean(),
    Assessment.find({ userId })
      .select('primaryConcern riskTier symptoms painScore urgencyTimeline createdAt')
      .sort({ createdAt: -1 })
      .lean(),
    Feedback.find({ userId })
      .select('rating category comment createdAt')
      .sort({ createdAt: -1 })
      .lean()
  ]);

  // 1. Core KPIs
  const totalConversations = conversations.length;
  let questionsAsked = 0;
  for (const c of conversations) {
    if (Array.isArray(c.messages)) {
      questionsAsked += c.messages.filter(m => m.role === 'user').length;
    }
  }

  const totalMessagesSent = questionsAsked;
  const totalAssessments = assessments.length;
  const totalFeedbackGiven = feedbacks.length;

  const validRatings = feedbacks.map(f => f.rating).filter(r => typeof r === 'number' && r > 0);
  const averageHelpfulness = validRatings.length > 0
    ? Number((validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1))
    : null;

  // 2. Topics Aggregation (from actual conversations & assessments)
  const topicMap = new Map();
  for (const c of conversations) {
    const t = c.primaryTopic || 'General Oral Hygiene';
    topicMap.set(t, (topicMap.get(t) || 0) + 1);
  }
  for (const a of assessments) {
    const t = a.primaryConcern || 'General Checkup';
    topicMap.set(t, (topicMap.get(t) || 0) + 1);
  }

  const totalTopicHits = Array.from(topicMap.values()).reduce((sum, val) => sum + val, 0) || 1;
  const userTopics = Array.from(topicMap.entries())
    .map(([topic, count]) => ({
      topic,
      count,
      percentage: Math.round((count / totalTopicHits) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  const mostExploredTopic = userTopics.length > 0 ? userTopics[0].topic : null;

  // 3. Activity Trends across requested day window (7, 30, or 90 days)
  const now = new Date();
  const activityTrends = [];

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    const rawDate = targetDate.toISOString().split('T')[0];

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const dayChats = conversations.filter(c => {
      const d = new Date(c.createdAt);
      return d >= startOfDay && d <= endOfDay;
    }).length;

    const dayAssessments = assessments.filter(a => {
      const d = new Date(a.createdAt);
      return d >= startOfDay && d <= endOfDay;
    }).length;

    activityTrends.push({
      date: dateStr,
      rawDate,
      chats: dayChats,
      assessments: dayAssessments,
      total: dayChats + dayAssessments,
      activities: dayChats + dayAssessments
    });
  }

  // 4. Real Risk Distribution from Assessments
  const riskTiersCount = {
    'Low Risk': 0,
    'Moderate Risk': 0,
    'High Risk': 0
  };

  for (const a of assessments) {
    const tier = String(a.riskTier || '');
    if (tier.includes('High')) {
      riskTiersCount['High Risk']++;
    } else if (tier.includes('Moderate')) {
      riskTiersCount['Moderate Risk']++;
    } else {
      riskTiersCount['Low Risk']++;
    }
  }

  const hasRiskData = assessments.length > 0;
  const riskColors = {
    'Low Risk': '#10b981',      // Emerald
    'Moderate Risk': '#f59e0b', // Amber
    'High Risk': '#ef4444'      // Rose
  };

  const riskDistribution = hasRiskData
    ? Object.entries(riskTiersCount).map(([tier, count]) => ({
        tier,
        count,
        percentage: Math.round((count / assessments.length) * 100),
        color: riskColors[tier]
      }))
    : [];

  // 5. Recent Activity List (Actual events without synthetic repeats)
  const combinedActivities = [
    ...conversations.map(c => ({
      id: c._id,
      type: 'chat',
      title: c.title || 'AI Dental Consultation',
      topic: c.primaryTopic || 'Oral Health',
      date: c.createdAt
    })),
    ...assessments.map(a => ({
      id: a._id,
      type: 'assessment',
      title: `Symptom Check: ${a.primaryConcern}`,
      topic: a.primaryConcern,
      riskTier: a.riskTier,
      painScore: a.painScore,
      date: a.createdAt
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // De-duplicate any consecutive identical entries
  const recentActivities = [];
  for (const act of combinedActivities) {
    const isConsecutiveDuplicate = recentActivities.length > 0 &&
      recentActivities[recentActivities.length - 1].title === act.title &&
      Math.abs(new Date(recentActivities[recentActivities.length - 1].date) - new Date(act.date)) < 1000;

    if (!isConsecutiveDuplicate) {
      recentActivities.push(act);
    }
    if (recentActivities.length >= 10) break;
  }

  // 6. Actionable Real Data Insights
  const insights = [];
  if (mostExploredTopic) {
    insights.push(`You explored "${mostExploredTopic}" most frequently across your oral health consultations.`);
  }
  if (totalAssessments > 0) {
    insights.push(`You completed ${totalAssessments} symptom evaluation${totalAssessments > 1 ? 's' : ''} to track risk progression.`);
  }
  if (questionsAsked > 0) {
    insights.push(`You asked ${questionsAsked} oral health question${questionsAsked > 1 ? 's' : ''} with the AI assistant.`);
  }
  if (hasRiskData) {
    const latestAssessment = assessments[0];
    const riskLabel = latestAssessment.riskTier ? latestAssessment.riskTier.split('/')[0].trim() : 'Low Risk';
    insights.push(`Your latest check for "${latestAssessment.primaryConcern}" was evaluated as ${riskLabel}.`);
  }
  if (insights.length === 0) {
    insights.push('Start exploring the AI assistant or complete a symptom check to generate personal oral health insights.');
  }

  return {
    summary: {
      totalConversations,
      totalChats: totalConversations,
      totalMessagesSent,
      questionsAsked,
      totalAssessments,
      totalFeedbackGiven,
      totalFeedbackSubmitted: totalFeedbackGiven,
      averageHelpfulness,
      averageSatisfactionGiven: averageHelpfulness,
      mostExploredTopic
    },
    userTopics,
    activityTrends,
    riskDistribution,
    hasRiskData,
    recentActivities,
    insights
  };
};
