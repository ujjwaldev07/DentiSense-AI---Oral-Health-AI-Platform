import React, { useState } from 'react';
import {
  User as UserIcon,
  Globe,
  Lock,
  Heart,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { InputField } from '../components/forms/InputField.jsx';
import { SelectField } from '../components/forms/SelectField.jsx';
import { PasswordField } from '../components/forms/PasswordField.jsx';
import { Button } from '../components/forms/Button.jsx';
import { GlassCard } from '../components/common/GlassCard.jsx';
import { Badge } from '../components/common/Badge.jsx';

export const ProfilePage = () => {
  const { user, updateProfile, updatePreferences, updatePassword } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [prefLang, setPrefLang] = useState(user?.preferredLanguage || language || 'en');
  const [brushing, setBrushing] = useState(user?.oralHealthProfile?.brushingFrequency || 2);
  const [flossing, setFlossing] = useState(user?.oralHealthProfile?.flossingHabit || 'daily');
  const [lastVisit, setLastVisit] = useState(user?.oralHealthProfile?.lastVisit || 'less_than_6_months');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status state
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await updateProfile({
        name,
        preferredLanguage: prefLang,
        oralHealthProfile: {
          brushingFrequency: Number(brushing),
          flossingHabit: flossing,
          lastVisit
        }
      });
      setLanguage(prefLang);
      setProfileMessage({ type: 'success', text: 'Profile & oral habits updated successfully!' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 sm:py-10 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="teal" size="md">
          <UserIcon className="w-3.5 h-3.5" />
          <span>Account Settings</span>
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Personal Profile & Oral Health Habits
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
          Manage your personal details, language preferences, and daily hygiene baseline for more tailored AI insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Overview Card */}
        <div className="md:col-span-1 space-y-4">
          <GlassCard level={2} className="space-y-4 text-center p-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/25 border border-teal-400/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{user?.name}</h3>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-center">
              <Badge variant={user?.role === 'admin' ? 'purple' : 'teal'} size="md">
                {user?.role === 'admin' ? 'Administrator' : 'Verified Member'}
              </Badge>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile & Hygiene Form */}
          <GlassCard level={2} className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Personal Information & Hygiene Profile
              </h3>
            </div>

            {profileMessage && (
              <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30'
              }`}>
                {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <InputField
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <SelectField
                label="Preferred Language"
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value)}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'hi', label: 'हिंदी (Hindi)' },
                  { value: 'mr', label: 'मराठी (Marathi)' }
                ]}
              />

              <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.08] space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Daily Oral Hygiene Baseline
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Brushing Frequency"
                    value={brushing}
                    onChange={(e) => setBrushing(e.target.value)}
                    options={[
                      { value: 1, label: 'Once a day' },
                      { value: 2, label: 'Twice a day (Recommended)' },
                      { value: 3, label: '3+ times a day' }
                    ]}
                  />

                  <SelectField
                    label="Flossing Habit"
                    value={flossing}
                    onChange={(e) => setFlossing(e.target.value)}
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'occasionally', label: 'Occasionally' },
                      { value: 'rarely', label: 'Rarely / Never' }
                    ]}
                  />
                </div>

                <SelectField
                  label="Last Dental Checkup"
                  value={lastVisit}
                  onChange={(e) => setLastVisit(e.target.value)}
                  options={[
                    { value: 'less_than_6_months', label: 'Within the last 6 months' },
                    { value: '6_to_12_months', label: '6 to 12 months ago' },
                    { value: 'more_than_1_year', label: 'Over 1 year ago' },
                    { value: 'never', label: 'Never had a dental checkup' }
                  ]}
                />
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  isLoading={savingProfile}
                  icon={Save}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </GlassCard>

          {/* Password Change Form */}
          <GlassCard level={2} className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Security & Password
              </h3>
            </div>

            {passwordMessage && (
              <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30'
              }`}>
                {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <PasswordField
                label="New Password"
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

              <div className="pt-3">
                <Button
                  type="submit"
                  size="md"
                  variant="secondary"
                  isLoading={savingPassword}
                  icon={Lock}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
