import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  Activity,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ProfileDropdown } from './ProfileDropdown.jsx';
import { SignOutModal } from './SignOutModal.jsx';

export const Navbar = ({ activePage, setActivePage }) => {
  const { language, changeLanguage, t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const toast = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileProfileDropdownOpen, setIsMobileProfileDropdownOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const langDropdownRef = useRef(null);
  const moreMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const mobileProfileRef = useRef(null);

  // Close non-portaled dropdowns on outside click
  // (ProfileDropdown manages its own outside click lifecycle via triggerRef and portal-aware menuRef)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsLangDropdownOpen(false);
        setIsMoreMenuOpen(false);
        setIsProfileDropdownOpen(false);
        setIsMobileProfileDropdownOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Primary navigation items (always directly visible on lg+ screens)
  const primaryNavItems = [
    { id: 'home', label: t('nav.home'), icon: Sparkles },
    { id: 'chat', label: t('nav.chat'), icon: MessageSquare },
    { id: 'assessment', label: t('nav.assessment'), icon: Activity },
    { id: 'knowledge', label: t('nav.knowledge'), icon: BookOpen }
  ];

  // Secondary navigation items (in "More" dropdown on 1024px-1279px, full on xl+)
  const secondaryNavItems = [
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
    ...(isAdmin ? [{ id: 'admin', label: t('nav.admin'), icon: ShieldCheck, badge: 'Admin' }] : [])
  ];

  // Combined for mobile & wide desktop
  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const handleSignOut = async () => {
    if (isLoggingOut) return; // Prevent duplicate requests
    setIsLoggingOut(true);
    try {
      await logout();
      toast.info(t('nav.signOutConfirmDesc') || 'Your session has ended. Please sign in again.');
      setActivePage('login');
    } catch (err) {
      console.error('Logout error:', err?.message || err);
      toast.warning('Session cleared locally. Server was unavailable.');
      setActivePage('login');
    } finally {
      setIsLoggingOut(false);
      setIsSignOutModalOpen(false);
      setIsMobileMenuOpen(false);
      setIsProfileDropdownOpen(false);
      setIsMobileProfileDropdownOpen(false);
    }
  };

  const handleSignOutConfirm = handleSignOut;

  const isSecondaryActive = secondaryNavItems.some((item) => item.id === activePage);

  return (
    <header className="sticky top-0 z-40 w-full glass-elevated border-b border-slate-200/80 dark:border-white/[0.07] transition-colors duration-200 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.25rem] gap-2 lg:gap-3 xl:gap-4 min-w-0">
          {/* 1. Logo & Brand Identity (Zero-clipping, shrink-safe container) */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 cursor-pointer select-none group shrink-0 min-w-0"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNavClick('home'); }}
            aria-label="DentiSense AI Home"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/25 group-hover:scale-105 group-hover:shadow-teal-500/40 transition-all duration-200 border border-teal-400/30 shrink-0">
              <span className="text-base sm:text-lg lg:text-xl font-bold">🦷</span>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 status-dot-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-black tracking-tight bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 dark:from-teal-200 dark:via-cyan-200 dark:to-teal-300 bg-clip-text text-transparent font-display truncate">
                  DentiSense AI
                </span>
                <span className="hidden xs:inline-flex text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/25 shrink-0">
                  Clinical AI
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden 2xl:block tracking-wide truncate">
                AI Oral Health & Disease Prediction Platform
              </p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden md:block 2xl:hidden tracking-wide truncate">
                Oral Health AI Platform
              </p>
            </div>
          </div>

          {/* 2. Desktop Navigation Links (Responsive: Full on xl+, Collapsed "More" on lg) */}
          <nav
            className="hidden lg:flex items-center p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/[0.07] backdrop-blur-md shadow-inner shrink-0 min-w-0"
            aria-label="Desktop Navigation"
          >
            {/* Primary Nav Items */}
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200/80 dark:border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Secondary Nav Items: Directly visible on xl (>=1280px) */}
            <div className="hidden xl:flex items-center">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200/80 dark:border-teal-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] uppercase px-1 py-0.2 bg-teal-600 text-white rounded font-extrabold tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* "More" dropdown for medium screens (1024px to 1279px / lg only) */}
            <div className="relative xl:hidden" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                  isSecondaryActive || isMoreMenuOpen
                    ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200/80 dark:border-teal-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40'
                }`}
                aria-expanded={isMoreMenuOpen}
                aria-haspopup="true"
                title="More navigation options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                <span>More</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl glass-modal border border-slate-200 dark:border-white/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                          isActive
                            ? 'text-teal-600 dark:text-teal-300 bg-teal-500/10'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 bg-teal-600 text-white rounded font-extrabold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* 3. Right Action Cluster: Language, Theme, Auth (Always fits without clipping) */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0">
            {/* Language Selector */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1 px-2 xl:px-2.5 py-1.5 rounded-xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-teal-500/40 transition-all shadow-xs"
                title="Change language"
                aria-expanded={isLangDropdownOpen}
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="uppercase tracking-wider text-[11px]">{language}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl shadow-2xl glass-modal border border-slate-200 dark:border-white/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => { changeLanguage('en'); setIsLangDropdownOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                      language === 'en' ? 'text-teal-600 dark:text-teal-300 bg-teal-500/10' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span>English</span>
                    {language === 'en' && <span className="text-teal-500 text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => { changeLanguage('hi'); setIsLangDropdownOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                      language === 'hi' ? 'text-teal-600 dark:text-teal-300 bg-teal-500/10' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span>हिंदी (Hindi)</span>
                    {language === 'hi' && <span className="text-teal-500 text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => { changeLanguage('mr'); setIsLangDropdownOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                      language === 'mr' ? 'text-teal-600 dark:text-teal-300 bg-teal-500/10' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span>मराठी (Marathi)</span>
                    {language === 'mr' && <span className="text-teal-500 text-xs">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 xl:p-2 rounded-xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-teal-500/40 transition-all shadow-xs interactive-scale shrink-0"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark/light theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-0.5 shrink-0" />

            {/* User Profile / Auth Actions */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                {/* Global Profile Dropdown Trigger */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                    className={`flex items-center gap-2 px-2.5 xl:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all select-none ${
                      isProfileDropdownOpen
                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-800 dark:text-teal-200 shadow-sm'
                        : 'bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20'
                    }`}
                    aria-expanded={isProfileDropdownOpen}
                    aria-haspopup="true"
                    aria-label="User account and profile menu"
                    title="Account options"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-black shrink-0 ${
                        isAdmin
                          ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                          : 'bg-gradient-to-tr from-teal-600 to-cyan-500'
                      }`}
                    >
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="max-w-[85px] xl:max-w-[125px] truncate">
                      {user?.name || 'User'}
                    </span>
                    {isAdmin && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 bg-teal-600 text-white rounded-md font-extrabold tracking-wider">
                        Admin
                      </span>
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isProfileDropdownOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
                      }`}
                    />
                  </button>

                  <ProfileDropdown
                    user={user}
                    isAdmin={isAdmin}
                    isOpen={isProfileDropdownOpen}
                    onClose={() => setIsProfileDropdownOpen(false)}
                    onNavigate={handleNavClick}
                    onSignOutClick={handleSignOut}
                    triggerRef={profileDropdownRef}
                  />
                </div>

                {/* Quick Dashboard Shortcut */}
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="p-1.5 xl:p-2 rounded-xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-300 transition-all interactive-scale"
                  title="Health Dashboard"
                  aria-label="Go to Health Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                <button
                  onClick={() => handleNavClick('login')}
                  className="px-2.5 xl:px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => handleNavClick('signup')}
                  className="px-3 xl:px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-md shadow-teal-500/25 transition-all interactive-scale whitespace-nowrap shrink-0"
                >
                  {t('nav.signup')}
                </button>
              </div>
            )}
          </div>

          {/* 4. Mobile / Tablet Header Controls (Visible < lg) */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Sign In / Create Account on tablet if room */}
            {!isAuthenticated && (
              <div className="hidden sm:flex items-center gap-1.5 mr-1">
                <button
                  onClick={() => handleNavClick('login')}
                  className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-teal-600"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => handleNavClick('signup')}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-bold shadow-xs whitespace-nowrap"
                >
                  {t('nav.signup')}
                </button>
              </div>
            )}

            {/* Mobile / Tablet Authenticated User Profile Trigger */}
            {isAuthenticated && (
              <div className="relative" ref={mobileProfileRef}>
                <button
                  type="button"
                  onClick={() => setIsMobileProfileDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 select-none ${
                    isMobileProfileDropdownOpen
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-800 dark:text-teal-200'
                      : 'bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/20 text-teal-700 dark:text-teal-300'
                  }`}
                  aria-expanded={isMobileProfileDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User profile menu"
                  title="Account options"
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-black shrink-0 ${
                      isAdmin
                        ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                        : 'bg-gradient-to-tr from-teal-600 to-cyan-500'
                    }`}
                  >
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[70px] truncate">{user?.name?.split(' ')[0] || 'User'}</span>
                  <ChevronDown
                    className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                      isMobileProfileDropdownOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
                    }`}
                  />
                </button>

                <ProfileDropdown
                  user={user}
                  isAdmin={isAdmin}
                  isOpen={isMobileProfileDropdownOpen}
                  onClose={() => setIsMobileProfileDropdownOpen(false)}
                  onNavigate={handleNavClick}
                  onSignOutClick={handleSignOut}
                  triggerRef={mobileProfileRef}
                />
              </div>
            )}

            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shrink-0"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:border-teal-500/40 shrink-0"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Mobile Drawer Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 top-16 sm:top-[4.25rem] bg-slate-950/60 backdrop-blur-sm z-30 animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 6. Responsive Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden relative z-40 border-t border-slate-200 dark:border-white/[0.08] glass-modal px-4 pt-4 pb-6 space-y-4 max-h-[calc(100dvh-4.5rem)] overflow-y-auto animate-in slide-in-from-top-3 duration-200 shadow-2xl"
        >
          {/* User Account Bar in Mobile Drawer */}
          {isAuthenticated ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.name || 'User'}
                    </span>
                    {isAdmin && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 bg-teal-600 text-white rounded-md font-extrabold shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">{user?.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:text-teal-600"
                  title="Profile"
                  aria-label="User Profile"
                >
                  <User className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:text-teal-600"
                  title="Dashboard"
                  aria-label="Health Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-1">
              <button
                onClick={() => handleNavClick('login')}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-center transition-colors"
              >
                {t('nav.login')}
              </button>
              <button
                onClick={() => handleNavClick('signup')}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-md shadow-teal-500/25 text-center transition-all"
              >
                {t('nav.signup')}
              </button>
            </div>
          )}

          {/* Navigation Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold text-left transition-all ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-teal-600 text-white rounded font-extrabold shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Language & Actions Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Language:</span>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                  language === 'en'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                  language === 'hi'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => changeLanguage('mr')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                  language === 'mr'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                मराठी
              </button>
            </div>

            {isAuthenticated && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-1.5 text-xs text-rose-500 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('nav.logout')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global Sign Out Confirmation Dialog */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => {
          if (!isLoggingOut) setIsSignOutModalOpen(false);
        }}
        onConfirm={handleSignOutConfirm}
        isLoggingOut={isLoggingOut}
      />
    </header>
  );
};
