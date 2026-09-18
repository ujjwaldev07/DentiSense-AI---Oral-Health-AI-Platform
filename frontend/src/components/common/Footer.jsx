import React from 'react';
import { ShieldAlert, ExternalLink, Sparkles, Heart } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export const Footer = ({ setActivePage }) => {
  const { t } = useLanguage();

  return (
    <footer className="relative z-10 border-t border-slate-200/80 dark:border-white/[0.07] bg-white/60 dark:bg-slate-950/60 py-12 transition-colors backdrop-blur-xl mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Medical Safety Notice Box */}
        <div className="p-5 rounded-2xl glass-elevated border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="font-extrabold text-amber-950 dark:text-amber-100">
              Crucial Clinical Safety Notice & Educational Scope:
            </p>
            <p className="text-xs text-amber-900/85 dark:text-amber-300/90 leading-relaxed">
              DentiSense AI is an intelligent oral health awareness and disease prediction platform designed to raise public dental awareness. It is not an automated doctor, diagnostic engine, or prescription tool. In case of acute dental trauma, severe bleeding, or facial swelling, please visit an emergency dental clinic immediately.
            </p>
          </div>
        </div>

        {/* Links and Organization Credits */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white text-base shadow-sm">
                🦷
              </div>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-base tracking-tight">
                DentiSense AI
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Empowering individuals with evidence-based oral health education, disease prediction assessment, and multilingual dental awareness powered by vector RAG.
            </p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider text-xs">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActivePage('chat')}
                  className="hover:text-teal-600 dark:hover:text-teal-300 font-medium transition-colors"
                >
                  AI Dental Consultation
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('assessment')}
                  className="hover:text-teal-600 dark:hover:text-teal-300 font-medium transition-colors"
                >
                  Symptom Risk Assessment
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('knowledge')}
                  className="hover:text-teal-600 dark:hover:text-teal-300 font-medium transition-colors"
                >
                  Oral Health Encyclopedia
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('analytics')}
                  className="hover:text-teal-600 dark:hover:text-teal-300 font-medium transition-colors"
                >
                  Personal Health Insights
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider text-xs">
              Clinical Guidelines Cited
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span>World Dental Federation (FDI)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span>American Dental Association (ADA)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span>Indian Dental Association (IDA)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span>WHO Global Oral Health Program</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider text-xs">
              Languages Supported
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2.5">
              Available with native voice recognition & speech synthesis:
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-lg glass-subtle text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08]">
                English
              </span>
              <span className="px-2.5 py-1 rounded-lg glass-subtle text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08]">
                हिंदी (Hindi)
              </span>
              <span className="px-2.5 py-1 rounded-lg glass-subtle text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08]">
                मराठी (Marathi)
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/80 dark:border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 DentiSense AI Platform • Smarter Insights. Better Oral Health.</p>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Evidence-based Dental Awareness & Vector RAG</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
