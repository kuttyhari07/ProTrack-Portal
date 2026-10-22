import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  BellRing,
  FolderKanban,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Download,
  ShieldAlert,
  Send
} from 'lucide-react';

const MemberDashboard = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Filter for my tasks
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'in_progress' | 'due_soon' | 'overdue' | 'completed'
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderToast, setReminderToast] = useState(null);

  // Report Issue Modal
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: 'high',
    category: 'blocker'
  });

  // Upload Document Modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docForm, setDocForm] = useState({
    projectId: '',
    title: '',
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projsRes, docsRes] = await Promise.all([
        api.get('/tasks?filter=my_tasks'),
        api.get('/projects'),
        api.get('/documents?limit=5')
      ]);

      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (projsRes.data.success) {
        setProjects(projsRes.data.projects);
        if (projsRes.data.projects.length > 0 && !issueForm.projectId) {
          setIssueForm((prev) => ({ ...prev, projectId: projsRes.data.projects[0]._id }));
          setDocForm((prev) => ({ ...prev, projectId: projsRes.data.projects[0]._id }));
        }
      }
      if (docsRes.data.success) setDocuments(docsRes.data.documents);
    } catch (err) {
      console.error('Failed to load member dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchData();
    }
  }, [currentWorkspace?._id]);

  // Quick Task Status Update
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      let progress = undefined;
      if (newStatus === 'completed') progress = 100;
      else if (newStatus === 'in_progress') progress = 50;
      else if (newStatus === 'todo') progress = 0;

      const res = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
        ...(progress !== undefined ? { progress } : {})
      });

      if (res.data.success) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  // Quick Task Progress Change
  const handleProgressChange = async (taskId, newProgress) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, {
        progress: Number(newProgress)
      });
      if (res.data.success) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
      }
    } catch (err) {
      alert('Failed to update progress');
    }
  };

  // Send Due Date Reminder Email to logged in member
  const handleSendMyDueEmail = async () => {
    try {
      setSendingReminder(true);
      const res = await api.post('/tasks/my-reminders/trigger');
      if (res.data.success) {
        setReminderToast(res.data.message || `Due date notification sent to ${user?.email}!`);
        setTimeout(() => setReminderToast(null), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send deadline email.');
    } finally {
      setSendingReminder(false);
    }
  };

  // Submit Issue
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.projectId || !issueForm.title.trim()) {
      alert('Please fill out the issue title and select a project.');
      return;
    }
    setSubmittingIssue(true);
    try {
      const res = await api.post('/issues', issueForm);
      if (res.data.success) {
        setIssueModalOpen(false);
        setIssueForm({
          projectId: projects[0]?._id || '',
          title: '',
          description: '',
          priority: 'high',
          category: 'blocker'
        });
        alert('Blocker / Issue reported successfully! Your manager has been notified.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit issue');
    } finally {
      setSubmittingIssue(false);
    }
  };

  // Upload Document
  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile || !docForm.projectId) {
      alert('Please select a file and project');
      return;
    }
    setUploadingDoc(true);
    try {
      const data = new FormData();
      data.append('file', docFile);
      data.append('projectId', docForm.projectId);
      if (docForm.title) data.append('title', docForm.title);
      if (docForm.description) data.append('description', docForm.description);

      const res = await api.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setDocuments((prev) => [res.data.document, ...prev]);
        setDocModalOpen(false);
        setDocFile(null);
        setDocForm({ projectId: projects[0]?._id || '', title: '', description: '' });
        alert('Document uploaded successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Computed metrics
  const totalMyTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
  );
  const dueSoonTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) >= now &&
      new Date(t.dueDate) <= in48Hours &&
      t.status !== 'completed'
  );

  // Filter tasks for display
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'completed') return t.status === 'completed';
    if (taskFilter === 'in_progress') return t.status === 'in_progress';
    if (taskFilter === 'overdue')
      return t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
    if (taskFilter === 'due_soon')
      return (
        t.dueDate &&
        new Date(t.dueDate) >= now &&
        new Date(t.dueDate) <= in48Hours &&
        t.status !== 'completed'
      );
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {reminderToast && (
        <div className="p-4 rounded-xl bg-emerald-500 text-white shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold">{reminderToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setReminderToast(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#4338CA] rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Member Workspace Portal
            </span>
            <span className="text-xs text-indigo-200 font-medium">
              {currentWorkspace?.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1.5">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/90 mt-0.5 max-w-xl">
            Here are your assigned deliverables, target deadlines, and collaboration tools. Update your status anytime to keep your team aligned.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={BellRing}
            loading={sendingReminder}
            onClick={handleSendMyDueEmail}
            title="Send an automated due date email to your inbox"
          >
            Send My Due Date Email
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={ShieldAlert}
            onClick={() => setIssueModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            Report Blocker / Issue
          </Button>
        </div>
      </div>

      {/* Prominent Due Date Alert Banner */}
      {overdueTasks.length > 0 ? (
        <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-200 dark:bg-rose-900/60 flex items-center justify-center shrink-0 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Action Required: {overdueTasks.length} Overdue Deliverable(s)
              </h3>
              <p className="text-xs mt-0.5 text-rose-700 dark:text-rose-400">
                Tasks such as <strong>"{overdueTasks[0]?.title}"</strong> have passed their due date. Please update your progress or mark them complete.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTaskFilter('overdue')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shrink-0 self-start sm:self-auto"
          >
            Review Overdue Tasks ({overdueTasks.length})
          </button>
        </div>
      ) : dueSoonTasks.length > 0 ? (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-200 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Upcoming Deadline: {dueSoonTasks.length} Deliverable(s) Due in 48 Hours
              </h3>
              <p className="text-xs mt-0.5 text-amber-700 dark:text-amber-400">
                Task <strong>"{dueSoonTasks[0]?.title}"</strong> is approaching its deadline.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTaskFilter('due_soon')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 shrink-0 self-start sm:self-auto"
          >
            View Upcoming Tasks
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">
            <strong>Great momentum!</strong> All of your assigned deliverables are currently on schedule. No overdue items.
          </p>
        </div>
      )}

      {/* Personal Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-indigo-500">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-[#667085] dark:text-[#9CA3AF] block font-medium">
              Assigned Tasks
            </span>
            <span className="text-lg font-bold text-[#172033] dark:text-[#F3F4F6]">
              {totalMyTasks}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-blue-500">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-[#667085] dark:text-[#9CA3AF] block font-medium">
              In Progress
            </span>
            <span className="text-lg font-bold text-[#172033] dark:text-[#F3F4F6]">
              {inProgressTasks.length}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-rose-500">
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-[#667085] dark:text-[#9CA3AF] block font-medium">
              Overdue Tasks
            </span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {overdueTasks.length}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-[#667085] dark:text-[#9CA3AF] block font-medium">
              Completed
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {completedTasks.length}
            </span>
          </div>
        </Card>
      </div>

      {/* Main Section: My Assigned Tasks with Direct Status Update */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E7EC] dark:border-[#374151] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#172033] dark:text-[#F3F4F6] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              My Assigned Deliverables & Deadlines
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
              Review deadlines and update status directly from your dashboard.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All (${tasks.length})` },
              { id: 'in_progress', label: `In Progress (${inProgressTasks.length})` },
              { id: 'due_soon', label: `Due Soon (${dueSoonTasks.length})` },
              { id: 'overdue', label: `Overdue (${overdueTasks.length})` },
              { id: 'completed', label: `Completed (${completedTasks.length})` }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTaskFilter(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  taskFilter === f.id
                    ? 'bg-[#4F46E5] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task Cards List */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={
              taskFilter === 'all'
                ? 'No tasks currently assigned to you'
                : `No tasks matching filter "${taskFilter}"`
            }
            description="When a Project Manager assigns tasks to you, they will appear here with target due dates and status options."
            actionLabel="View All Workspace Tasks"
            onAction={() => (window.location.href = '/tasks')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((t) => {
              const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
              const isDueSoon =
                t.dueDate &&
                new Date(t.dueDate) >= now &&
                new Date(t.dueDate) <= in48Hours &&
                t.status !== 'completed';

              const formattedDue = t.dueDate
                ? new Date(t.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'No deadline';

              return (
                <div
                  key={t._id}
                  className={`p-4 rounded-xl border transition-all ${
                    isOverdue
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                      : isDueSoon
                      ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20'
                      : 'border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827]'
                  } shadow-xs hover:shadow-md flex flex-col justify-between gap-3`}
                >
                  <div>
                    {/* Project & Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded truncate max-w-[200px]">
                        {t.project?.name || 'Project'}
                      </span>
                      <Badge variant={t.priority}>{t.priority}</Badge>
                    </div>

                    {/* Task Title */}
                    <h3 className="text-sm font-bold text-[#172033] dark:text-[#F3F4F6] line-clamp-2">
                      {t.title}
                    </h3>

                    {t.description && (
                      <p className="text-xs text-[#667085] dark:text-[#9CA3AF] line-clamp-2 mt-1">
                        {t.description}
                      </p>
                    )}

                    {/* Prominent Due Date */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
                      <Clock
                        className={`w-4 h-4 shrink-0 ${
                          isOverdue
                            ? 'text-rose-600 dark:text-rose-400'
                            : isDueSoon
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[#667085] dark:text-[#9CA3AF]'
                        }`}
                      />
                      <span
                        className={
                          isOverdue
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : isDueSoon
                            ? 'text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-[#667085] dark:text-[#9CA3AF]'
                        }
                      >
                        {isOverdue
                          ? `⚠️ Overdue (${formattedDue})`
                          : isDueSoon
                          ? `⏰ Due Soon (${formattedDue})`
                          : `Due: ${formattedDue}`}
                      </span>
                    </div>

                    {/* Progress Slider */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-[#667085] dark:text-[#9CA3AF]">
                        <span>Progress</span>
                        <span>{t.progress || 0}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[0, 25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleProgressChange(t._id, pct)}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                              (t.progress || 0) >= pct
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Status Changer Buttons */}
                  <div className="pt-3 border-t border-[#E4E7EC] dark:border-[#374151]/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-[#667085] dark:text-[#9CA3AF]">
                      Status:
                    </span>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'todo', label: 'To Do', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' },
                        { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100 hover:bg-blue-200 text-blue-800' },
                        { id: 'in_review', label: 'In Review', color: 'bg-amber-100 hover:bg-amber-200 text-amber-800' },
                        { id: 'completed', label: 'Completed', color: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800' }
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleStatusChange(t._id, st.id)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            t.status === st.id
                              ? 'ring-2 ring-indigo-500 font-extrabold ' + st.color
                              : 'opacity-60 hover:opacity-100 ' + st.color
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Two Column Layout: Quick Document Collaboration & Report Issue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Collaboration */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-[#172033] dark:text-[#F3F4F6]">
                Documents & Deliverables
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Upload}
              onClick={() => setDocModalOpen(true)}
            >
              Upload File
            </Button>
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
            Access shared project assets, specifications, and upload project deliverables.
          </p>

          {documents.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              No documents uploaded yet in this workspace.
            </div>
          ) : (
            <div className="space-y-2">
              {documents.slice(0, 4).map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {doc.title || doc.originalName}
                      </p>
                      <span className="text-[10px] text-gray-400">
                        {doc.project?.name || 'Workspace'} • {(doc.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  <a
                    href={`http://localhost:5000/api/documents/${doc._id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-right">
            <Link
              to="/documents"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              Browse all documents <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Quick Report Issue Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h3 className="text-sm font-bold text-[#172033] dark:text-[#F3F4F6]">
              Encountered a Blocker or Bug?
            </h3>
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
            As a team member, you can alert your Project Manager and workspace leads immediately when technical bugs, dependency blockers, or scope issues arise.
          </p>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 space-y-3">
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="font-bold text-rose-500">1.</span>
              <span>Report issues early to prevent delivery delays on milestones.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="font-bold text-rose-500">2.</span>
              <span>Attach severity: Critical (Blocker), High, Medium, or Low.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="font-bold text-rose-500">3.</span>
              <span>Your manager and team receive live notifications instantly.</span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <Link
              to="/issues"
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              View Active Issues
            </Link>
            <Button
              variant="primary"
              size="sm"
              icon={AlertCircle}
              onClick={() => setIssueModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Report Issue Now
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal: Report Issue */}
      <Modal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        title="Report Blocker or Issue"
      >
        <form onSubmit={handleCreateIssue} className="space-y-4">
          <Select
            label="Project"
            required
            value={issueForm.projectId}
            onChange={(e) => setIssueForm({ ...issueForm, projectId: e.target.value })}
            options={projects.map((p) => ({ value: p._id, label: `${p.projectCode} - ${p.name}` }))}
          />

          <Input
            label="Issue Title"
            required
            placeholder="e.g. API endpoint returning 500 error on checkout"
            value={issueForm.title}
            onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={issueForm.priority}
              onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
              options={[
                { value: 'critical', label: 'Critical (Blocker)' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
            />
            <Select
              label="Category"
              value={issueForm.category}
              onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}
              options={[
                { value: 'blocker', label: 'Blocker' },
                { value: 'bug', label: 'Bug' },
                { value: 'technical_debt', label: 'Technical Debt' },
                { value: 'risk', label: 'Project Risk' }
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172033] dark:text-[#F3F4F6] mb-1">
              Description & Reproduction Steps
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-[#172033] dark:text-[#F3F4F6] focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="Explain the problem and why it blocks your deliverables..."
              value={issueForm.description}
              onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submittingIssue}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Submit Blocker Issue
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Upload Document */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Upload Project Deliverable"
      >
        <form onSubmit={handleUploadDoc} className="space-y-4">
          <Select
            label="Project"
            required
            value={docForm.projectId}
            onChange={(e) => setDocForm({ ...docForm, projectId: e.target.value })}
            options={projects.map((p) => ({ value: p._id, label: `${p.projectCode} - ${p.name}` }))}
          />

          <Input
            label="Document Title"
            placeholder="e.g. Architecture Blueprint / Spec Sheet"
            value={docForm.title}
            onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
          />

          <div>
            <label className="block text-xs font-medium text-[#172033] dark:text-[#F3F4F6] mb-1">
              Select File
            </label>
            <input
              type="file"
              required
              onChange={(e) => setDocFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172033] dark:text-[#F3F4F6] mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-[#172033] dark:text-[#F3F4F6] focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="Brief note about the file..."
              value={docForm.description}
              onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setDocModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={uploadingDoc}>
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MemberDashboard;
