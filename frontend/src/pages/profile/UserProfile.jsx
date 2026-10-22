import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { User, Lock, Palette, CheckCircle2 } from 'lucide-react';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    try {
      const res = await api.put('/auth/profile', {
        name,
        title,
        bio,
        avatar
      });
      if (res.data.success) {
        updateUser(res.data.user);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }

    setPwLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        setPwSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwSuccess(false), 3000);
      }
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
          Personal Profile & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF]">
          Manage your account credentials, job title, and interface theme.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="p-6 text-center space-y-3 flex flex-col items-center">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-100 dark:ring-indigo-950/60"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#0D9488] text-white flex items-center justify-center font-bold text-2xl uppercase">
              {name ? name.substring(0, 2) : 'PT'}
            </div>
          )}

          <div>
            <h3 className="text-base font-bold text-[#172033] dark:text-[#F3F4F6]">{name}</h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{title || 'Contributor'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
          </div>

          {bio && (
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF] border-t border-[#E4E7EC] dark:border-[#374151] pt-3 text-left w-full leading-relaxed">
              {bio}
            </p>
          )}
        </Card>

        {/* Edit Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Details */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E4E7EC] dark:border-[#374151] pb-3">
              <User className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
                General Information
              </h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Role / Title"
                placeholder="e.g. Senior Backend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Input
                label="Avatar Image URL"
                placeholder="https://example.com/avatar.jpg"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
                  Bio / Focus Area
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {profileSuccess && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Profile successfully updated.
                </p>
              )}

              <Button type="submit" variant="primary" loading={profileLoading}>
                Save Changes
              </Button>
            </form>
          </Card>

          {/* Change Password */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E4E7EC] dark:border-[#374151] pb-3">
              <Lock className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
                Security & Password
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {pwError && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{pwError}</p>}
              {pwSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Password updated successfully.</p>}

              <Button type="submit" variant="secondary" loading={pwLoading}>
                Change Password
              </Button>
            </form>
          </Card>

          {/* Theme Preference */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E4E7EC] dark:border-[#374151] pb-3">
              <Palette className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
                Interface Theme
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 p-3.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                Light Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 p-3.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                Dark Mode
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
