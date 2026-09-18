import React from 'react';
import {
  Sparkles,
  MessageSquare,
  Activity,
  BookOpen,
  ShieldCheck,
  Globe,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Lock,
  ExternalLink,
  Zap,
  Users,
  Clock,
  HeartPulse
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { GlassCard } from '../components/common/GlassCard.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/forms/Button.jsx';

export const HomePage = ({ setActivePage }) => {
  const { t } = useLanguage();
  const { isAuthenticated, loginDemo } = useAuth();

  return (
    <div className="space-y-20 sm:space-y-28 py-8 sm:py-16 animate-in fade-in duration-300">
      {/* 1. Cinematic Clinical Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4 space-y-8">
        {/* Floating AI Status Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-elevated border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold shadow-md shadow-teal-500/10 animate-slide-up">
          <span className="w-2 h-2 rounded-full bg-teal-500 status-dot-pulse shrink-0" />
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>{t('home.heroBadge')}</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-[1.12] sm:leading-[1.12] font-display">
          {t('home.heroTitle')}{' '}
          <span className="bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-500 dark:from-teal-300 dark:via-cyan-300 dark:to-emerald-300 bg-clip-text text-transparent">
            DentiSense AI
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          {t('home.heroSubtitle')}
        </p>

        {/* Hero CTA Action Group */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <Button
            onClick={() => setActivePage('chat')}
            size="lg"
            variant="primary"
            icon={MessageSquare}
            className="shadow-xl shadow-teal-500/25 interactive-scale"
          >
            {t('home.startChatBtn')}
          </Button>

          <Button
            onClick={() => setActivePage('assessment')}
            size="lg"
            variant="outline"
            icon={Activity}
            className="interactive-scale"
          >
            {t('home.checkSymptomsBtn')}
          </Button>

          <Button
            onClick={() => setActivePage('knowledge')}
            size="lg"
            variant="secondary"
            icon={BookOpen}
            className="interactive-scale"
          >
            {t('home.exploreKnowledgeBtn')}
          </Button>
        </div>

        {/* Instant 1-Click Demo Login Switcher */}
        {!isAuthenticated && (
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">⚡ Instant Demo Access:</span>
            <button
              onClick={() => { loginDemo('user'); setActivePage('dashboard'); }}
              className="px-3 py-1 rounded-xl glass-subtle border border-teal-500/20 text-teal-700 dark:text-teal-300 font-bold hover:border-teal-500/50 transition-all shadow-xs interactive-scale"
            >
              Demo Patient Portal
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() => { loginDemo('admin'); setActivePage('admin'); }}
              className="px-3 py-1 rounded-xl glass-subtle border border-purple-500/20 text-purple-700 dark:text-purple-300 font-bold hover:border-purple-500/50 transition-all shadow-xs interactive-scale"
            >
              Demo Admin Console
            </button>
          </div>
        )}

        {/* 2. Interactive Live Consultation Visual Simulation Preview Card */}
        <div className="pt-6 max-w-2xl mx-auto text-left">
          <GlassCard level={2} className="border-teal-500/25 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white text-sm shadow-xs font-bold">
                  🦷
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">DentiSense Core 3.6</span>
                    <Badge variant="teal" dot dotPulse size="sm">Active RAG</Badge>
                  </div>
                  <span className="text-[10px] text-slate-400">Educational Consultation Preview</span>
                </div>
              </div>
              <Badge variant="cyan" size="sm">98.4% Relevance</Badge>
            </div>

            {/* Simulated Messages */}
            <div className="space-y-3 text-xs sm:text-xs">
              <div className="p-3 rounded-2xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-slate-800 dark:text-slate-200 ml-auto max-w-[85%] font-medium">
                Why do my gums bleed whenever I brush in the morning?
              </div>

              <div className="p-3.5 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-slate-100 max-w-[92%] space-y-2">
                <p className="leading-relaxed">
                  Morning gum bleeding is commonly an early sign of <strong>Gingivitis</strong>—a reversible inflammation caused by plaque biofilm accumulating at the gumline.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Cited Source: European Federation of Periodontology (EFP)
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* 3. Clinical Trust & Key Metrics Strip */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard level={1} className="text-center p-4 sm:p-5 space-y-1">
            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-300 dark:to-cyan-300 bg-clip-text text-transparent font-display">
              100%
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Safety Guardrails</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Non-diagnostic ethical bounds</p>
          </GlassCard>

          <GlassCard level={1} className="text-center p-4 sm:p-5 space-y-1">
            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-300 dark:to-cyan-300 bg-clip-text text-transparent font-display">
              10+
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Dental Specialties</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">From caries to oral oncology</p>
          </GlassCard>

          <GlassCard level={1} className="text-center p-4 sm:p-5 space-y-1">
            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-300 dark:to-cyan-300 bg-clip-text text-transparent font-display">
              3
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Languages Supported</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">English, हिंदी & मराठी</p>
          </GlassCard>

          <GlassCard level={1} className="text-center p-4 sm:p-5 space-y-1">
            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-300 dark:to-cyan-300 bg-clip-text text-transparent font-display">
              &lt; 500ms
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Vector Retrieval</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Real-time dental citations</p>
          </GlassCard>
        </div>
      </section>

      {/* 4. Core Feature Pillars Grid */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="cyan">Engineered for Public Oral Health</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            Complete Dental AI Awareness Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Comprehensive tools designed to educate, screen emergency red flags, and guide clinical visits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <GlassCard
            level={3}
            onClick={() => setActivePage('chat')}
            className="space-y-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-500/20 transition-all border border-teal-500/20 shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-between font-display">
                <span>{t('home.feature1Title')}</span>
                <ArrowRight className="w-4 h-4 text-teal-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {t('home.feature1Desc')}
              </p>
            </div>
          </GlassCard>

          <GlassCard
            level={3}
            onClick={() => setActivePage('assessment')}
            className="space-y-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all border border-cyan-500/20 shadow-xs">
              <Activity className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-between font-display">
                <span>{t('home.feature2Title')}</span>
                <ArrowRight className="w-4 h-4 text-cyan-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {t('home.feature2Desc')}
              </p>
            </div>
          </GlassCard>

          <GlassCard
            level={3}
            onClick={() => setActivePage('knowledge')}
            className="space-y-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/20 transition-all border border-amber-500/20 shadow-xs">
              <Globe className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-between font-display">
                <span>{t('home.feature3Title')}</span>
                <ArrowRight className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {t('home.feature3Desc')}
              </p>
            </div>
          </GlassCard>

          <GlassCard
            level={3}
            onClick={() => setActivePage('analytics')}
            className="space-y-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all border border-emerald-500/20 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-between font-display">
                <span>{t('home.feature4Title')}</span>
                <ArrowRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {t('home.feature4Desc')}
              </p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* 5. Clinical Safety Guardrails Showcase */}
      <section className="max-w-5xl mx-auto px-4">
        <GlassCard level={2} className="border-slate-300 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                Clinical Safety Architecture & Guardrails
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Engineered from the ground up for strict ethical, non-diagnostic educational awareness.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl glass-subtle border border-rose-500/20 space-y-2">
              <span className="text-rose-500 dark:text-rose-400 font-extrabold uppercase tracking-wider text-[10px]">
                Guardrail 01
              </span>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                Prescription Blockers
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatically detects and refuses requests to prescribe antibiotics or painkiller dosages, directing users to clinical dental professionals.
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-subtle border border-amber-500/20 space-y-2">
              <span className="text-amber-500 dark:text-amber-400 font-extrabold uppercase tracking-wider text-[10px]">
                Guardrail 02
              </span>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                Red-Flag Triage
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Immediately flags high-priority emergencies (non-healing ulcers &gt; 14 days, acute facial swelling, dental trauma) with urgent consultation alerts.
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-subtle border border-teal-500/20 space-y-2">
              <span className="text-teal-500 dark:text-teal-400 font-extrabold uppercase tracking-wider text-[10px]">
                Guardrail 03
              </span>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                Evidence-Based RAG
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Grounds educational responses in peer-reviewed clinical guidelines from the ADA, IDA, FDI, and the WHO with verifiable citations.
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};
