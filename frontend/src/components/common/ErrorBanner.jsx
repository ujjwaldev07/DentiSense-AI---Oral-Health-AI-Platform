import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../forms/Button.jsx';

export const ErrorBanner = ({ message, onRetry, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300 ${className}`}>
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
        <span className="font-medium">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 hover:underline shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
};
