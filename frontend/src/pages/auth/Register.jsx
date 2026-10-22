import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ThemeToggle from '../../components/layout/ThemeToggle';
import {
  Layers,
  Mail,
  Lock,
  User,
  Building,
  AlertCircle,
  Briefcase,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'member' ? 'member' : 'owner';
  const initialEmail = searchParams.get('email') || '';
  const inviteToken = searchParams.get('inviteToken') || '';

  const [accountType, setAccountType] = useState(initialType);
  const [formData, setFormData] = useState({
    name: '',
    email: initialEmail,
    password: '',
    title: accountType === 'member' ? 'Frontend Developer' : 'Workspace Owner',
    workspaceName: '',
    teamType: 'Software Development'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialEmail) {
      setFormData((prev) => ({ ...prev, email: initialEmail }));
    }
  }, [initialEmail]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleAccountTypeChange = (type) => {
    setAccountType(type);
    setError('');
    setFormData((prev) => ({
      ...prev,
      title: type === 'member' ? 'Team Member' : 'Workspace Owner'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (accountType === 'owner' && !formData.workspaceName.trim()) {
      setError('Please provide a workspace or organization name');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        ...formData,
        accountType,
        inviteToken
      });

      if (accountType === 'owner') {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-[#F5F7FB] dark:bg-[#0B1120] transition-colors relative">
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
          {accountType === 'member' ? 'Join as a Team Member' : 'Create your workspace'}
        </h2>
        <p className="mt-1 text-center text-xs text-[#667085] dark:text-[#9CA3AF]">
          {accountType === 'member'
            ? 'Register to receive tasks from Project Managers and report progress.'
            : 'Plan Smarter. Track Progress. Deliver Better.'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#111827] py-7 px-5 shadow-xl border border-[#E4E7EC] dark:border-[#374151] rounded-[16px] sm:px-10">
          {/* Dual Account Type Tabs */}
          <div className="grid grid-cols-2 p-1 mb-5 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleAccountTypeChange('member')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                accountType === 'member'
                  ? 'bg-white dark:bg-[#0F172A] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Team Member</span>
            </button>
            <button
              type="button"
              onClick={() => handleAccountTypeChange('owner')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                accountType === 'owner'
                  ? 'bg-white dark:bg-[#0F172A] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Workspace Lead</span>
            </button>
          </div>

          {accountType === 'member' && (
            <div className="mb-4 p-3 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Register your account below. Your Project Manager or Admin can immediately invite your email to projects and allocate deliverables.
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2 border border-red-200 dark:border-red-900/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              id="name"
              label="Full Name"
              placeholder="e.g. Rachel Zane"
              icon={User}
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              id="email"
              label="Work Email"
              type="email"
              placeholder="rachel@company.com"
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
              required
            />

            {accountType === 'member' ? (
              <Input
                id="title"
                label="Role / Specialization"
                placeholder="e.g. Frontend Developer, QA Engineer"
                icon={Briefcase}
                value={formData.title}
                onChange={handleChange}
                required
              />
            ) : (
              <Input
                id="workspaceName"
                label="Company or Workspace Name"
                placeholder="e.g. Acme Tech"
                icon={Building}
                value={formData.workspaceName}
                onChange={handleChange}
                required
              />
            )}

            <Input
              id="password"
              label="Password (min 6 characters)"
              type="password"
              placeholder="••••••••••••"
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
            >
              {accountType === 'member' ? 'Register as Team Member' : 'Create Organization Workspace'}
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-[#667085] dark:text-[#9CA3AF]">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-[#4F46E5] dark:text-[#818CF8] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
