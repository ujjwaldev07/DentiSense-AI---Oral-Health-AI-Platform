import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../common/GlassCard.jsx';

export const InsightsCard = ({ insights = [] }) => {
  return (
    <GlassCard level={2} className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Your Health Journey Insights
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated clinical trends synthesized strictly from your real activity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] flex items-start gap-3 text-xs leading-relaxed"
          >
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {insight}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
