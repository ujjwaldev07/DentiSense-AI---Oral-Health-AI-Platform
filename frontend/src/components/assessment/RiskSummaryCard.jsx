import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { Badge } from '../common/Badge.jsx';

export const RiskSummaryCard = ({ assessment }) => {
  const { t } = useLanguage();

  if (!assessment) return null;

  const isHigh = assessment.riskTier?.includes('High');
  const isModerate = assessment.riskTier?.includes('Moderate');

  const getTierStyles = () => {
    if (isHigh) {
      return {
        bg: 'from-rose-500/20 via-rose-500/10 to-transparent border-rose-500/40 text-rose-900 dark:text-rose-200',
        badgeColor: 'rose',
        icon: AlertCircle,
        timelineBadge: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30'
      };
    }
    if (isModerate) {
      return {
        bg: 'from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/40 text-amber-900 dark:text-amber-200',
        badgeColor: 'amber',
        icon: AlertTriangle,
        timelineBadge: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
      };
    }
    return {
      bg: 'from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/40 text-emerald-900 dark:text-emerald-200',
      badgeColor: 'emerald',
      icon: ShieldCheck,
      timelineBadge: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
    };
  };

  const styles = getTierStyles();
  const Icon = styles.icon;

  const timelineLabels = {
    immediate_emergency_visit: 'Immediate Emergency Dental Care',
    schedule_within_24_48h: 'Schedule Within 24-48 Hours',
    schedule_within_week: 'Schedule Within 1 Week',
    routine_6_month: 'Routine 6-Month Dental Checkup'
  };

  return (
    <div className={`p-6 sm:p-7 rounded-3xl glass-elevated bg-gradient-to-br ${styles.bg} border shadow-lg space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 shadow-md border border-white/20">
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400">
              {t('assessment.riskTier') || 'EVALUATED RISK PROFILE'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {assessment.riskTier}
            </h3>
          </div>
        </div>

        {assessment.urgencyTimeline && (
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${styles.timelineBadge} self-start sm:self-auto shadow-xs`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{timelineLabels[assessment.urgencyTimeline] || assessment.urgencyTimeline}</span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
        {assessment.educationalSummary}
      </div>
    </div>
  );
};
