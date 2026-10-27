import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';
import {
  FolderKanban,
  CheckSquare,
  Kanban,
  Flag,
  AlertCircle,
  FileText,
  Activity,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Download,
  Trash2,
  MessageSquare,
  Upload,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Edit2,
  FileDown,
  Printer
} from 'lucide-react';
import ProjectReportModal from '../../components/projects/ProjectReportModal';
import {
  downloadProjectReportPDF,
  downloadProjectReportDOC
} from '../../utils/projectReportGenerator';

const ProjectDetail = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const { user } = useAuth();
  const { currentWorkspace, isViewer, isOwnerOrAdmin, isManagerOrAdmin } = useWorkspace();

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    if (tabId === 'ai-insights' && !healthData) {
      fetchAIInsights();
    }
  };

  // Data per tab
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [issues, setIssues] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    assigneeId: ''
  });

  // Task Edit & Delete State
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [deleteTaskConfirmOpen, setDeleteTaskConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [taskEditForm, setTaskEditForm] = useState({
    id: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    assigneeId: '',
    progress: 0,
    labels: ''
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'upcoming'
  });

  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    priority: 'high',
    category: 'blocker',
    assigneeId: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileTitle, setFileTitle] = useState('');

  // Selected task drawer for viewing/adding comments
  const [activeTask, setActiveTask] = useState(null);
  const [newComment, setNewComment] = useState('');

  // Project Report Export State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // Permission: Project Manager, Workspace Admin, Owner or Project Creator
  const canDownloadReport =
    isManagerOrAdmin ||
    project?.owner?._id === user?._id ||
    project?.owner === user?._id ||
    ['admin', 'superadmin'].includes(user?.role);

  // AI & Health Insights State
  const [healthData, setHealthData] = useState(null);
  const [aiSummaryData, setAiSummaryData] = useState(null);
  const [riskInsightsData, setRiskInsightsData] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const fetchAIInsights = async () => {
    try {
      setLoadingAI(true);
      const [hRes, sRes, rRes] = await Promise.all([
        api.get(`/projects/${id}/health`),
        api.post(`/projects/${id}/ai-summary`),
        api.post(`/projects/${id}/ai-risk-insights`)
      ]);
      if (hRes.data.success) setHealthData(hRes.data.health);
      if (sRes.data.success) setAiSummaryData(sRes.data);
      if (rRes.data.success) setRiskInsightsData(rRes.data);
    } catch (err) {
      console.error('Failed to load AI/Health insights:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes, milesRes, issuesRes, docsRes, actRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}`),
        api.get(`/milestones?projectId=${id}`),
        api.get(`/issues?projectId=${id}`),
        api.get(`/documents?projectId=${id}`),
        api.get(`/workspaces/placeholder/activity?projectId=${id}`).catch(() => ({ data: { activities: [] } }))
      ]);

      if (projRes.data.success) setProject(projRes.data.project);
      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (milesRes.data.success) setMilestones(milesRes.data.milestones);
      if (issuesRes.data.success) setIssues(issuesRes.data.issues);
      if (docsRes.data.success) setDocuments(docsRes.data.documents);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchWorkspaceMembers = async () => {
    if (!currentWorkspace?._id) return;
    try {
      const res = await api.get(`/workspaces/${currentWorkspace._id}/members`);
      if (res.data.success) {
        setWorkspaceMembers(res.data.members || []);
      }
    } catch (err) {
      console.error('Failed to load workspace members:', err);
    }
  };

  useEffect(() => {
    fetchWorkspaceMembers();
  }, [currentWorkspace?._id]);

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...(workspaceMembers.length > 0
      ? workspaceMembers.map((m) => ({
          value: m.user?._id || m.userId || m.user,
          label: `${m.user?.name || m.name || 'Member'} (${m.role || 'Member'})`
        }))
      : [
          ...(project?.owner ? [{ value: project.owner._id || project.owner, label: `${project.owner.name || 'Project Lead'} (Owner)` }] : []),
          ...(project?.members || []).map((m) => ({
            value: m.user?._id || m.user,
            label: m.user?.name || 'Contributor'
          }))
        ])
  ];

  // Quick update task status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.task : t))
        );
        // Refresh project stats
        const pRes = await api.get(`/projects/${id}`);
        if (pRes.data.success) setProject(pRes.data.project);
      }
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  // Add Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/tasks', {
        ...taskForm,
        projectId: id
      });
      if (res.data.success) {
        setTasks((prev) => [...prev, res.data.task]);
        setTaskModalOpen(false);
        setTaskForm({
          title: '',
          description: '',
          priority: 'medium',
          status: 'todo',
          dueDate: '',
          assigneeId: ''
        });
        const pRes = await api.get(`/projects/${id}`);
        if (pRes.data.success) setProject(pRes.data.project);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditTask = (task) => {
    setTaskEditForm({
      id: task._id,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assigneeId: task.assignee?._id || task.assignee || '',
      progress: task.progress || 0,
      labels: Array.isArray(task.labels) ? task.labels.join(', ') : ''
    });
    setEditTaskModalOpen(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const labelsArray = taskEditForm.labels
        ? taskEditForm.labels.split(',').map((l) => l.trim()).filter(Boolean)
        : [];
      const res = await api.put(`/tasks/${taskEditForm.id}`, {
        title: taskEditForm.title,
        description: taskEditForm.description,
        priority: taskEditForm.priority,
        status: taskEditForm.status,
        dueDate: taskEditForm.dueDate || null,
        assigneeId: taskEditForm.assigneeId || null,
        progress: Number(taskEditForm.progress),
        labels: labelsArray
      });
      if (res.data.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskEditForm.id ? res.data.task : t))
        );
        if (activeTask?._id === taskEditForm.id) {
          setActiveTask(res.data.task);
        }
        setEditTaskModalOpen(false);
        const pRes = await api.get(`/projects/${id}`);
        if (pRes.data.success) setProject(pRes.data.project);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteTask = (task) => {
    setTaskToDelete(task);
    setDeleteTaskConfirmOpen(true);
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/tasks/${taskToDelete._id}`);
      if (res.data.success) {
        setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
        if (activeTask?._id === taskToDelete._id) {
          setActiveTask(null);
        }
        setDeleteTaskConfirmOpen(false);
        setTaskToDelete(null);
        const pRes = await api.get(`/projects/${id}`);
        if (pRes.data.success) setProject(pRes.data.project);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Milestone
  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/milestones', {
        ...milestoneForm,
        projectId: id
      });
      if (res.data.success) {
        setMilestones((prev) => [...prev, res.data.milestone]);
        setMilestoneModalOpen(false);
        setMilestoneForm({
          title: '',
          description: '',
          dueDate: '',
          status: 'upcoming'
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create milestone');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle milestone status
  const handleToggleMilestoneStatus = async (milestone) => {
    const nextStatus = milestone.status === 'completed' ? 'in_progress' : 'completed';
    try {
      const res = await api.put(`/milestones/${milestone._id}`, { status: nextStatus });
      if (res.data.success) {
        setMilestones((prev) =>
          prev.map((m) => (m._id === milestone._id ? res.data.milestone : m))
        );
      }
    } catch (err) {
      alert('Failed to update milestone');
    }
  };

  // Add Issue
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/issues', {
        ...issueForm,
        projectId: id
      });
      if (res.data.success) {
        setIssues((prev) => [res.data.issue, ...prev]);
        setIssueModalOpen(false);
        setIssueForm({
          title: '',
          description: '',
          priority: 'high',
          category: 'blocker',
          assigneeId: ''
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create issue');
    } finally {
      setSubmitting(false);
    }
  };

  // Resolve Issue
  const handleResolveIssue = async (issueId) => {
    try {
      const res = await api.put(`/issues/${issueId}`, { status: 'resolved' });
      if (res.data.success) {
        setIssues((prev) =>
          prev.map((i) => (i._id === issueId ? res.data.issue : i))
        );
      }
    } catch (err) {
      alert('Failed to resolve issue');
    }
  };

  // Upload Document
  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please choose a file');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('projectId', id);
      if (fileTitle) formData.append('title', fileTitle);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setDocuments((prev) => [res.data.document, ...prev]);
        setUploadModalOpen(false);
        setSelectedFile(null);
        setFileTitle('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Download Document
  const handleDownloadFile = async (docId, fileName) => {
    try {
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('File download failed');
    }
  };

  // Add Comment to active task
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTask) return;
    try {
      const res = await api.post(`/tasks/${activeTask._id}/comments`, { text: newComment.trim() });
      if (res.data.success) {
        const updatedTask = { ...activeTask, comments: res.data.comments };
        setActiveTask(updatedTask);
        setTasks((prev) => prev.map((t) => (t._id === activeTask._id ? updatedTask : t)));
        setNewComment('');
      }
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  // Quick Download PDF Report
  const handleQuickDownloadPDF = async () => {
    try {
      setDownloadingFormat('pdf');
      const res = await api.get(`/projects/${id}/report`);
      if (res.data.success) {
        downloadProjectReportPDF(res.data.report);
      }
    } catch (err) {
      console.warn('Fallback to local state for PDF export:', err);
      downloadProjectReportPDF({
        project,
        tasks,
        milestones,
        issues,
        workspace: currentWorkspace,
        generatedBy: { name: user?.name, role: user?.role },
        healthData,
        stats: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.status === 'completed').length,
          inProgressTasks: tasks.filter((t) => t.status === 'in_progress').length,
          inReviewTasks: tasks.filter((t) => t.status === 'in_review').length,
          todoTasks: tasks.filter((t) => t.status === 'todo').length,
          completionRate: project?.progress || 0
        }
      });
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Quick Download Word (DOC) Report
  const handleQuickDownloadDOC = async () => {
    try {
      setDownloadingFormat('doc');
      const res = await api.get(`/projects/${id}/report`);
      if (res.data.success) {
        downloadProjectReportDOC(res.data.report);
      }
    } catch (err) {
      console.warn('Fallback to local state for DOC export:', err);
      downloadProjectReportDOC({
        project,
        tasks,
        milestones,
        issues,
        workspace: currentWorkspace,
        generatedBy: { name: user?.name, role: user?.role },
        healthData,
        stats: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.status === 'completed').length,
          inProgressTasks: tasks.filter((t) => t.status === 'in_progress').length,
          inReviewTasks: tasks.filter((t) => t.status === 'in_review').length,
          todoTasks: tasks.filter((t) => t.status === 'todo').length,
          completionRate: project?.progress || 0
        }
      });
    } finally {
      setDownloadingFormat(null);
    }
  };

  if (loading && !project) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project not found"
        description="The project you are looking for may have been deleted or moved."
        actionLabel="Back to Projects"
        onAction={() => window.location.href = '/projects'}
      />
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FolderKanban },
    { id: 'tasks', name: `Tasks (${tasks.length})`, icon: CheckSquare },
    { id: 'board', name: 'Board', icon: Kanban },
    { id: 'milestones', name: `Milestones (${milestones.length})`, icon: Flag },
    { id: 'issues', name: `Issues (${issues.length})`, icon: AlertCircle },
    { id: 'files', name: `Files (${documents.length})`, icon: FileText },
    { id: 'ai-insights', name: 'Health & AI Insights', icon: Sparkles }
  ];

  const kanbanColumns = [
    { id: 'todo', title: 'To Do', color: 'border-t-gray-400' },
    { id: 'in_progress', title: 'In Progress', color: 'border-t-indigo-500' },
    { id: 'in_review', title: 'In Review', color: 'border-t-amber-500' },
    { id: 'completed', title: 'Completed', color: 'border-t-emerald-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#667085] dark:text-[#9CA3AF]">
        <Link to="/projects" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Projects
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-[#172033] dark:text-[#F3F4F6] truncate max-w-xs">
          {project.name}
        </span>
      </div>

      {/* Project Workspace Header Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                {project.projectCode}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
                {project.name}
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] max-w-2xl">
              {project.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={project.health} dot>
              {project.health.replace('_', ' ')}
            </Badge>
            <Badge variant={project.priority}>{project.priority}</Badge>
            <Badge variant={project.status}>{project.status}</Badge>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              ✓ ₹{project.paymentAmount || 499} Paid
            </span>

            {/* Project Report Export for Managers, Owners & Workspace Admins */}
            {canDownloadReport && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  onClick={handleQuickDownloadPDF}
                  disabled={downloadingFormat === 'pdf'}
                  className="bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold"
                  title="Download Project Status & Progress Intelligence Report (PDF)"
                >
                  {downloadingFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  icon={FileDown}
                  onClick={handleQuickDownloadDOC}
                  disabled={downloadingFormat === 'doc'}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-xs font-semibold"
                  title="Download Project Status & Progress Report (Word .doc)"
                >
                  {downloadingFormat === 'doc' ? 'Generating DOC...' : 'Download DOC'}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={Printer}
                  onClick={() => setReportModalOpen(true)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  title="Preview & Print Executive Report"
                >
                  Preview
                </Button>
              </div>
            )}

            {isManagerOrAdmin && (
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setTaskModalOpen(true)}
              >
                Add Task
              </Button>
            )}
          </div>
        </div>

        {/* Quick Progress Banner */}
        <div className="mt-6 pt-5 border-t border-[#E4E7EC] dark:border-[#374151] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#667085] dark:text-[#9CA3AF] block mb-1">Overall Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#172033] dark:text-[#F3F4F6]">
                {project.progress}%
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#4F46E5] h-1.5 rounded-full"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <span className="text-[#667085] dark:text-[#9CA3AF] block mb-1">Timeline Deadline</span>
            <div className="flex items-center gap-1.5 font-semibold text-[#172033] dark:text-[#F3F4F6]">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{new Date(project.dueDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div>
            <span className="text-[#667085] dark:text-[#9CA3AF] block mb-1">Project Lead</span>
            <span className="font-semibold text-[#172033] dark:text-[#F3F4F6]">
              {project.owner?.name || 'Assigned Lead'}
            </span>
          </div>

          <div>
            <span className="text-[#667085] dark:text-[#9CA3AF] block mb-1">Team Contributors</span>
            <div className="flex items-center -space-x-1">
              {project.members?.map((m, idx) => (
                <div
                  key={idx}
                  title={m.user?.name}
                  className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 ring-2 ring-white dark:ring-[#111827] flex items-center justify-center text-[9px] font-bold text-indigo-600 dark:text-indigo-300"
                >
                  {m.user?.name ? m.user.name.substring(0, 1) : 'U'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-[#E4E7EC] dark:border-[#374151]">
        <nav className="flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'border-[#4F46E5] text-[#4F46E5] dark:text-[#818CF8]'
                    : 'border-transparent text-[#667085] dark:text-[#9CA3AF] hover:text-[#172033] dark:hover:text-[#F3F4F6] hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Health Evaluation & Risk Factors */}
          {project.healthEvaluation?.factors?.length > 0 && (
            <Card className="p-5 border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
                    Automated Health Risk Analysis ({project.healthEvaluation.riskScore}/100 Risk Score)
                  </h4>
                  <ul className="mt-2 space-y-1 text-xs text-[#667085] dark:text-[#9CA3AF] list-disc list-inside">
                    {project.healthEvaluation.factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 md:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
                Initiative Scope & Details
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
                {project.description || 'No detailed scope written for this project.'}
              </p>

              <div>
                <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] uppercase tracking-wider mb-2">
                  Project Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags?.map((t, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
                Key Delivery Metrics
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#E4E7EC] dark:border-[#374151]">
                  <span className="text-[#667085] dark:text-[#9CA3AF]">Total Tasks</span>
                  <span className="font-bold text-[#172033] dark:text-[#F3F4F6]">{tasks.length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4E7EC] dark:border-[#374151]">
                  <span className="text-[#667085] dark:text-[#9CA3AF]">Completed Tasks</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {tasks.filter((t) => t.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4E7EC] dark:border-[#374151]">
                  <span className="text-[#667085] dark:text-[#9CA3AF]">Milestones</span>
                  <span className="font-bold text-[#172033] dark:text-[#F3F4F6]">{milestones.length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4E7EC] dark:border-[#374151]">
                  <span className="text-[#667085] dark:text-[#9CA3AF]">Active Blockers</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {issues.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#667085] dark:text-[#9CA3AF]">Uploaded Files</span>
                  <span className="font-bold text-[#172033] dark:text-[#F3F4F6]">{documents.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS TABLE */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] dark:text-[#9CA3AF]">
              Showing {tasks.length} task(s)
            </span>
            {isManagerOrAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setTaskModalOpen(true)}
              >
                New Task
              </Button>
            )}
          </div>

          <Card className="overflow-hidden">
            {tasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks in this project"
                description="Add tasks to assign responsibilities, track deadlines, and monitor work progress."
                actionLabel={isManagerOrAdmin ? 'Add Task' : undefined}
                onAction={() => setTaskModalOpen(true)}
                actionIcon={Plus}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E7EC] dark:border-[#374151] bg-gray-50 dark:bg-[#1F2937]/50 text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Task Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
                    {tasks.map((task) => (
                      <tr
                        key={task._id}
                        className="hover:bg-gray-50/50 dark:hover:bg-[#1F2937]/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-gray-400">
                          #{task.taskNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F3F4F6]">
                          <button
                            type="button"
                            onClick={() => setActiveTask(task)}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 text-left"
                          >
                            {task.title}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={task.status}
                            disabled={isViewer}
                            onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                            className="bg-transparent border border-[#E4E7EC] dark:border-[#374151] rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={task.priority}>{task.priority}</Badge>
                        </td>
                        <td className="py-3 px-4 text-[#172033] dark:text-[#F3F4F6]">
                          {task.assignee?.name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4 text-[#667085] dark:text-[#9CA3AF]">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveTask(task)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                              title="Task details & comments"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            {!isViewer && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTask(task)}
                                  className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors"
                                  title="Edit task"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteTask(task)}
                                  className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                  title="Delete task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: KANBAN BOARD */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`bg-gray-100/70 dark:bg-[#111827]/70 rounded-[14px] p-3.5 border-t-4 ${col.color} border border-[#E4E7EC] dark:border-[#374151] min-h-[420px] flex flex-col`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-[#374151] mb-3">
                  <span className="text-xs font-bold text-[#172033] dark:text-[#F3F4F6] uppercase tracking-wider">
                    {col.title}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-[#1F2937] text-gray-600 dark:text-gray-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <Card
                        key={task._id}
                        onClick={() => setActiveTask(task)}
                        hover
                        className="p-3.5 text-xs shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-gray-400">#{task.taskNumber}</span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={task.priority}>{task.priority}</Badge>
                            {!isViewer && (
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditTask(task);
                                  }}
                                  className="p-1 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  title="Edit task"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDeleteTask(task);
                                  }}
                                  className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  title="Delete task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <h4 className="font-semibold text-[#172033] dark:text-[#F3F4F6] line-clamp-2">
                          {task.title}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] text-[#667085] dark:text-[#9CA3AF] pt-2 border-t border-gray-100 dark:border-gray-800">
                          <span>{task.assignee?.name || 'Unassigned'}</span>
                          {task.comments?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {task.comments.length}
                            </span>
                          )}
                        </div>

                        {/* Quick move column buttons */}
                        {!isViewer && (
                          <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 text-[10px]">
                            {col.id !== 'todo' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const prevMap = { completed: 'in_review', in_review: 'in_progress', in_progress: 'todo' };
                                  handleUpdateTaskStatus(task._id, prevMap[col.id]);
                                }}
                                className="text-gray-400 hover:text-indigo-600"
                              >
                                ← Move back
                              </button>
                            )}
                            {col.id !== 'completed' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextMap = { todo: 'in_progress', in_progress: 'in_review', in_review: 'completed' };
                                  handleUpdateTaskStatus(task._id, nextMap[col.id]);
                                }}
                                className="text-indigo-600 dark:text-indigo-400 font-medium ml-auto"
                              >
                                Move next →
                              </button>
                            )}
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] dark:text-[#9CA3AF]">
              Project Timeline Milestones ({milestones.length})
            </span>
            {!isViewer && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setMilestoneModalOpen(true)}
              >
                Add Milestone
              </Button>
            )}
          </div>

          <Card className="p-5">
            {milestones.length === 0 ? (
              <EmptyState
                icon={Flag}
                title="No milestones defined"
                description="Milestones represent major delivery checkpoints for your project schedule."
                actionLabel={!isViewer ? 'Add Milestone' : undefined}
                onAction={() => setMilestoneModalOpen(true)}
                actionIcon={Plus}
              />
            ) : (
              <div className="relative border-l-2 border-[#E4E7EC] dark:border-[#374151] ml-4 space-y-6 py-2">
                {milestones.map((milestone) => {
                  const isCompleted = milestone.status === 'completed';
                  return (
                    <div key={milestone._id} className="relative pl-6">
                      {/* Checkpoint icon node */}
                      <button
                        type="button"
                        disabled={isViewer}
                        onClick={() => handleToggleMilestoneStatus(milestone)}
                        className={`absolute -left-3 top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : milestone.isOverdue
                            ? 'bg-rose-500 text-white'
                            : 'bg-white dark:bg-[#111827] border-2 border-indigo-500 text-indigo-500'
                        }`}
                        title="Click to toggle milestone completion"
                      >
                        <Flag className="w-3 h-3" />
                      </button>

                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-semibold ${isCompleted ? 'line-through text-gray-400' : 'text-[#172033] dark:text-[#F3F4F6]'}`}>
                          {milestone.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          {milestone.isOverdue && (
                            <Badge variant="delayed">Overdue</Badge>
                          )}
                          <Badge variant={milestone.status}>{milestone.status}</Badge>
                        </div>
                      </div>

                      {milestone.description && (
                        <p className="mt-1 text-xs text-[#667085] dark:text-[#9CA3AF]">
                          {milestone.description}
                        </p>
                      )}

                      <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Target: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                        {milestone.completedAt && (
                          <span>• Completed {new Date(milestone.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 5: ISSUES & RISKS */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] dark:text-[#9CA3AF]">
              Reported Blockers & Issues ({issues.length})
            </span>
            {!isViewer && (
              <Button
                variant="danger"
                size="sm"
                icon={Plus}
                onClick={() => setIssueModalOpen(true)}
              >
                Log Issue
              </Button>
            )}
          </div>

          <Card className="overflow-hidden">
            {issues.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="Zero blockers reported"
                description="No active issues logged for this project."
              />
            ) : (
              <div className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
                {issues.map((issue) => (
                  <div key={issue._id} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
                          {issue.title}
                        </h4>
                        <Badge variant={issue.priority}>{issue.priority}</Badge>
                        <Badge variant={issue.category}>{issue.category}</Badge>
                      </div>
                      <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
                        {issue.description}
                      </p>
                      {issue.resolutionNotes && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Resolution: {issue.resolutionNotes}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                        <span>Assignee: {issue.assignee?.name || 'Unassigned'}</span>
                        <span>• Status: {issue.status}</span>
                      </div>
                    </div>

                    {!isViewer && issue.status !== 'resolved' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResolveIssue(issue._id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 6: FILES */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085] dark:text-[#9CA3AF]">
              Attached Project Documents ({documents.length})
            </span>
            {!isViewer && (
              <Button
                variant="primary"
                size="sm"
                icon={Upload}
                onClick={() => setUploadModalOpen(true)}
              >
                Upload Document
              </Button>
            )}
          </div>

          <Card className="p-5">
            {documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents uploaded"
                description="Upload technical specs, architecture diagrams, and release documents."
                actionLabel={!isViewer ? 'Upload File' : undefined}
                onAction={() => setUploadModalOpen(true)}
                actionIcon={Upload}
              />
            ) : (
              <div className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
                {documents.map((doc) => (
                  <div key={doc._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-[#4F46E5]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] truncate">
                          {doc.title}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate">
                          {doc.originalName} • {(doc.size / 1024).toFixed(1)} KB • Uploaded by {doc.uploader?.name || 'Team member'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Download}
                        onClick={() => handleDownloadFile(doc._id, doc.originalName)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 7: AI & HEALTH INSIGHTS */}
      {activeTab === 'ai-insights' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#172033] dark:text-[#F3F4F6] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Project Health & AI Intelligence</span>
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
                Deterministic risk scoring, transparent early warnings, and verified executive summaries.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Sparkles}
              loading={loadingAI}
              onClick={fetchAIInsights}
            >
              Regenerate Analysis
            </Button>
          </div>

          {/* Project Health Diagnostic Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-1 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                Current Project Health
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant={healthData?.health || project.health} dot>
                  {(healthData?.health || project.health).replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-xs text-gray-500 font-medium">
                  Risk Score: {healthData?.riskScore ?? 0}/100
                </span>
              </div>

              {/* Risk Score Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (healthData?.riskScore ?? 0) >= 45
                        ? 'bg-rose-500'
                        : (healthData?.riskScore ?? 0) >= 20
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, healthData?.riskScore ?? 10)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                  <span>0 (Low Risk)</span>
                  <span>50 (Moderate)</span>
                  <span>100 (Severe)</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs space-y-2 border border-gray-100 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-[11px] uppercase tracking-wide">
                  Health Diagnosis:
                </p>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-xs leading-relaxed">
                  {healthData?.healthSummary || 'Project timeline and milestones are performing in alignment with targets.'}
                </p>
              </div>
            </Card>

            {/* Diagnostic Reasons / Factors */}
            <Card className="p-6 lg:col-span-2 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                Underlying Data Factors & Warnings
              </h4>

              {healthData?.factors?.length > 0 ? (
                <div className="space-y-2.5">
                  {healthData.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Optimal pace: Zero overdue tasks, no critical issues, and progress matches elapsed schedule.</span>
                </div>
              )}
            </Card>
          </div>

          {/* AI Project Executive Summary */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-[#374151] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-[#F3F4F6]">
                  Executive Project Summary
                </h4>
              </div>
              <span className="text-[10px] text-gray-400">
                Source: {aiSummaryData?.source || 'Verified Project Intelligence Engine'}
              </span>
            </div>

            <div className="text-xs text-[#475467] dark:text-[#CBD5E1] whitespace-pre-line leading-relaxed font-sans">
              {aiSummaryData?.summary || 'Click "Regenerate Analysis" above to generate an executive intelligence summary of current deliverables and progress.'}
            </div>
          </Card>

          {/* Actionable Risk Mitigation Insights */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E4E7EC] dark:border-[#374151] pb-3">
              <Activity className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-[#F3F4F6]">
                Identified Schedule Risks & Suggested Actions
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskInsightsData?.insights?.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700/70 bg-white dark:bg-gray-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#172033] dark:text-[#F3F4F6]">
                      {item.title}
                    </span>
                    <Badge variant={item.severity === 'critical' ? 'urgent' : item.severity === 'high' ? 'high' : 'medium'}>
                      {item.severity}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    <strong>Reason:</strong> {item.reason}
                  </p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-1 border-t border-gray-100 dark:border-gray-700">
                    <strong>Recommendation:</strong> {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Create New Task"
        subtitle={`Adding deliverable to ${project.name}`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            placeholder="e.g. Implement OIDC token exchange"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide technical requirements, acceptance criteria, or context..."
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={taskForm.priority}
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
            />
            <Select
              label="Status"
              value={taskForm.status}
              options={[
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'in_review', label: 'In Review' },
                { value: 'completed', label: 'Completed' }
              ]}
              onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assignee"
              value={taskForm.assigneeId}
              options={assigneeOptions}
              onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT TASK MODAL */}
      <Modal
        isOpen={editTaskModalOpen}
        onClose={() => setEditTaskModalOpen(false)}
        title="Edit Task"
        subtitle="Modify title, description, priority, assignee, and schedule."
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <Input
            label="Task Title"
            value={taskEditForm.title}
            onChange={(e) => setTaskEditForm({ ...taskEditForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={taskEditForm.description}
              onChange={(e) => setTaskEditForm({ ...taskEditForm, description: e.target.value })}
              className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={taskEditForm.priority}
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
              onChange={(e) => setTaskEditForm({ ...taskEditForm, priority: e.target.value })}
            />
            <Select
              label="Assignee"
              value={taskEditForm.assigneeId}
              options={assigneeOptions}
              onChange={(e) => setTaskEditForm({ ...taskEditForm, assigneeId: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              value={taskEditForm.status}
              options={[
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'in_review', label: 'In Review' },
                { value: 'completed', label: 'Completed' }
              ]}
              onChange={(e) => setTaskEditForm({ ...taskEditForm, status: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={taskEditForm.dueDate}
              onChange={(e) => setTaskEditForm({ ...taskEditForm, dueDate: e.target.value })}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                Progress Percentage
              </label>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {taskEditForm.progress}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={taskEditForm.progress}
              onChange={(e) => setTaskEditForm({ ...taskEditForm, progress: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <Input
            label="Tags / Labels (comma-separated)"
            placeholder="Frontend, Bug, High-Priority"
            value={taskEditForm.labels}
            onChange={(e) => setTaskEditForm({ ...taskEditForm, labels: e.target.value })}
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" type="button" onClick={() => setEditTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE TASK CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteTaskConfirmOpen}
        onClose={() => setDeleteTaskConfirmOpen(false)}
        title="Delete Task"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#667085] dark:text-[#9CA3AF]">
            Are you sure you want to delete task{' '}
            <strong className="text-gray-900 dark:text-white">
              #{taskToDelete?.taskNumber}: {taskToDelete?.title}
            </strong>
            ? This action cannot be undone and will delete all task history and comments.
          </p>

          <div className="pt-3 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" type="button" onClick={() => setDeleteTaskConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={submitting}
              onClick={handleConfirmDeleteTask}
            >
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>

      {/* CREATE MILESTONE MODAL */}
      <Modal
        isOpen={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        title="Add Project Milestone"
        subtitle="Define a key scheduling checkpoint."
      >
        <form onSubmit={handleCreateMilestone} className="space-y-4">
          <Input
            label="Milestone Title"
            placeholder="e.g. Beta Release & Audit Completion"
            value={milestoneForm.title}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={milestoneForm.description}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
              className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <Input
            label="Target Date"
            type="date"
            value={milestoneForm.dueDate}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
            required
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" onClick={() => setMilestoneModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Save Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE ISSUE MODAL */}
      <Modal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        title="Log Issue / Risk"
        subtitle="Document a risk factor or blocker preventing project completion."
      >
        <form onSubmit={handleCreateIssue} className="space-y-4">
          <Input
            label="Issue Title"
            placeholder="e.g. Latency timeout during multi-region cutover"
            value={issueForm.title}
            onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={issueForm.priority}
              options={[
                { value: 'critical', label: 'Critical Blocker' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
              onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
            />
            <Select
              label="Category"
              value={issueForm.category}
              options={[
                { value: 'blocker', label: 'Blocker' },
                { value: 'bug', label: 'Bug' },
                { value: 'risk', label: 'Risk' },
                { value: 'technical_debt', label: 'Technical Debt' },
                { value: 'compliance', label: 'Compliance' }
              ]}
              onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe symptoms, reproduction, or risk impact..."
              value={issueForm.description}
              onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
              className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" onClick={() => setIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={submitting}>
              Log Blocker
            </Button>
          </div>
        </form>
      </Modal>

      {/* UPLOAD FILE MODAL */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Project File"
        subtitle="Attach specs, documents, or data sheets (up to 25MB)."
      >
        <form onSubmit={handleUploadFile} className="space-y-4">
          <Input
            label="Document Title"
            placeholder="e.g. Architecture Blueprint v2"
            value={fileTitle}
            onChange={(e) => setFileTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Choose File
            </label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="block w-full text-xs text-[#667085] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950/60 dark:file:text-indigo-300"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Upload
            </Button>
          </div>
        </form>
      </Modal>

      {/* ACTIVE TASK COMMENTS & DETAILS MODAL */}
      {activeTask && (
        <Modal
          isOpen={!!activeTask}
          onClose={() => setActiveTask(null)}
          title={`#${activeTask.taskNumber}: ${activeTask.title}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={activeTask.status}>{activeTask.status}</Badge>
                <Badge variant={activeTask.priority}>{activeTask.priority}</Badge>
                {activeTask.dueDate && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Due {new Date(activeTask.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              {!isViewer && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEditTask(activeTask)}
                  >
                    Edit Task
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleOpenDeleteTask(activeTask)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF]">
              {activeTask.description || 'No description provided.'}
            </p>

            <div className="pt-4 border-t border-[#E4E7EC] dark:border-[#374151]">
              <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] uppercase tracking-wider mb-3">
                Comments ({activeTask.comments?.length || 0})
              </h4>

              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {activeTask.comments?.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#172033] dark:text-[#F3F4F6]">
                      <span>{c.user?.name || 'Teammate'}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-1 text-[#667085] dark:text-[#9CA3AF]">{c.text}</p>
                  </div>
                ))}
              </div>

              {!isViewer && (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-xs text-[#172033] dark:text-[#F3F4F6] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Button type="submit" variant="primary" size="sm">
                    Post
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Executive Project Report Modal */}
      <ProjectReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        projectId={id}
        initialProjectData={{
          project,
          tasks,
          milestones,
          issues,
          workspace: currentWorkspace,
          generatedBy: { name: user?.name, role: currentWorkspace?.role || user?.role },
          healthData,
          stats: {
            totalTasks: tasks.length,
            completedTasks: tasks.filter((t) => t.status === 'completed').length,
            inProgressTasks: tasks.filter((t) => t.status === 'in_progress').length,
            inReviewTasks: tasks.filter((t) => t.status === 'in_review').length,
            todoTasks: tasks.filter((t) => t.status === 'todo').length,
            completionRate: project?.progress || 0
          }
        }}
      />
    </div>
  );
};

export default ProjectDetail;
