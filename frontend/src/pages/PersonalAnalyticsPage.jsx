import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Activity,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Star,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { analyticsAPI } from '../api/endpoints.js';
import { StatCard } from '../components/common/StatCard.jsx';
import { GlassCard } from '../components/common/GlassCard.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/forms/Button.jsx';
import { SkeletonLoader } from '../components/common/SkeletonLoader.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

import { ActivityTrendChart } from '../components/analytics/ActivityTrendChart.jsx';
import { TopicFrequencyChart } from '../components/analytics/TopicFrequencyChart.jsx';
import { RiskDistributionChart } from '../components/analytics/RiskDistributionChart.jsx';
import { InsightsCard } from '../components/analytics/InsightsCard.jsx';
import { ActivityCard } from '../components/dashboard/ActivityCard.jsx';
import { formatRatingDisplay } from '../utils/analyticsTransforms.js';

export const PersonalAnalyticsPage = () => {
  const { t } = useLanguage();
  const { isAuthenticated, loginDemo } = useAuth();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPersonalStats = useCallback(async (daysToFetch = selectedDays) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      const res = await analyticsAPI.getUserAnalytics({ days: daysToFetch });
      if (res && res.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('Personal Analytics fetch error:', err);
      setError('Unable to load analytics data right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedDays]);

  useEffect(() => {
    fetchPersonalStats(selectedDays);
  }, [fetchPersonalStats, selectedDays]);

  const handleTimeframeChange = (newDays) => {
    setSelectedDays(newDays);
  };

  const summary = analyticsData?.summary || {};
  const topics = analyticsData?.userTopics || [];
  const trends = analyticsData?.activityTrends || [];
  const riskDist = analyticsData?.riskDistribution || [];
  const hasRisk = analyticsData?.hasRiskData || false;
  const activities = analyticsData?.recentActivities || [];
  const insights = analyticsData?.insights || [];

  return (
    <div className="space-y-8 py-6 sm:py-10 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <Badge variant="teal" size="md">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Personal Health Journey</span>
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {t('analytics.personalTitle') || 'My Health Insights & Trends'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
            Track your consultations, symptom evaluations, and oral hygiene progress with genuine clinical analytics.
          </p>
        </div>

        {isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPersonalStats(selectedDays)}
            disabled={loading}
            className="self-start sm:self-auto gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        )}
      </div>

      {!isAuthenticated ? (
        <GlassCard level={2} className="p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-500/20 shadow-xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
            Sign in to View Your Health Journey
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Log in to securely view your historical consultation timeline, symptom check ratings, and personalized preventive trends.
          </p>
          <Button
            onClick={() => loginDemo('user')}
            variant="primary"
            size="md"
            className="shadow-md shadow-teal-500/20"
          >
            1-Click Demo Patient Login
          </Button>
        </GlassCard>
      ) : error ? (
        <GlassCard level={2} className="p-8 text-center space-y-3 max-w-md mx-auto">
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchPersonalStats(selectedDays)}>
            Try Again
          </Button>
        </GlassCard>
      ) : loading && !analyticsData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <SkeletonLoader count={5} className="h-28" />
          </div>
          <SkeletonLoader count={2} className="h-64" />
        </div>
      ) : (
        <>
          {/* TOP KPI SECTION - 5 Polished Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Sessions"
              value={summary.totalConversations ?? summary.totalChats ?? 0}
              subtitle="AI consultations logged"
              icon={MessageSquare}
              color="teal"
            />
            <StatCard
              title="Questions Asked"
              value={summary.questionsAsked ?? summary.totalMessagesSent ?? 0}
              subtitle="Oral inquiries submitted"
              icon={HelpCircle}
              color="cyan"
            />
            <StatCard
              title="Assessments"
              value={summary.totalAssessments ?? 0}
              subtitle="Symptom checks completed"
              icon={Activity}
              color="emerald"
            />
            <StatCard
              title="Top Focus"
              value={summary.mostExploredTopic ? summary.mostExploredTopic.split('(')[0].trim() : 'General Hygiene'}
              subtitle="Most explored topic"
              icon={Sparkles}
              color="indigo"
            />
            <StatCard
              title="Helpfulness"
              value={formatRatingDisplay(summary.averageHelpfulness)}
              subtitle={`${summary.totalFeedbackSubmitted ?? 0} review${summary.totalFeedbackSubmitted === 1 ? '' : 's'} submitted`}
              icon={Star}
              color="amber"
            />
          </div>

          {/* ACTIVITY TREND & TIME-SERIES */}
          <GlassCard level={2}>
            <ActivityTrendChart
              data={trends}
              days={selectedDays}
              onSelectDays={handleTimeframeChange}
            />
          </GlassCard>

          {/* TWO COLUMN SECTION: TOP TOPICS & RISK DISTRIBUTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Topics Horizontal Bar Chart */}
            <GlassCard level={2} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Frequently Explored Topics</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Categorized dental topics from your conversations & symptom checks.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <TopicFrequencyChart data={topics} />
              </div>
            </GlassCard>

            {/* Risk Distribution Donut Chart */}
            <GlassCard level={2} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Clinical Risk Tier Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Distribution of risk classifications across your symptom checks.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <RiskDistributionChart data={riskDist} hasData={hasRisk} />
              </div>
            </GlassCard>
          </div>

          {/* INSIGHTS SECTION */}
          {insights.length > 0 && (
            <InsightsCard insights={insights} />
          )}

          {/* RECENT ACTIVITY TIMELINE */}
          <ActivityCard activities={activities} loading={loading} />
        </>
      )}
    </div>
  );
};
