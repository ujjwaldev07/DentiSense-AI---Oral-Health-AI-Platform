import React, { useEffect, useState, Suspense, lazy } from 'react';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { DisclaimerBanner } from './components/common/DisclaimerBanner.jsx';
import { BackgroundGlow } from './components/common/BackgroundGlow.jsx';
import { Navbar } from './components/common/Navbar.jsx';
import { Footer } from './components/common/Footer.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

// Core Landing Page (eagerly loaded for fast first contentful paint)
import { HomePage } from './pages/HomePage.jsx';

// Heavy / Secondary Pages (Lazy loaded for optimal code-splitting and performance)
const ChatPage = lazy(() => import('./pages/ChatPage.jsx').then((m) => ({ default: m.ChatPage })));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage.jsx').then((m) => ({ default: m.AssessmentPage })));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage.jsx').then((m) => ({ default: m.KnowledgeBasePage })));
const PersonalAnalyticsPage = lazy(() => import('./pages/PersonalAnalyticsPage.jsx').then((m) => ({ default: m.PersonalAnalyticsPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.jsx').then((m) => ({ default: m.AdminDashboardPage })));
const UserDashboard = lazy(() => import('./pages/UserDashboard.jsx').then((m) => ({ default: m.UserDashboard })));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx').then((m) => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx').then((m) => ({ default: m.ForgotPasswordPage })));

const PageFallback = () => (
  <div className="py-24 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-150">
    <div className="relative w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
      <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      <span className="absolute text-sm">🦷</span>
    </div>
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
      Loading clinical workspace...
    </p>
  </div>
);

export function AppContent() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activePage, setActivePage] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash) return hash;
    }
    return 'home';
  });
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [initialPrompt, setInitialPrompt] = useState('');

  // Handle browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      const targetPage = event.state?.page || window.location.hash.replace('#', '') || 'home';
      setActivePage(targetPage);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update activePage and sync browser history
  const navigateToPage = (page) => {
    setActivePage(page);
    if (typeof window !== 'undefined') {
      window.history.pushState({ page }, '', `#${page}`);
    }
  };

  // Enforce auth guards on client-side navigation & clear transient session state on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedChatId(null);
      setSelectedAssessmentId(null);
      if (activePage === 'profile' || activePage === 'dashboard' || activePage === 'admin') {
        setActivePage('login');
        if (typeof window !== 'undefined') {
          window.history.replaceState({ page: 'login' }, '', '#login');
        }
      }
    } else if (!isAdmin && activePage === 'admin') {
      setActivePage('dashboard');
      if (typeof window !== 'undefined') {
        window.history.replaceState({ page: 'dashboard' }, '', '#dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, activePage]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
      {/* Lightweight Ambient Background Animation */}
      <BackgroundGlow />

      {/* Top Medical Disclaimer Sticky Notice */}
      <DisclaimerBanner />

      {/* Main Navigation Header */}
      <Navbar activePage={activePage} setActivePage={navigateToPage} />

      {/* Dynamic Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Suspense fallback={<PageFallback />}>
          {activePage === 'home' && (
            <HomePage setActivePage={navigateToPage} />
          )}

          {activePage === 'chat' && (
            <ChatPage
              initialChatId={selectedChatId}
              initialPrompt={initialPrompt}
            />
          )}

          {activePage === 'assessment' && (
            <AssessmentPage
              initialAssessmentId={selectedAssessmentId}
              setActivePage={navigateToPage}
              setInitialPrompt={setInitialPrompt}
            />
          )}

          {activePage === 'knowledge' && (
            <KnowledgeBasePage />
          )}

          {activePage === 'analytics' && (
            <PersonalAnalyticsPage />
          )}

          {activePage === 'admin' && (
            <AdminDashboardPage />
          )}

          {activePage === 'dashboard' && (
            isAuthenticated ? (
              <UserDashboard
                setActivePage={navigateToPage}
                setSelectedChatId={setSelectedChatId}
                setSelectedAssessmentId={setSelectedAssessmentId}
              />
            ) : (
              <LoginPage setActivePage={navigateToPage} />
            )
          )}

          {activePage === 'profile' && (
            isAuthenticated ? (
              <ProfilePage />
            ) : (
              <LoginPage setActivePage={navigateToPage} />
            )
          )}

          {activePage === 'login' && (
            <LoginPage setActivePage={navigateToPage} />
          )}

          {activePage === 'signup' && (
            <RegisterPage setActivePage={navigateToPage} />
          )}

          {activePage === 'forgot-password' && (
            <ForgotPasswordPage setActivePage={navigateToPage} />
          )}
        </Suspense>
      </main>

      {/* Footer */}
      <Footer setActivePage={navigateToPage} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
