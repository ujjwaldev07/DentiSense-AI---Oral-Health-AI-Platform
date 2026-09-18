import React from 'react';
import { Activity, MessageSquare, Clock } from 'lucide-react';
import { EmptyState } from '../common/EmptyState.jsx';
import { SkeletonLoader } from '../common/SkeletonLoader.jsx';
import { GlassCard } from '../common/GlassCard.jsx';
import { formatFriendlyDate } from '../../utils/analyticsTransforms.js';

export const ActivityCard = ({ activities = [], loading = false }) => {
  return (
    <GlassCard level={2} className="space-y-4">
      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        <span>Personal Health Activity Timeline</span>
      </h3>

      {loading ? (
        <SkeletonLoader count={3} className="h-12" />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No recent activity"
          description="Your symptom assessments and chat sessions will populate your personal timeline."
        />
      ) : (
        <div className="space-y-2.5">
          {activities.slice(0, 8).map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3.5 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 text-xs hover:border-slate-300 dark:hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                  item.type === 'chat'
                    ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                    : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                }`}>
                  {item.type === 'chat' ? <MessageSquare className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatFriendlyDate(item.date)}
                  </p>
                </div>
              </div>

              {item.riskTier && (
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${
                  item.riskTier.includes('High')
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    : item.riskTier.includes('Moderate')
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                }`}>
                  {item.riskTier.split('/')[0].trim()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
