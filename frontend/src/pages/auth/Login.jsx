import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ThemeToggle from '../../components/layout/ThemeToggle';
import { Layers, Mail, Lock, AlertCircle, Shield } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res?.user?.role === 'system_admin' || res?.user?.email?.toLowerCase() === 'protrack24@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F5F7FB] dark:bg-[#0B1120] transition-colors relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 group" title="Back to Home">
          <img 
            src="/logo.png" 
            alt="ProTrack Logo" 
            className="w-11 h-11 object-contain rounded-2xl shadow-lg bg-white p-1 group-hover:scale-105 transition-transform" 
          />
          <span className="font-extrabold text-2xl tracking-tight text-[#172033] dark:text-white">
            Pro<span className="text-[#0284c7] dark:text-[#38bdf8]">Track</span>
          </span>
        </Link>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-[#172033] dark:text-white">
          Sign in to your workspace
        </h2>
        <p className="mt-1 text-center text-xs text-[#667085] dark:text-[#9CA3AF]">
          Plan Smarter. Track Progress. Deliver Better.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#111827] py-8 px-4 shadow-xl border border-[#E4E7EC] dark:border-[#374151] rounded-[16px] sm:px-10">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2 border border-red-200 dark:border-red-900/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              id="email"
              label="Work Email"
              type="email"
              placeholder="alex@protrack.dev"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-medium text-[#4F46E5] dark:text-[#818CF8] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
            >
              Sign In to ProTrack
            </Button>
          </form>

          {/* Quick-Fill Admin Credentials */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800 text-center">
            <button
              type="button"
              onClick={() => {
                setEmail('protrack24@gmail.com');
                setPassword('Admin@ProTrack24');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Fill Master Admin: protrack24@gmail.com</span>
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-[#667085] dark:text-[#9CA3AF]">
            Don't have an account?{' '}
            <Link
              to="/auth/register?type=member"
              className="font-semibold text-[#4F46E5] dark:text-[#818CF8] hover:underline"
            >
              Sign up as Team Member
            </Link>
            {' · '}
            <Link
              to="/auth/register?type=owner"
              className="font-medium text-[#667085] dark:text-[#9CA3AF] hover:underline"
            >
              New Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
