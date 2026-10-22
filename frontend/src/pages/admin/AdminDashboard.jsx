import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ThemeToggle from '../../components/layout/ThemeToggle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  Shield,
  ShieldAlert,
  Users,
  FolderKanban,
  Building2,
  MessageSquareHeart,
  CreditCard,
  Activity,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  LogOut,
  ExternalLink,
  Trash2,
  Key,
  Star,
  Check,
  Clock,
  Sparkles,
  Server,
  Layers,
  ArrowRight,
  UserCheck,
  UserX,
  ShieldCheck,
  BadgeAlert,
  Calendar,
  MessageSquare,
  TrendingUp,
  Cpu
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, feedbacks, workspaces, payments, system
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  // Users Management State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // Feedbacks State
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('all');
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesText, setNotesText] = useState('');

  // Workspaces & Projects State
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [wpLoading, setWpLoading] = useState(false);

  // Payments State
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Activity Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Notification Toast message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Global Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  // 2. Fetch Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          search: userSearch || undefined,
          role: userRoleFilter !== 'all' ? userRoleFilter : undefined,
          status: userStatusFilter !== 'all' ? userStatusFilter : undefined,
          limit: 100
        }
      });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // 3. Fetch Feedbacks
  const fetchFeedbacks = async () => {
    setFeedbackLoading(true);
    try {
      const res = await api.get('/admin/feedbacks', {
        params: {
          status: feedbackStatusFilter !== 'all' ? feedbackStatusFilter : undefined,
          category: feedbackCategoryFilter !== 'all' ? feedbackCategoryFilter : undefined
        }
      });
      if (res.data.success) {
        setFeedbacks(res.data.feedbacks);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // 4. Fetch Workspaces & Projects
  const fetchWorkspacesAndProjects = async () => {
    setWpLoading(true);
    try {
      const [wsRes, pRes] = await Promise.all([
        api.get('/admin/workspaces'),
        api.get('/admin/projects')
      ]);
      if (wsRes.data.success) setWorkspaces(wsRes.data.workspaces);
      if (pRes.data.success) setProjects(pRes.data.projects);
    } catch (err) {
      console.error('Error fetching workspaces/projects:', err);
    } finally {
      setWpLoading(false);
    }
  };

  // 5. Fetch Payments
  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await api.get('/admin/payments');
      if (res.data.success) setPayments(res.data.payments);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  // 6. Fetch Logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/admin/activity-logs');
      if (res.data.success) setLogs(res.data.logs);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchFeedbacks()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle Tab Switch Data Fetching
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'feedbacks') fetchFeedbacks();
    else if (activeTab === 'workspaces') fetchWorkspacesAndProjects();
    else if (activeTab === 'payments') fetchPayments();
    else if (activeTab === 'system') fetchLogs();
  }, [activeTab]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchFeedbacks(),
      activeTab === 'workspaces' ? fetchWorkspacesAndProjects() : null,
      activeTab === 'payments' ? fetchPayments() : null,
      activeTab === 'system' ? fetchLogs() : null
    ]);
    setRefreshing(false);
    showToast('Platform data refreshed successfully');
  };

  // User Actions
  const handleToggleUserStatus = async (userId, currentStatus, email) => {
    if (email.toLowerCase() === 'protrack24@gmail.com') {
      showToast('Master Administrator account cannot be suspended', 'error');
      return;
    }
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        showToast(`User status changed to ${newStatus}`);
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        fetchStats();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  const handleToggleUserRole = async (userId, currentRole, email) => {
    if (email.toLowerCase() === 'protrack24@gmail.com') {
      showToast('Cannot modify role of Master Administrator', 'error');
      return;
    }
    const newRole = currentRole === 'system_admin' ? 'user' : 'system_admin';
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        showToast(`User role changed to ${newRole}`);
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user role', 'error');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (email.toLowerCase() === 'protrack24@gmail.com') {
      showToast('Master Administrator account cannot be deleted', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${email}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        showToast(`User "${email}" deleted successfully`);
        setUsers(users.filter(u => u.id !== userId));
        fetchStats();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newPasswordInput) return;
    setPasswordResetLoading(true);
    try {
      const res = await api.put(`/admin/users/${selectedUserForPassword.id}/reset-password`, {
        newPassword: newPasswordInput
      });
      if (res.data.success) {
        showToast(`Password updated successfully for ${selectedUserForPassword.email}`);
        setSelectedUserForPassword(null);
        setNewPasswordInput('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setPasswordResetLoading(false);
    }
  };

  // Feedback Actions
  const handleUpdateFeedbackStatus = async (feedbackId, newStatus) => {
    try {
      const res = await api.put(`/admin/feedbacks/${feedbackId}`, { status: newStatus });
      if (res.data.success) {
        setFeedbacks(feedbacks.map(f => f.id === feedbackId ? { ...f, status: newStatus } : f));
        showToast(`Feedback marked as ${newStatus}`);
        fetchStats();
      }
    } catch (err) {
      showToast('Failed to update feedback status', 'error');
    }
  };

  const handleSaveNotes = async (feedbackId) => {
    try {
      const res = await api.put(`/admin/feedbacks/${feedbackId}`, { adminNotes: notesText });
      if (res.data.success) {
        setFeedbacks(feedbacks.map(f => f.id === feedbackId ? { ...f, adminNotes: notesText } : f));
        setEditingNotesId(null);
        showToast('Admin note saved');
      }
    } catch (err) {
      showToast('Failed to save admin note', 'error');
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Delete this feedback entry?')) return;
    try {
      const res = await api.delete(`/admin/feedbacks/${feedbackId}`);
      if (res.data.success) {
        setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
        showToast('Feedback deleted');
        fetchStats();
      }
    } catch (err) {
      showToast('Failed to delete feedback', 'error');
    }
  };

  // Workspace Actions
  const handleDeleteWorkspace = async (wsId, wsName) => {
    if (!window.confirm(`Permanently delete workspace "${wsName}" and all associated data?`)) return;
    try {
      const res = await api.delete(`/admin/workspaces/${wsId}`);
      if (res.data.success) {
        setWorkspaces(workspaces.filter(w => w.id !== wsId));
        showToast(`Workspace "${wsName}" deleted`);
        fetchStats();
      }
    } catch (err) {
      showToast('Failed to delete workspace', 'error');
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !userSearch || 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B1120] text-[#172033] dark:text-[#F3F4F6] transition-colors duration-200 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border animate-in slide-in-from-bottom-3 ${
          toastMessage.type === 'error'
            ? 'bg-red-600 text-white border-red-700'
            : 'bg-emerald-600 text-white border-emerald-700'
        }`}>
          {toastMessage.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP MASTER ADMIN NAV */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#0B1120]/90 border-b border-[#E4E7EC] dark:border-[#1F2937] px-4 sm:px-8 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ProTrack Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <span className="font-extrabold text-xl tracking-tight text-[#172033] dark:text-white flex items-center">
              Pro<span className="text-[#0284c7] dark:text-[#38bdf8]">Track</span>
            </span>
          </Link>
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
            <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Master System Admin Console</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Admin: <strong className="text-gray-900 dark:text-white">protrack24@gmail.com</strong></span>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RotateCw}
            loading={refreshing}
            onClick={handleRefreshAll}
            title="Refresh platform data"
            className="hidden sm:inline-flex text-xs px-2.5"
          >
            Refresh
          </Button>

          <Link to="/dashboard">
            <Button variant="secondary" size="sm" icon={ExternalLink} className="text-xs px-2.5 sm:px-3">
              <span className="hidden sm:inline">Go to </span>Workspace
            </Button>
          </Link>

          <ThemeToggle />

          <button
            onClick={logout}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
            title="Sign out of Administrator"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* DASHBOARD BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner / Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033] dark:text-white flex items-center gap-2.5">
              <span>Platform Command Center</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Super Admin
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-1">
              Oversee and manage all registered users, customer feedbacks, workspaces, and system performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Database Online: 127.0.0.1:27017/protrack
            </span>
          </div>
        </div>

        {/* 1. KPI STATS CARDS */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Total Users */}
            <div 
              onClick={() => setActiveTab('users')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                  : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#1F2937] hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                  Total Users
                </span>
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-[#172033] dark:text-white mt-2">
                {stats.users.total}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.users.active} active</span>
                {stats.users.suspended > 0 && (
                  <span className="text-red-500 font-semibold">{stats.users.suspended} suspended</span>
                )}
              </div>
            </div>

            {/* Total Feedbacks */}
            <div 
              onClick={() => setActiveTab('feedbacks')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'feedbacks'
                  ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#1F2937] hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                  Feedbacks
                </span>
                <MessageSquareHeart className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-extrabold text-[#172033] dark:text-white mt-2">
                {stats.feedback.total}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                <span className="text-amber-600 dark:text-amber-400 font-bold">{stats.feedback.new} new</span>
                <span>• ⭐ {stats.feedback.avgRating} / 5</span>
              </div>
            </div>

            {/* Workspaces */}
            <div 
              onClick={() => setActiveTab('workspaces')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'workspaces'
                  ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-500 shadow-sm'
                  : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#1F2937] hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                  Workspaces
                </span>
                <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-extrabold text-[#172033] dark:text-white mt-2">
                {stats.workspaces.total}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Teams & Orgs</p>
            </div>

            {/* Total Projects */}
            <div 
              onClick={() => setActiveTab('workspaces')}
              className="p-4 rounded-2xl border bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#1F2937] hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                  Projects
                </span>
                <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-[#172033] dark:text-white mt-2">
                {stats.projects.total}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">{stats.projects.active} in progress</p>
            </div>

            {/* Revenue INR */}
            <div 
              onClick={() => setActiveTab('payments')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
                  : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#1F2937] hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                  Payments (INR)
                </span>
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                ₹{stats.revenue.totalINR.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">{stats.revenue.transactionsCount} paid transactions</p>
            </div>

            {/* System Health */}
            <div 
              onClick={() => setActiveTab('system')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-500 shadow-sm'
                  : 'bg-white dark:bg-[#111827] border-[#E4E7EC] dark:border-[#1F2937] hover:border-cyan-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                  System Status
                </span>
                <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <p className="text-2xl font-extrabold text-[#172033] dark:text-white mt-2">
                {stats.system.memoryUsageMB} <span className="text-xs font-normal text-gray-500">MB RAM</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Node {stats.system.nodeVersion}</p>
            </div>
          </div>
        )}

        {/* 2. NAVIGATION TABS */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 border-b border-[#E4E7EC] dark:border-[#1F2937]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'text-[#667085] dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Overview & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'text-[#667085] dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
            {stats && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {stats.users.total}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('feedbacks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap relative ${
              activeTab === 'feedbacks'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'text-[#667085] dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <MessageSquareHeart className="w-4 h-4" />
            <span>User Feedbacks</span>
            {stats && stats.feedback.new > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold animate-pulse">
                {stats.feedback.new} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('workspaces')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'workspaces'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'text-[#667085] dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Workspaces & Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'text-[#667085] dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments & Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'system'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'text-[#667085] dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Activity Logs & Logs</span>
          </button>
        </div>

        {/* 3. TAB CONTENT */}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions & Credentials Card */}
              <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#1F2937] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172033] dark:text-white">
                      Master Administrator Profile
                    </h3>
                    <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
                      Top-level authority over ProTrack platform
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#1F2937]/50 border border-gray-200 dark:border-gray-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Admin Email:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">protrack24@gmail.com</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Role Authority:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Master Super Admin</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Security Clearance:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Full Access (CRUD)</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E4E7EC] dark:border-[#374151] hover:bg-gray-50 dark:hover:bg-[#1F2937] text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Manage Platform Users ({stats?.users.total})
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('feedbacks')}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E4E7EC] dark:border-[#374151] hover:bg-gray-50 dark:hover:bg-[#1F2937] text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquareHeart className="w-4 h-4 text-amber-500" />
                      Review User Feedbacks ({stats?.feedback.total})
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('workspaces')}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E4E7EC] dark:border-[#374151] hover:bg-gray-50 dark:hover:bg-[#1F2937] text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      Audit Workspaces & Projects ({stats?.workspaces.total})
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Feedbacks Summary Stream */}
              <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#1F2937] rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareHeart className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-[#172033] dark:text-white">
                      Recent Customer Feedbacks & Suggestions
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('feedbacks')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    View All ({feedbacks.length})
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {feedbacks.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No feedbacks received yet.</p>
                ) : (
                  <div className="space-y-3">
                    {feedbacks.slice(0, 3).map((fb) => (
                      <div
                        key={fb.id}
                        className="p-3.5 rounded-xl border border-[#E4E7EC] dark:border-[#1F2937] bg-gray-50/50 dark:bg-[#1F2937]/30 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#172033] dark:text-white">{fb.name}</span>
                            <span className="text-[11px] text-gray-400">({fb.email})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          "{fb.message}"
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {fb.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            fb.status === 'new'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : fb.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}>
                            {fb.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#1F2937] p-4 rounded-2xl shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl text-[#172033] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-gray-50 dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Regular User</option>
                  <option value="system_admin">System Admin</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-gray-50 dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Accounts</option>
                  <option value="suspended">Suspended Accounts</option>
                </select>

                <Button variant="outline" size="sm" icon={RotateCw} onClick={fetchUsers}>
                  Refresh
                </Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#1F2937] rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E7EC] dark:border-[#1F2937] bg-gray-50/70 dark:bg-[#1F2937]/50 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Workspaces</th>
                      <th className="px-5 py-3.5">Registered</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#1F2937]">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                          <div className="flex items-center justify-center gap-2">
                            <RotateCw className="w-4 h-4 animate-spin text-indigo-600" />
                            <span>Loading users database...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isMaster = u.email.toLowerCase() === 'protrack24@gmail.com';
                        return (
                          <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                  {u.avatar ? (
                                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    u.name.substring(0, 2)
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {isMaster && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                                        MASTER
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-gray-400">{u.title || 'Contributor'}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-gray-600 dark:text-gray-300">
                              {u.email}
                            </td>

                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                u.role === 'system_admin'
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {u.role === 'system_admin' ? 'System Admin' : 'Regular User'}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                u.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                {u.status === 'active' ? 'Active' : 'Suspended'}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 dark:text-gray-400">
                              {u.workspacesCount || 0} workspaces
                            </td>

                            <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-gray-400">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>

                            <td className="px-5 py-3.5 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Toggle Suspend / Active */}
                                {!isMaster && (
                                  <button
                                    onClick={() => handleToggleUserStatus(u.id, u.status, u.email)}
                                    title={u.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      u.status === 'active'
                                        ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                    }`}
                                  >
                                    {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                  </button>
                                )}

                                {/* Reset Password */}
                                <button
                                  onClick={() => setSelectedUserForPassword(u)}
                                  title="Reset User Password"
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                >
                                  <Key className="w-4 h-4" />
                                </button>

                                {/* Toggle Admin Role */}
                                {!isMaster && (
                                  <button
                                    onClick={() => handleToggleUserRole(u.id, u.role, u.email)}
                                    title={u.role === 'system_admin' ? 'Demote to User' : 'Make System Admin'}
                                    className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                                  >
                                    <Shield className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Delete User */}
                                {!isMaster && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                    title="Permanently Delete User"
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Reset Password */}
            {selectedUserForPassword && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-sm bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-600" />
                      Set New Password
                    </h3>
                    <button
                      onClick={() => setSelectedUserForPassword(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Directly override the password for <strong>{selectedUserForPassword.email}</strong>.
                  </p>
                  <form onSubmit={handleResetPassword} className="space-y-3">
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Enter new password (min 6 chars)..."
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUserForPassword(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        loading={passwordResetLoading}
                      >
                        Save Password
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER FEEDBACKS */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#1F2937] p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Customer & User Feedback Submissions
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                  {feedbacks.length} Total
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={feedbackStatusFilter}
                  onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-gray-50 dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New (Unread)</option>
                  <option value="read">Read</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>

                <select
                  value={feedbackCategoryFilter}
                  onChange={(e) => setFeedbackCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-gray-50 dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">All Categories</option>
                  <option value="General Feedback">General Feedback</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Billing / Payments">Billing / Payments</option>
                  <option value="Other">Other</option>
                </select>

                <Button variant="outline" size="sm" icon={RotateCw} onClick={fetchFeedbacks}>
                  Refresh
                </Button>
              </div>
            </div>

            {/* Feedback Cards List */}
            {feedbackLoading ? (
              <div className="py-12 text-center text-gray-400">
                <RotateCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                <span>Loading feedback inbox...</span>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#1F2937] rounded-2xl p-12 text-center space-y-3">
                <MessageSquareHeart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Feedback Records</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When users or landing page visitors submit feedback through the "Feedback" button, they will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className={`bg-white dark:bg-[#111827] border rounded-2xl p-5 shadow-sm space-y-3 transition-all ${
                      fb.status === 'new'
                        ? 'border-amber-300 dark:border-amber-800 ring-1 ring-amber-300 dark:ring-amber-900/40'
                        : 'border-[#E4E7EC] dark:border-[#1F2937]'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {fb.name}
                          </h4>
                          <span className="text-xs font-mono text-gray-500">
                            &lt;{fb.email}&gt;
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                            {fb.category}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(fb.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= fb.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Feedback Message */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1F2937]/50 border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {fb.message}
                    </div>

                    {/* Admin Internal Notes */}
                    {editingNotesId === fb.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="Add internal admin resolution note..."
                          className="w-full p-2.5 text-xs bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingNotesId(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" variant="primary" onClick={() => handleSaveNotes(fb.id)}>
                            Save Note
                          </Button>
                        </div>
                      </div>
                    ) : fb.adminNotes ? (
                      <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start justify-between">
                        <div>
                          <strong className="block text-indigo-700 dark:text-indigo-300 font-semibold mb-0.5">
                            Admin Internal Note:
                          </strong>
                          <span>{fb.adminNotes}</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingNotesId(fb.id);
                            setNotesText(fb.adminNotes);
                          }}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-2"
                        >
                          Edit
                        </button>
                      </div>
                    ) : null}

                    {/* Actions & Status Dropdown */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] dark:border-[#1F2937]">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-500">Status:</span>
                        <select
                          value={fb.status}
                          onChange={(e) => handleUpdateFeedbackStatus(fb.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            fb.status === 'new'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                              : fb.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        {!fb.adminNotes && editingNotesId !== fb.id && (
                          <button
                            onClick={() => {
                              setEditingNotesId(fb.id);
                              setNotesText('');
                            }}
                            className="text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            + Add Note
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteFeedback(fb.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete feedback"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WORKSPACES & PROJECTS */}
        {activeTab === 'workspaces' && (
          <div className="space-y-6">
            {/* Workspaces List */}
            <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#1F2937] rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    All Organizations & Workspaces
                  </h3>
                  <p className="text-xs text-gray-500">Every active workspace created across the system</p>
                </div>
                <Button variant="outline" size="sm" icon={RotateCw} onClick={fetchWorkspacesAndProjects}>
                  Refresh
                </Button>
              </div>

              {wpLoading ? (
                <div className="py-8 text-center text-gray-400">Loading workspaces...</div>
              ) : workspaces.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No workspaces found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E4E7EC] dark:border-[#1F2937] bg-gray-50 dark:bg-[#1F2937]/50 text-gray-500 font-semibold text-[10px] uppercase">
                        <th className="px-4 py-3">Workspace</th>
                        <th className="px-4 py-3">Owner</th>
                        <th className="px-4 py-3">Team Type</th>
                        <th className="px-4 py-3">Members</th>
                        <th className="px-4 py-3">Projects</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#1F2937]">
                      {workspaces.map((ws) => (
                        <tr key={ws.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            {ws.name}
                            <span className="block text-[11px] font-mono text-gray-400">{ws.slug}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {ws.owner?.name || 'Unknown'} ({ws.owner?.email || 'N/A'})
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-medium">
                              {ws.teamType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{ws.membersCount} members</td>
                          <td className="px-4 py-3 text-gray-500">{ws.projectsCount} projects</td>
                          <td className="px-4 py-3 text-gray-400 text-[11px]">
                            {new Date(ws.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete Workspace"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Projects Overview */}
            <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#1F2937] rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                Platform Projects ({projects.length})
              </h3>
              {wpLoading ? (
                <div className="py-8 text-center text-gray-400">Loading projects...</div>
              ) : projects.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No projects registered yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-[#E4E7EC] dark:border-[#1F2937] bg-gray-50/50 dark:bg-[#1F2937]/40 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-indigo-600 font-bold">{p.projectCode}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase">
                          {p.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{p.name}</h4>
                      <p className="text-[11px] text-gray-500">Workspace: {p.workspace?.name || 'N/A'}</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${p.progress || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 pt-1">
                        <span>{p.completedTasks} / {p.totalTasks} Tasks</span>
                        <span>{p.progress}% Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENTS & INVOICES */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#1F2937] rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Razorpay Platform Transactions & Revenue
                </h3>
                <p className="text-xs text-gray-500">Official fee receipts, customer invoice records and payment IDs</p>
              </div>
              <Button variant="outline" size="sm" icon={RotateCw} onClick={fetchPayments}>
                Refresh
              </Button>
            </div>

            {paymentsLoading ? (
              <div className="py-8 text-center text-gray-400">Loading transactions...</div>
            ) : payments.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No payment transactions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E7EC] dark:border-[#1F2937] bg-gray-50 dark:bg-[#1F2937]/50 text-gray-500 font-semibold text-[10px] uppercase">
                      <th className="px-4 py-3">Receipt ID</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Workspace</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Razorpay Payment ID</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#1F2937]">
                    {payments.map((pmt) => (
                      <tr key={pmt._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{pmt.receipt || pmt.razorpayOrderId}</td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {pmt.user?.name} ({pmt.user?.email})
                        </td>
                        <td className="px-4 py-3 text-gray-500">{pmt.workspace?.name}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">₹{pmt.amount} {pmt.currency}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-gray-500">{pmt.razorpayPaymentId || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            pmt.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pmt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-gray-400">
                          {new Date(pmt.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SYSTEM LOGS & HEALTH */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Server Platform</span>
                <p className="text-lg font-bold text-gray-800 dark:text-white">Windows NT (win32)</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Node.js Engine</span>
                <p className="text-lg font-bold text-gray-800 dark:text-white">{stats?.system.nodeVersion}</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Process Uptime</span>
                <p className="text-lg font-bold text-gray-800 dark:text-white">
                  {Math.floor((stats?.system.uptimeSeconds || 0) / 60)} minutes
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#1F2937] rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-600" />
                  Recent System Activity Logs
                </h3>
                <Button variant="outline" size="sm" icon={RotateCw} onClick={fetchLogs}>
                  Refresh
                </Button>
              </div>

              {logsLoading ? (
                <div className="py-8 text-center text-gray-400">Loading audit trail...</div>
              ) : logs.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No recent audit logs available.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log._id}
                      className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1F2937]/30 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {log.user?.name || 'System User'}:
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">{log.action || log.description}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
