import React, { useState } from 'react';
import {
  UserPlus,
  Sparkles,
  Shield,
  User,
  CheckCircle2,
  Stethoscope,
  BookOpen,
  ShieldCheck,
  KeyRound,
  Mail
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { GlassCard } from '../components/common/GlassCard.jsx';
import { Button } from '../components/forms/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { PasswordField } from '../components/forms/PasswordField.jsx';

export const RegisterPage = ({ setActivePage }) => {
  const { signup, isLoading, error: authError } = useAuth();
  const { language, t } = useLanguage();
  const [role, setRole] = useState('user'); // 'user' | 'admin'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: '',
    preferredLanguage: language
  });
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (role === 'admin' && !formData.adminCode.trim()) {
      setValidationError('Please provide the Clinical Administrator Verification Code.');
      return;
    }

    try {
      await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        preferredLanguage: formData.preferredLanguage,
        role,
        ...(role === 'admin' ? { adminCode: formData.adminCode.trim() } : {})
      });
      setActivePage(role === 'admin' ? 'admin' : 'dashboard');
    } catch {
      // Handled by AuthContext
    }
  };

  const displayedError = validationError || authError;

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-14 px-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Clinical SaaS Value Proposition (Desktop) */}
        <div className="lg:col-span-5 space-y-6 hidden lg:block">
          <div className="space-y-3">
            <Badge variant="teal" size="md">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Join DentiSense Intelligence</span>
            </Badge>
            <h1 className="text-3xl xl:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-display leading-tight">
              Start your journey toward proactive oral health.
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Create an account to track your consultation history, receive tailored preventive oral routines, and learn from verified dental medical knowledge.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Personal Oral Risk Profile</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assess symptoms, track tooth sensitivity, and review clinical risk tiers anytime.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Secure Clinical Admin Portal</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Clinicians can publish peer-reviewed knowledge and manage dental vector indexes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Registration Card */}
        <div className="lg:col-span-7 max-w-md mx-auto w-full space-y-5">
          <div className="text-center lg:text-left space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center text-xl shadow-lg shadow-teal-500/25 border border-teal-400/30 lg:hidden mx-auto mb-3">
              ✨
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-display">
              Create Your Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
              Select your account type to personalize your clinical dental workspace.
            </p>
          </div>

          <GlassCard level={2} className="p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200/90 dark:border-white/[0.08]">
            {/* Role Segmented Switcher */}
            <div className="p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/[0.07] grid grid-cols-2 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setRole('user');
                  setValidationError('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                  role === 'user'
                    ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/80 dark:border-teal-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient / User</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setValidationError('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/80 dark:border-teal-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Clinical Admin</span>
              </button>
            </div>

            {displayedError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {displayedError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-200">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={role === 'admin' ? 'Dr. Sarah Jenkins' : 'Aarav Sharma'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-200">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={role === 'admin' ? 'sarah.jenkins@clinic.org' : 'patient@example.com'}
                    className="w-full py-2.5 pl-10 pr-4 rounded-xl text-xs bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Administrator Security Verification Code (Conditional on Admin selection) */}
              {role === 'admin' && (
                <div className="p-3.5 rounded-2xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/30 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-200">
                    <KeyRound className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Clinical Security Code <span className="text-rose-500">*</span></span>
                  </div>
                  <input
                    type="password"
                    required
                    value={formData.adminCode}
                    onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
                    placeholder="Enter security code (Demo: DENTA_ADMIN_2026)"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-teal-500/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs shadow-xs"
                  />
                  <p className="text-[10px] text-teal-700/80 dark:text-teal-300/80">
                    Clinical Admin registration requires authorization. For local evaluation, use code: <code className="font-mono font-bold">DENTA_ADMIN_2026</code>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PasswordField
                  label="Password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  helperText="Min. 6 characters"
                />

                <PasswordField
                  label="Confirm Password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  helperText="Must match password"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-200">
                  Preferred Educational Language
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                isLoading={isLoading}
                variant="primary"
                size="md"
                icon={UserPlus}
                className="w-full py-3 shadow-md shadow-teal-500/20 font-bold mt-2"
              >
                <span>{isLoading ? 'Creating account...' : `Register as ${role === 'admin' ? 'Clinical Admin' : 'Patient User'}`}</span>
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setActivePage('login')}
                className="text-teal-600 dark:text-teal-400 font-extrabold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
