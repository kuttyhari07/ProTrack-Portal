import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ThemeToggle from '../../components/layout/ThemeToggle';
import {
  Layers,
  Mail,
  Copy,
  Check,
  KeyRound,
  RefreshCw,
  LogOut,
  UserCheck,
  Sparkles,
  Building2
} from 'lucide-react';

const MemberWaitingPortal = () => {
  const { user, logout } = useAuth();
  const { refreshWorkspaces, createWorkspace } = useWorkspace();

  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fallback workspace creation
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [wsName, setWsName] = useState('');
  const [creatingWs, setCreatingWs] = useState(false);

  const copyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinWithToken = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;

    setJoining(true);
    setJoinError('');
    setJoinSuccess('');

    try {
      const res = await api.post('/auth/accept-invite', { token: token.trim() });
      if (res.data.success) {
        setJoinSuccess(res.data.message || 'Joined workspace successfully!');
        setTimeout(async () => {
          await refreshWorkspaces();
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Invalid or expired invitation token.');
    } finally {
      setJoining(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshWorkspaces();
    setTimeout(() => {
      setRefreshing(false);
      window.location.reload();
    }, 800);
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    setCreatingWs(true);
    try {
      await createWorkspace({ name: wsName.trim(), teamType: 'General' });
      window.location.reload();
    } catch (err) {
      setJoinError('Failed to create workspace.');
    } finally {
      setCreatingWs(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B1120] flex flex-col justify-center items-center px-4 py-12 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>
          Sign Out
        </Button>
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <img 
            src="/logo.png" 
            alt="ProTrack Logo" 
            className="w-14 h-14 object-contain rounded-2xl shadow-lg bg-white p-1 mx-auto mb-3" 
          />
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-[#F3F4F6]">
            Welcome, {user?.name || 'Team Member'}!
          </h1>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
            Your Team Member account is active and ready.
          </p>
        </div>

        {/* Main Status Card */}
        <Card className="p-6 space-y-5 border border-[#E4E7EC] dark:border-[#374151] shadow-xl">
          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2 font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
              <UserCheck className="w-4 h-4" />
              <span>Awaiting Workspace Invitation</span>
            </div>
            <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
              To start collaborating and delivering assigned tasks, share your registered work email with your <strong>Project Manager</strong> or <strong>Workspace Admin</strong>.
            </p>
          </div>

          {/* Email Copy Card */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Your Registered Email
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-[#0F172A] dark:text-[#F8FAFC] truncate">
                {user?.email}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={copyEmail}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#667085] dark:text-[#9CA3AF]">
              Already invited by your PM?
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={handleRefresh}
            >
              Check Status
            </Button>
          </div>

          {/* Token Join Section */}
          <div className="pt-4 border-t border-[#E4E7EC] dark:border-[#374151]">
            <p className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>Have an Invitation Code or Token?</span>
            </p>

            {joinError && (
              <p className="mb-2 text-xs text-red-600 dark:text-red-400 font-medium">
                {joinError}
              </p>
            )}
            {joinSuccess && (
              <p className="mb-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {joinSuccess}
              </p>
            )}

            <form onSubmit={handleJoinWithToken} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste invite token here..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="flex-1 rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-xs px-3 py-2 text-[#172033] dark:text-[#F3F4F6] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={joining}
                  disabled={!token.trim()}
                >
                  Join
                </Button>
              </div>
            </form>
          </div>

          {/* Optional: Create Workspace Toggle */}
          <div className="pt-3 border-t border-[#E4E7EC] dark:border-[#374151] text-center">
            {!showCreateWs ? (
              <button
                type="button"
                onClick={() => setShowCreateWs(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Need to lead your own project workspace?</span>
              </button>
            ) : (
              <form onSubmit={handleCreateWorkspace} className="space-y-2 text-left pt-1">
                <Input
                  label="New Workspace Name"
                  placeholder="e.g. Engineering Squad"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    loading={creatingWs}
                  >
                    Create Workspace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateWs(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MemberWaitingPortal;
