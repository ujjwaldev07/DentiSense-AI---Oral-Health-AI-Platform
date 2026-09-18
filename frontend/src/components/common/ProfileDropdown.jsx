import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export const ProfileDropdown = ({
  user,
  isAdmin,
  isOpen,
  onClose,
  onNavigate,
  onSignOutClick,
  triggerRef
}) => {
  const { t } = useLanguage();
  const menuRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Viewport-aware positioning relative to trigger
  const updatePosition = useCallback(() => {
    if (!triggerRef?.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownWidth = Math.min(320, viewportWidth - 24);

    // Calculate alignment to right edge of trigger button
    let rightOffset = viewportWidth - rect.right;

    // Viewport collision clamping: ensure at least 12px from right and 12px from left
    rightOffset = Math.max(12, Math.min(viewportWidth - 12 - dropdownWidth, rightOffset));

    setDropdownStyle({
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      right: `${rightOffset}px`,
      width: `${dropdownWidth}px`,
      maxWidth: 'calc(100vw - 24px)',
      zIndex: 90
    });
  }, [triggerRef]);

  // Update position on open, window resize, and scroll
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleResize = () => {
      updatePosition();
    };

    const handleScroll = (e) => {
      // Close dropdown if page is scrolled outside the dropdown
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, updatePosition, triggerRef]);

  if (!isOpen) return null;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const roleLabel = isAdmin ? 'Administrator' : 'Verified Member';

  const dropdownJSX = (
    <div
      ref={menuRef}
      style={triggerRef?.current ? dropdownStyle : {}}
      className={`rounded-3xl shadow-2xl glass-modal border border-slate-200/90 dark:border-white/10 p-2.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl box-border ${
        triggerRef?.current
          ? ''
          : 'absolute right-0 top-full mt-2.5 w-[min(20rem,calc(100vw-24px))] max-w-[calc(100vw-24px)] z-50'
      }`}
      role="menu"
      aria-orientation="vertical"
      aria-label="User Account Menu"
    >
      {/* 1. Profile Header with Avatar, Name, Email, Role */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-b from-teal-500/10 to-transparent dark:from-teal-500/15 border border-teal-500/15 dark:border-teal-500/20 mb-1.5 box-border">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md shrink-0 border border-white/20 mt-0.5 ${
              isAdmin
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20'
                : 'bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 shadow-teal-500/20'
            }`}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 break-words line-clamp-2 leading-snug"
              title={user?.name || 'User'}
            >
              {user?.name || 'User'}
            </h4>
            <p
              className="text-[11px] text-slate-500 dark:text-slate-400 break-all mt-0.5 font-normal leading-tight"
              title={user?.email}
            >
              {user?.email}
            </p>
            <div className="mt-2 flex items-center">
              <span
                className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                  isAdmin
                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                    : 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30'
                }`}
              >
                {isAdmin && <ShieldCheck className="w-2.5 h-2.5 shrink-0" />}
                <span>{roleLabel}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200/80 dark:bg-white/[0.07] my-1 mx-1" />

      {/* 2. Navigation Actions */}
      <div className="space-y-0.5 py-1">
        {/* My Profile */}
        <button
          type="button"
          onClick={() => {
            onNavigate('profile');
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-teal-600 dark:hover:text-teal-300 transition-colors group text-left"
          role="menuitem"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">{t('nav.profile') || 'My Profile'}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* Admin Portal (Admin Only) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              onNavigate('admin');
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-500/10 dark:hover:bg-purple-500/15 hover:text-purple-600 dark:hover:text-purple-300 transition-colors group text-left"
            role="menuitem"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{t('nav.admin') || 'Admin Portal'}</span>
            </div>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-600 text-white font-extrabold tracking-wider shrink-0">
              Portal
            </span>
          </button>
        )}

        {/* Health Dashboard / Account Settings */}
        <button
          type="button"
          onClick={() => {
            onNavigate('dashboard');
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-teal-600 dark:hover:text-teal-300 transition-colors group text-left"
          role="menuitem"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors shrink-0">
              <LayoutDashboard className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">{t('nav.accountSettings') || 'Account Settings'}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>

      <div className="h-px bg-slate-200/80 dark:bg-white/[0.07] my-1 mx-1" />

      {/* 3. Sign Out Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof onSignOutClick === 'function') {
              onSignOutClick();
            }
            if (typeof onClose === 'function') {
              onClose();
            }
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 border border-transparent hover:border-rose-500/20 transition-all group text-left"
          role="menuitem"
        >
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform shrink-0">
            <LogOut className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">{t('nav.signOutConfirm') || 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );

  // Mount to body via portal if triggerRef is used and DOM is available
  if (triggerRef?.current && typeof document !== 'undefined') {
    return createPortal(dropdownJSX, document.body);
  }

  return dropdownJSX;
};
