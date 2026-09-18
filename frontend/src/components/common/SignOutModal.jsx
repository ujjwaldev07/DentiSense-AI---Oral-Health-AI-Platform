import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export const SignOutModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoggingOut = false
}) => {
  const { t } = useLanguage();
  const confirmBtnRef = useRef(null);

  // Focus confirm button when modal opens, handle Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoggingOut) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, isLoggingOut, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto p-3 sm:p-6 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!isLoggingOut) onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-[min(420px,calc(100vw-24px))] max-h-[calc(100dvh-2rem)] overflow-y-auto glass-modal rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 animate-in zoom-in-95 duration-200 p-5 sm:p-7 relative box-border my-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
        aria-describedby="signout-modal-desc"
      >
        {/* Close Button (disabled while logging out) */}
        <button
          onClick={onClose}
          disabled={isLoggingOut}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Subtle Danger / Warning Icon Badge */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner shrink-0">
            <LogOut className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          {/* Heading and Explanation */}
          <div className="space-y-1.5 sm:space-y-2 max-w-sm px-1">
            <h3
              id="signout-modal-title"
              className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug break-words"
            >
              {t('nav.signOutConfirmTitle') || 'Sign out of DentiSense AI?'}
            </h3>
            <p
              id="signout-modal-desc"
              className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed break-words"
            >
              {t('nav.signOutConfirmDesc') || 'You will need to log in again to access your account.'}
            </p>
          </div>

          {/* Action Buttons: Responsive Stack on Mobile, Side-by-Side on sm+ */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 sm:gap-3 w-full pt-1 sm:pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoggingOut}
              className="w-full sm:flex-1 py-2.5 sm:py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              {t('nav.signOutCancel') || 'Cancel'}
            </button>
            <button
              ref={confirmBtnRef}
              type="button"
              onClick={onConfirm}
              disabled={isLoggingOut}
              className="w-full sm:flex-1 py-2.5 sm:py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-rose-500/25 transition-all disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2 text-center"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="truncate">{t('nav.signingOut') || 'Signing out...'}</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t('nav.signOutConfirm') || 'Sign Out'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal if DOM is available
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
