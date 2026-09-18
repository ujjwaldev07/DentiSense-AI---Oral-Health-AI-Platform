import React from 'react';

export const SkeletonLoader = ({
  variant = 'card',
  count = 1,
  className = ''
}) => {
  const renderSkeleton = (key) => {
    if (variant === 'text') {
      return (
        <div key={key} className={`space-y-2.5 ${className}`}>
          <div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded-md w-full animate-shimmer" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded-md w-4/5 animate-shimmer" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded-md w-2/3 animate-shimmer" />
        </div>
      );
    }

    if (variant === 'avatar') {
      return (
        <div
          key={key}
          className={`w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800/80 shrink-0 animate-shimmer ${className}`}
        />
      );
    }

    if (variant === 'chat') {
      return (
        <div key={key} className={`flex gap-3 items-start ${className}`}>
          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800/80 shrink-0 animate-shimmer" />
          <div className="space-y-2 flex-1 max-w-md">
            <div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded-lg w-full animate-shimmer" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded-lg w-3/4 animate-shimmer" />
          </div>
        </div>
      );
    }

    // Default card skeleton
    return (
      <div
        key={key}
        className={`p-5 rounded-2xl glass-elevated border border-slate-200/50 dark:border-slate-800/50 space-y-3.5 animate-shimmer ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded-md w-1/3" />
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800/80" />
        </div>
        <div className="h-7 bg-slate-200 dark:bg-slate-800/80 rounded-lg w-1/2" />
        <div className="h-3.5 bg-slate-200 dark:bg-slate-800/80 rounded-md w-2/3" />
      </div>
    );
  };

  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
    </div>
  );
};
