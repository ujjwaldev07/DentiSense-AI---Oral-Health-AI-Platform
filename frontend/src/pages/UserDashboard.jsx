import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Activity,
  BookOpen,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Star,
  Globe,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { chatAPI, assessmentAPI, analyticsAPI, feedbackAPI } from '../api/endpoints.js';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner.jsx';
import { QuickActions } from '../components/dashboard/QuickActions.jsx';
import { RecentChatsCard } from '../components/dashboard/RecentChatsCard.jsx';
import { TopicsCard } from '../components/dashboard/TopicsCard.jsx';
import { ActivityCard } from '../components/dashboard/ActivityCard.jsx';
import { AssessmentHistoryCard } from '../components/dashboard/AssessmentHistoryCard.jsx';
import { StatCard } from '../components/common/StatCard.jsx';
import { GlassCard } from '../components/common/GlassCard.jsx';

import { formatRatingDisplay } from '../utils/analyticsTransforms.js';

export const UserDashboard = ({ setActivePage, setSelectedChatId, setSelectedAssessmentId }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [recentChats, setRecentChats] = useState([]);
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [userTopics, setUserTopics] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [feedbackSummary, setFeedbackSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [chatsRes, assessRes, analyticsRes, feedbackRes] = await Promise.all([
        chatAPI.getHistory({ limit: 5 }).catch(() => ({ data: [] })),
        assessmentAPI.getHistory({ limit: 5 }).catch(() => ({ data: [] })),
        analyticsAPI.getUserAnalytics({ days: 30 }).catch(() => ({ data: {} })),
        feedbackAPI.getMyFeedback().catch(() => ({ data: { feedbacks: [] } }))
      ]);

      const chatsList = Array.isArray(chatsRes.data) ? chatsRes.data : (chatsRes.data?.chats || []);
      const assessList = Array.isArray(assessRes.data) ? assessRes.data : (assessRes.data?.assessments || []);
      const feedbacksList = feedbackRes.data?.feedbacks || (Array.isArray(feedbackRes.data) ? feedbackRes.data : []);
      const analyticsObj = analyticsRes.data || {};

      setRecentChats(chatsList);
      setRecentAssessments(assessList);
      setUserAnalytics(analyticsObj);
      setUserTopics(analyticsObj.userTopics || []);
      setUserActivities(analyticsObj.recentActivities || []);
      setFeedbackSummary(feedbacksList);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteChat = async (chatId) => {
    try {
      await chatAPI.deleteChat(chatId);
      setRecentChats((prev) => prev.filter((c) => (c.id || c._id) !== chatId));
    } catch (err) {
      console.error('Delete chat error:', err);
    }
  };

  const avgRating = feedbackSummary.length > 0
    ? (feedbackSummary.reduce((a, b) => a + b.rating, 0) / feedbackSummary.length)
    : (userAnalytics?.summary?.averageHelpfulness || null);

  return (
    <div className="space-y-8 py-6 sm:py-10 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <WelcomeBanner
        onStartChat={() => setActivePage('chat')}
        onStartAssessment={() => setActivePage('assessment')}
      />

      {/* Quick Action Navigation Grid */}
      <QuickActions onNavigate={setActivePage} />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Past Consultations"
          value={userAnalytics?.summary?.totalConversations ?? recentChats.length}
          subtitle="AI sessions logged"
          icon={MessageSquare}
          color="teal"
        />
        <StatCard
          title="Symptom Checks"
          value={userAnalytics?.summary?.totalAssessments ?? recentAssessments.length}
          subtitle="Evaluations completed"
          icon={Activity}
          color="cyan"
        />
        <StatCard
          title="Brushing Target"
          value={`${user?.oralHealthProfile?.brushingFrequency || 2}x / day`}
          subtitle="Daily routine adherence"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Satisfaction Rating"
          value={formatRatingDisplay(avgRating)}
          subtitle={feedbackSummary.length > 0 ? `${feedbackSummary.length} review${feedbackSummary.length === 1 ? '' : 's'} given` : 'Helpfulness rating'}
          icon={Star}
          color="amber"
        />
      </div>

      {/* Two Column Section: Recent Chats & Assessment History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentChatsCard
          chats={recentChats}
          loading={loading}
          onSelectChat={(id) => {
            if (setSelectedChatId) setSelectedChatId(id);
            setActivePage('chat');
          }}
          onDeleteChat={handleDeleteChat}
          onStartNew={() => setActivePage('chat')}
        />

        <AssessmentHistoryCard
          assessments={recentAssessments}
          loading={loading}
          onSelectAssessment={(id) => {
            if (setSelectedAssessmentId) setSelectedAssessmentId(id);
            setActivePage('assessment');
          }}
          onStartNew={() => setActivePage('assessment')}
        />
      </div>

      {/* Two Column Section: Topics Distribution & Personal Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopicsCard topics={userTopics} loading={loading} />
        <ActivityCard activities={userActivities} loading={loading} />
      </div>
    </div>
  );
};
