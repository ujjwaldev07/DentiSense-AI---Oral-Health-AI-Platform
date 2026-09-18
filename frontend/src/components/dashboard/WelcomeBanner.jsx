import React from 'react';
import { Sparkles, MessageSquare, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import { Button } from '../forms/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export const WelcomeBanner = ({ onStartChat, onStartAssessment }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const langLabels = {
    en: 'English',
    hi: 'हिंदी (Hindi)',
    mr: 'मराठी (Marathi)'
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950/80 via-slate-900/90 to-cyan-950/80 text-white p-6 sm:p-8 border border-teal-500/30 shadow-xl backdrop-blur-xl">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-extrabold backdrop-blur-xs border border-teal-400/30 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Evidence-Based Dental Health Hub</span>
          <span className="opacity-60">•</span>
          <span>{langLabels[language] || 'English'}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
          Welcome back, <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">{user?.name || 'Friend'}</span>!
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl font-normal">
          Explore evidence-based oral health answers, evaluate symptoms with guided triage, and monitor your personal dental awareness progress.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            size="md"
            icon={MessageSquare}
            onClick={onStartChat}
            variant="primary"
            className="shadow-lg shadow-teal-500/25"
          >
            Start Dental AI Consultation
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={Activity}
            onClick={onStartAssessment}
          >
            Check Symptoms
          </Button>
        </div>
      </div>
    </div>
  );
};
