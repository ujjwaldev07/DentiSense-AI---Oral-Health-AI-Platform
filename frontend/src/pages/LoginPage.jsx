import React, { useState } from 'react';
import {
  LogIn,
  Sparkles,
  Shield,
  User,
  ArrowRight,
  Stethoscope,
  BookOpen,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { GlassCard } from '../components/common/GlassCard.jsx';
import { Button } from '../components/forms/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { PasswordField } from '../components/forms/PasswordField.jsx';

export const LoginPage = ({ setActivePage }) => {
  const { login, loginDemo, isLoading, error } = useAuth();
  const { t } = useLanguage();
  const [roleSelection, setRoleSelection] = useState('user'); // 'user' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      setActivePage(roleSelection === 'admin' ? 'admin' : 'dashboard');
    } catch {
      // Error handled by AuthContext
    }
  };

  const handleDemoLogin = async (role) => {
    try {
      await loginDemo(role);
      setActivePage(role === 'admin' ? 'admin' : 'dashboard');
    } catch {
      // Error handled
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-14 px-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Clinical SaaS Value Proposition (Desktop) */}
        <div className="lg:col-span-5 space-y-6 hidden lg:block">
          <div className="space-y-3">
            <Badge variant="teal" size="md">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Next-Gen Dental Intelligence</span>
            </Badge>
            <h1 className="text-3xl xl:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-display leading-tight">
              Evidence-based dental care guidance at your fingertips.
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              DentiSense AI empowers patients and dental clinicians with real-time symptom triage, verified clinical knowledge, and intelligent disease prediction.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">AI Clinical Triage</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Interactive multi-turn assessments with red-flag detection and urgency indicators.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">768-Dim Vector Knowledge Base</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Peer-reviewed dental literature indexed into high-precision semantic vectors.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Multilingual & Private</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Full clinical support in English, Hindi, and Marathi with secure role-based controls.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="lg:col-span-7 max-w-md mx-auto w-full space-y-5">
          <div className="text-center lg:text-left space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center text-xl shadow-lg shadow-teal-500/25 border border-teal-400/30 lg:hidden mx-auto mb-3">
              🦷
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-display">
              Sign In to DentiSense AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
              Enter your credentials or choose an instant role demo login below.
            </p>
          </div>

          <GlassCard level={2} className="p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200/90 dark:border-white/[0.08]">
            {/* Role Segmented Switcher */}
            <div className="p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/[0.07] grid grid-cols-2 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRoleSelection('user')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                  roleSelection === 'user'
                    ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/80 dark:border-teal-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient / User</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleSelection('admin')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                  roleSelection === 'admin'
                    ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/80 dark:border-teal-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Clinical Admin</span>
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-200">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={roleSelection === 'admin' ? 'admin@dentisense.ai' : 'patient@example.com'}
                    className="w-full py-2.5 pl-10 pr-4 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePage('forgot-password')}
                    className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <PasswordField
                  label=""
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                isLoading={isLoading}
                variant="primary"
                size="md"
                icon={LogIn}
                className="w-full py-3 shadow-md shadow-teal-500/20 font-bold"
              >
                <span>{isLoading ? 'Signing in...' : `Sign In as ${roleSelection === 'admin' ? 'Clinical Admin' : 'User'}`}</span>
              </Button>
            </form>

            <div className="relative py-2 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80 dark:border-white/[0.08]" />
              </div>
              <span className="relative px-3 glass-subtle rounded-full text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">
                1-Click Instant Demo Login
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('user')}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Demo User</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Demo Admin</span>
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setActivePage('signup')}
                className="text-teal-600 dark:text-teal-400 font-extrabold hover:underline cursor-pointer"
              >
                Register here
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
