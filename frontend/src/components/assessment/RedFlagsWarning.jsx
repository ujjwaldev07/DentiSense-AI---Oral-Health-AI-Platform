import React from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { GlassCard } from '../common/GlassCard.jsx';

export const RedFlagsWarning = ({ redFlags = [] }) => {
  const { t } = useLanguage();

  if (!redFlags || redFlags.length === 0) return null;

  return (
    <div className="p-6 rounded-3xl bg-rose-500/15 border-2 border-rose-500/50 text-rose-950 dark:text-rose-100 shadow-xl shadow-rose-500/10 space-y-4 animate-in fade-in zoom-in-98 duration-200">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/30">
          <AlertOctagon className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm sm:text-base font-black text-rose-900 dark:text-rose-200 uppercase tracking-wide">
            {t('assessment.redFlagAlert') || 'URGENT RED-FLAG CLINICAL WARNING'}
          </h4>
          <p className="text-xs text-rose-800 dark:text-rose-300">
            {t('assessment.redFlagDesc') || 'Symptoms suggest a potential high-risk condition requiring timely professional examination.'}
          </p>
        </div>
      </div>

      <div className="space-y-2 pl-3 border-l-2 border-rose-500/40">
        {redFlags.map((flag, idx) => (
          <div key={idx} className="text-xs font-bold flex items-start gap-2">
            <span className="text-rose-600 dark:text-rose-400 shrink-0">⚠️</span>
            <span>{flag.description || flag.code}</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-rose-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-extrabold">
          <PhoneCall className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Recommended Action: Seek immediate or same-day in-person clinical dental consultation</span>
        </div>
      </div>
    </div>
  );
};
