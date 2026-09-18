import React, { useState } from 'react';
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { InputField } from '../components/forms/InputField.jsx';
import { PasswordField } from '../components/forms/PasswordField.jsx';
import { Button } from '../components/forms/Button.jsx';
import { GlassCard } from '../components/common/GlassCard.jsx';

export const ForgotPasswordPage = ({ setActivePage }) => {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState(1); // 1 = Request, 2 = Reset
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await forgotPassword(email);
      if (res?.data?.resetToken) {
        setToken(res.data.resetToken);
      }
      setMessage({
        type: 'success',
        text: 'A password reset token has been generated. Enter your token and new password below.'
      });
      setStep(2);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await resetPassword(token, newPassword);
      setMessage({ type: 'success', text: 'Password reset successfully! You can now log in.' });
      setTimeout(() => {
        setActivePage('login');
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Password reset failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 sm:py-16 px-4 space-y-6 animate-in fade-in duration-200">
      <div className="text-center space-y-2.5">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-500/20 shadow-xs">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {step === 1 ? 'Reset Your Password' : 'Set New Password'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
          {step === 1
            ? 'Enter your registered email address to receive a secure password reset token.'
            : 'Enter the verification token and choose a secure new password.'}
        </p>
      </div>

      <GlassCard level={2} className="p-6 sm:p-8 space-y-5 shadow-2xl">
        {message && (
          <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
            <span>{message.text}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <InputField
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              size="md"
              variant="primary"
              className="w-full py-3 shadow-md shadow-teal-500/20"
              isLoading={loading}
            >
              Generate Reset Token
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <InputField
              label="Reset Token"
              placeholder="Paste verification token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />

            <PasswordField
              label="New Password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              size="md"
              variant="primary"
              className="w-full py-3 shadow-md shadow-teal-500/20"
              isLoading={loading}
            >
              Confirm Password Reset
            </Button>
          </form>
        )}

        <div className="text-center pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
          <button
            onClick={() => setActivePage('login')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
