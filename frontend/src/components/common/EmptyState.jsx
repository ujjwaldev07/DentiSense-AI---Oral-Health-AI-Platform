import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../forms/Button.jsx';

export const EmptyState = ({
  icon: Icon = Sparkles,
  title = 'No records found',
  description = 'There is currently no information available in this section.',
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`p-8 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 ${className}`}>
      <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
