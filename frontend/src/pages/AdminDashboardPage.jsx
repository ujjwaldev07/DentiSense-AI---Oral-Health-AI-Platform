import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  BarChart3,
  BookOpen,
  Users,
  MessageSquare,
  Activity,
  Star,
  Cpu,
  Layers,
  RefreshCw,
  Lock
} from 'lucide-react';
import { analyticsAPI } from '../api/endpoints.js';
import { StatCard } from '../components/common/StatCard.jsx';
import { TopicFrequencyChart } from '../components/analytics/TopicFrequencyChart.jsx';
import { ActivityTrendsChart } from '../components/analytics/ActivityTrendsChart.jsx';
import { LanguagePieChart } from '../components/analytics/LanguagePieChart.jsx';
import { RiskDistributionChart } from '../components/analytics/RiskDistributionChart.jsx';
import { KnowledgeManager } from '../components/admin/KnowledgeManager.jsx';
import { UserManagement } from '../components/admin/UserManagement.jsx';
import { FeedbackMonitor } from '../components/admin/FeedbackMonitor.jsx';
import { SystemHealthCard } from '../components/admin/SystemHealthCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { GlassCard } from '../components/common/GlassCard.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/forms/Button.jsx';
import { SkeletonLoader } from '../components/common/SkeletonLoader.jsx';

export const AdminDashboardPage = () => {
  const { t } = useLanguage();
  const { user, isAdmin, isAuthenticated, loginDemo } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [topTopics, setTopTopics] = useState([]);
  const [userMetrics, setUserMetrics] = useState(null);
  const [feedbackMetrics, setFeedbackMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAdminStats = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [overRes, topRes, usrRes, fbRes] = await Promise.all([
        analyticsAPI.getAdminOverview().catch(() => ({ data: { overview: {} } })),
        analyticsAPI.getAdminTopics().catch(() => ({ data: { topics: [] } })),
        analyticsAPI.getAdminUsers().catch(() => ({ data: { users: {} } })),
        analyticsAPI.getAdminFeedback().catch(() => ({ data: { feedback: {} } }))
      ]);

      setOverview(overRes.data?.overview || {});
      setTopTopics(topRes.data?.topics || []);
      setUserMetrics(usrRes.data?.users || {});
      setFeedbackMetrics(fbRes.data?.feedback || {});
    } catch (err) {
      console.error('Admin stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 sm:py-24 text-center space-y-4 animate-in fade-in duration-200">
        <GlassCard level={2} className="p-8 sm:p-10 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto text-2xl border border-purple-500/30 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Admin Portal Access Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Administrator credentials are required to manage indexed clinical documents, review feedback, and manage user accounts.
          </p>
          <Button
            onClick={() => loginDemo('admin')}
            variant="primary"
            size="md"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-500/20"
          >
            1-Click Demo Admin Login
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 sm:py-10 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Badge variant="purple" size="md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Governance & Analytics</span>
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {t('analytics.platformTitle') || 'Clinical Intelligence Governance'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
            Full oversight over Gemini vector embeddings, RAG knowledge indexing, and user access.
          </p>
        </div>

        <Button
          onClick={fetchAdminStats}
          disabled={loading}
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          className="self-start sm:self-auto"
        >
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Modern Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/[0.08] pb-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Analytics & Overview', icon: BarChart3 },
          { id: 'knowledge', label: 'Dental Knowledge Base (RAG)', icon: BookOpen },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'feedback', label: 'Feedback & Response Quality', icon: Star }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Analytics Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Top Platform Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title={t('analytics.activeUsers') || 'Users'}
              value={overview?.totalUsers || 0}
              subtitle="Registered profiles"
              icon={Users}
              color="purple"
            />
            <StatCard
              title={t('analytics.totalConversations') || 'Conversations'}
              value={overview?.totalChats || 0}
              subtitle="AI sessions logged"
              icon={MessageSquare}
              color="teal"
            />
            <StatCard
              title={t('analytics.totalAssessments') || 'Assessments'}
              value={overview?.totalAssessments || 0}
              subtitle="Symptom evaluations"
              icon={Activity}
              color="cyan"
            />
            <StatCard
              title="Indexed Documents"
              value={overview?.totalDiseases || 0}
              subtitle="RAG vector library"
              icon={BookOpen}
              color="emerald"
            />
            <StatCard
              title={t('analytics.avgSatisfaction') || 'Satisfaction'}
              value={`${overview?.averageSatisfaction || 4.8} ★`}
              subtitle="User rating average"
              icon={Star}
              color="amber"
            />
          </div>

          {/* System Health Architecture Card */}
          <SystemHealthCard />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Discussed Topics */}
            <GlassCard level={2} className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>{t('analytics.topicFrequency') || 'Topic Distribution Across Consultations'}</span>
              </h3>
              <TopicFrequencyChart data={topTopics} />
            </GlassCard>

            {/* Multilingual Language Split */}
            <GlassCard level={2} className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{t('analytics.languageUsage') || 'Language Distribution (EN / HI / MR)'}</span>
              </h3>
              <LanguagePieChart data={userMetrics?.languageDistribution || []} />
            </GlassCard>
          </div>
        </div>
      )}

      {/* TAB 2: Knowledge Base Management */}
      {activeTab === 'knowledge' && (
        <div className="animate-in fade-in duration-150">
          <KnowledgeManager />
        </div>
      )}

      {/* TAB 3: User Management */}
      {activeTab === 'users' && (
        <div className="animate-in fade-in duration-150">
          <UserManagement />
        </div>
      )}

      {/* TAB 4: Feedback Monitor */}
      {activeTab === 'feedback' && (
        <div className="animate-in fade-in duration-150">
          <FeedbackMonitor />
        </div>
      )}
    </div>
  );
};
