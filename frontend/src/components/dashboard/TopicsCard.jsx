import React from 'react';
import { BarChart2, BookOpen } from 'lucide-react';
import { TopicFrequencyChart } from '../analytics/TopicFrequencyChart.jsx';
import { EmptyState } from '../common/EmptyState.jsx';
import { SkeletonLoader } from '../common/SkeletonLoader.jsx';
import { GlassCard } from '../common/GlassCard.jsx';

export const TopicsCard = ({ topics = [], loading = false }) => {
  return (
    <GlassCard level={2} className="space-y-4">
      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span>Most Explored Oral Health Topics</span>
      </h3>

      {loading ? (
        <SkeletonLoader count={1} className="h-48" />
      ) : topics.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No topics recorded"
          description="Your explored dental categories will appear here after consultations."
        />
      ) : (
        <div className="space-y-4">
          <TopicFrequencyChart data={topics} />
        </div>
      )}
    </GlassCard>
  );
};
