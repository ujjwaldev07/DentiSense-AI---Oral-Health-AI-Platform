import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  Stethoscope,
  HelpCircle,
  Shield,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { RiskSummaryCard } from './RiskSummaryCard.jsx';
import { RedFlagsWarning } from './RedFlagsWarning.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { GlassCard } from '../common/GlassCard.jsx';
import { Button } from '../forms/Button.jsx';
import { Badge } from '../common/Badge.jsx';

export const ReportView = ({ assessment, onStartOver, onAskAI }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!assessment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `DentiSense AI - Oral Health Assessment Report
Primary Concern: ${assessment.primaryConcern}
Risk Tier: ${assessment.riskTier}
Pain Score: ${assessment.painScore}/10
Duration: ${assessment.duration}

Questions to Ask Your Dentist:
${(assessment.recommendedQuestionsForDentist || []).map(q => `- ${q}`).join('\n')}

Educational Disclaimer: This report is strictly for educational awareness and does not substitute a dentist.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <GlassCard level={2} className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              Educational Assessment Report
            </h2>
            <Badge variant="teal" size="sm">Verified Output</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generated on {new Date(assessment.createdAt || Date.now()).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleCopySummary}
            variant="secondary"
            size="sm"
            icon={copied ? Check : Copy}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>

          <Button
            onClick={handlePrint}
            variant="secondary"
            size="sm"
            icon={Printer}
          >
            Print
          </Button>

          <Button
            onClick={onStartOver}
            variant="primary"
            size="sm"
            icon={RotateCcw}
          >
            {t('assessment.startOver') || 'New Assessment'}
          </Button>
        </div>
      </GlassCard>

      {/* Red Flags Banner if triggered */}
      {assessment.redFlagsTriggered && assessment.redFlagsTriggered.length > 0 && (
        <RedFlagsWarning redFlags={assessment.redFlagsTriggered} />
      )}

      {/* Risk Summary Card */}
      <RiskSummaryCard assessment={assessment} />

      {/* Assessment Overview Data Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <GlassCard level={1} className="p-4 space-y-1">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reported Concern</p>
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {assessment.primaryConcern}
          </p>
        </GlassCard>

        <GlassCard level={1} className="p-4 space-y-1">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pain / Discomfort</p>
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
            {assessment.painScore} / 10
          </p>
        </GlassCard>

        <GlassCard level={1} className="p-4 space-y-1">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Duration</p>
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 capitalize truncate">
            {(assessment.duration || '').replace(/_/g, ' ')}
          </p>
        </GlassCard>

        <GlassCard level={1} className="p-4 space-y-1">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location</p>
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 capitalize truncate">
            {(assessment.location || 'Unspecified').replace(/_/g, ' ')}
          </p>
        </GlassCard>
      </div>

      {/* Questions for Dentist & Possible Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Questions for Dentist */}
        <GlassCard level={2} className="space-y-4">
          <div className="flex items-center gap-2.5 text-teal-700 dark:text-teal-400">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                {t('assessment.questionsForDentist')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Questions to ask during your dental appointment
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-xs sm:text-sm">
            {(assessment.recommendedQuestionsForDentist || []).map((q, idx) => (
              <li key={idx} className="p-3 rounded-2xl glass-subtle border border-teal-500/20 text-slate-800 dark:text-slate-200 flex items-start gap-2.5">
                <span className="text-teal-600 dark:text-teal-400 font-extrabold shrink-0">Q{idx + 1}.</span>
                <span className="font-medium">{q}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Possible Conditions to Discuss */}
        <GlassCard level={2} className="space-y-4">
          <div className="flex items-center gap-2.5 text-cyan-700 dark:text-cyan-400">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                {t('assessment.possibleConditions')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Conditions for clinical discussion with your dentist
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            {(assessment.possibleConditionsToDiscuss || []).map((cond, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] space-y-1.5">
                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{cond.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{cond.description}</p>
                {cond.educationalNote && (
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold pt-0.5 flex items-center gap-1">
                    <span>💡</span>
                    <span>{cond.educationalNote}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Safe Home Comfort Tips */}
      <GlassCard level={2} className="space-y-4">
        <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
              {t('assessment.selfCareTips')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Evidence-based comfort and hygiene measures
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          {(assessment.preventiveSelfCareTips || []).map((tip, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl glass-subtle border border-emerald-500/20 text-slate-800 dark:text-slate-200 flex items-start gap-2.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
              <span className="font-medium">{tip}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Ask AI follow-up CTA Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-teal-500/20 border border-teal-400/30">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-black flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-teal-200" />
            <span>Have questions about this assessment report?</span>
          </h4>
          <p className="text-xs text-teal-100/90 max-w-xl leading-relaxed">
            Chat with DentiSense AI to explore treatment options, recovery timelines, and home care protocols for {assessment.primaryConcern}.
          </p>
        </div>
        <button
          onClick={() => onAskAI && onAskAI(assessment.primaryConcern)}
          className="px-5 py-3 rounded-2xl bg-white text-teal-800 hover:bg-teal-50 text-xs font-black shadow-md whitespace-nowrap transition-all interactive-scale shrink-0 flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-teal-600" />
          <span>Ask AI Assistant</span>
        </button>
      </div>
    </div>
  );
};
