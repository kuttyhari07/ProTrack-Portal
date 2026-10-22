import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ThemeToggle from '../../components/layout/ThemeToggle';
import { Layers, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'Password reset link generated.');
      setSubmitted(true);
    } catch (err) {
      setMessage('Failed to generate reset link. Please check the email.');
      setSubmitted(true);
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
          Reset your password
        </h2>
        <p className="mt-1 text-center text-xs text-[#667085] dark:text-[#9CA3AF]">
          Enter your registered work email to receive password reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#111827] py-8 px-4 shadow-xl border border-[#E4E7EC] dark:border-[#374151] rounded-[16px] sm:px-10">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-[#172033] dark:text-[#F3F4F6]">
                Check your inbox
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
                {message}
              </p>
              <div className="pt-2">
                <Link to="/auth/login">
                  <Button variant="outline" className="w-full">
                    Return to sign in
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                id="email"
                label="Registered Work Email"
                type="email"
                placeholder="you@company.com"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
              >
                Send Reset Instructions
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#667085] dark:text-[#9CA3AF] hover:text-[#172033] dark:hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
