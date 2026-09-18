import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export const SuggestedPrompts = ({ onSelectPrompt }) => {
  const { t } = useLanguage();

  const prompts = [
    t('chat.prompt1'),
    t('chat.prompt2'),
    t('chat.prompt3'),
    t('chat.prompt4')
  ];

  return (
    <div className="my-4 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 dark:text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span className="uppercase tracking-wider text-[11px]">{t('chat.suggestedTitle')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(prompt)}
            className="text-left p-3.5 rounded-2xl glass-interactive border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-700 dark:text-slate-200 hover:border-teal-500/50 hover:bg-teal-500/5 group flex items-center justify-between gap-2 shadow-xs"
          >
            <span className="line-clamp-2 font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
              💡 {prompt}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-500 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
};
