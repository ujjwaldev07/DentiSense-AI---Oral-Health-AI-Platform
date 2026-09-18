import React from 'react';
import { BookOpen } from 'lucide-react';

export const TopicFrequencyChart = ({ data = [] }) => {
  const palette = [
    { bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', lightBg: 'bg-teal-500/15' },
    { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', lightBg: 'bg-cyan-500/15' },
    { bg: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', lightBg: 'bg-sky-500/15' },
    { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', lightBg: 'bg-indigo-500/15' },
    { bg: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', lightBg: 'bg-violet-500/15' },
    { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', lightBg: 'bg-amber-500/15' }
  ];

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-400 dark:text-slate-500 gap-2">
        <BookOpen className="w-6 h-6 stroke-1 text-slate-300 dark:text-slate-600" />
        <span>No topic exploration data recorded yet.</span>
      </div>
    );
  }

  // Sort descending by count
  const sorted = [...data].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 6);
  const maxCount = Math.max(...sorted.map(s => s.count || 1), 1);

  return (
    <div className="space-y-3.5 py-1">
      {sorted.map((item, idx) => {
        const theme = palette[idx % palette.length];
        const pct = Math.round(((item.count || 0) / maxCount) * 100);

        return (
          <div key={item.topic || idx} className="space-y-1.5 group">
            <div className="flex items-center justify-between text-xs gap-3">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {item.topic}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${theme.lightBg} ${theme.text}`}>
                  {item.count} {item.count === 1 ? 'activity' : 'activities'}
                </span>
              </div>
            </div>

            <div className="w-full h-2.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full ${theme.bg} transition-all duration-500 ease-out`}
                style={{ width: `${Math.max(pct, 6)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
