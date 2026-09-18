import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export const DisclaimerBanner = () => {
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <aside
      aria-label="Medical Disclaimer"
      className="relative z-50 bg-amber-500/10 dark:bg-amber-500/[0.12] border-b border-amber-500/25 text-amber-900 dark:text-amber-200 px-4 py-2 transition-all backdrop-blur-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="leading-tight truncate sm:whitespace-normal">
            <strong className="font-bold">{t('disclaimer.bannerTitle')}:</strong>{' '}
            <span className="text-amber-800 dark:text-amber-300/90">{t('disclaimer.bannerText')}</span>
          </p>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-amber-700 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-100 p-1 rounded-lg hover:bg-amber-500/15 transition-colors shrink-0"
          title="Dismiss banner"
          aria-label="Dismiss disclaimer banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
