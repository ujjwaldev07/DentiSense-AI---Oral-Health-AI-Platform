import React from 'react';

export const Badge = ({
  children,
  variant = 'teal',
  dot = false,
  dotPulse = false,
  size = 'md',
  className = ''
}) => {
  const variants = {
    teal: 'bg-teal-500/10 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/25',
    cyan: 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
    emerald: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    amber: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
    rose: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25',
    purple: 'bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/25',
    slate: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  const dotColors = {
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500',
    slate: 'bg-slate-400'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-xs font-bold'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border backdrop-blur-xs transition-colors ${
        variants[variant] || variants.teal
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || 'bg-teal-500'} ${
            dotPulse ? 'status-dot-pulse' : ''
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
