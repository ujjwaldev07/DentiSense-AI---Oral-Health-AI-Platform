import React from 'react';
import { BookOpen, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { GlassCard } from '../common/GlassCard.jsx';
import { Badge } from '../common/Badge.jsx';

export const SourceDrawer = ({ isOpen, onClose, sources = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 glass-modal border-l border-slate-200/90 dark:border-white/10 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Cited Clinical Literature
              </h3>
              <p className="text-[10px] text-slate-400">Verified Evidence ({sources.length})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close cited literature drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The AI assistant extracted facts from these indexed peer-reviewed guidelines to formulate your educational response:
        </p>

        <div className="space-y-3">
          {sources.map((src, idx) => (
            <GlassCard
              key={idx}
              level={1}
              className="p-4 space-y-2 text-xs border border-slate-200/80 dark:border-white/[0.08]"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="teal" size="sm">
                  {src.category || 'Clinical Guidance'}
                </Badge>
                {src.relevanceScore && (
                  <span className="text-[10px] font-bold text-slate-400">
                    Match: {Math.round(src.relevanceScore * 100)}%
                  </span>
                )}
              </div>

              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-xs leading-snug">
                {src.title}
              </h4>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Source: <span className="font-semibold text-slate-700 dark:text-slate-300">{src.organization || 'World Dental Guidelines'}</span>
              </p>

              {src.sourceUrl && (
                <a
                  href={src.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline pt-1"
                >
                  <span>View Official Guideline</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </GlassCard>
          ))}
        </div>
      </div>

      <div className="pt-5 border-t border-slate-200/80 dark:border-white/[0.08]">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl glass-subtle text-slate-700 dark:text-slate-200 text-xs font-bold hover:border-teal-500/40 transition-all"
        >
          Close Literature Drawer
        </button>
      </div>
    </div>
  );
};
