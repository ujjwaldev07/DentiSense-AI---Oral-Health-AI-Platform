import React from 'react';
import { Activity, ArrowRight, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../common/EmptyState.jsx';
import { SkeletonLoader } from '../common/SkeletonLoader.jsx';
import { GlassCard } from '../common/GlassCard.jsx';

import { formatFriendlyDate } from '../../utils/analyticsTransforms.js';

export const AssessmentHistoryCard = ({
  assessments = [],
  loading = false,
  onSelectAssessment,
  onStartNew
}) => {
  return (
    <GlassCard level={2} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Symptom Assessments</span>
        </h3>
        <button
          onClick={onStartNew}
          className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
        >
          <span>Check Symptoms</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <SkeletonLoader count={2} className="h-16" />
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No symptom checks yet"
          description="Take a guided 5-step assessment to receive an educational risk summary and dentist questions."
          actionLabel="Start Symptom Assessment"
          onAction={onStartNew}
        />
      ) : (
        <div className="space-y-2.5">
          {assessments.slice(0, 4).map((a) => (
            <div
              key={a.id || a._id}
              onClick={() => onSelectAssessment && onSelectAssessment(a.id || a._id)}
              className="p-3.5 rounded-2xl glass-subtle hover:border-cyan-500/40 border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 cursor-pointer transition-all group"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                  {a.primaryConcern}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Pain: {a.painScore}/10</span>
                  <span>•</span>
                  <span>{formatFriendlyDate(a.createdAt)}</span>
                  {a.redFlagsTriggered?.length > 0 && (
                    <span className="text-rose-500 font-bold flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> Red Flag
                    </span>
                  )}
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 ${
                a.riskTier.includes('High')
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                  : a.riskTier.includes('Moderate')
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              }`}>
                {a.riskTier.split('/')[0].trim()}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
