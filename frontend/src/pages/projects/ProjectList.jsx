import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { initiateProjectPayment } from '../../services/paymentService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';
import {
  FolderKanban,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  Users,
  Archive,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  CreditCard,
  Receipt,
  CheckCircle2,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

const ProjectList = () => {
  const { currentWorkspace, isViewer, isOwnerOrAdmin, isManagerOrAdmin } = useWorkspace();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals & Payment State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [projectFee, setProjectFee] = useState(499);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [billingHistoryOpen, setBillingHistoryOpen] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingBilling, setLoadingBilling] = useState(false);

  // Form State
  const [newProject, setNewProject] = useState({
    name: '',
    projectCode: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    status: 'active',
    tags: ''
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search,
        status: statusFilter,
        priority: priorityFilter,
        health: healthFilter,
        sortBy,
        order
      });

      const res = await api.get(`/projects?${queryParams.toString()}`);
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!currentWorkspace?._id) return;
    try {
      const res = await api.get(`/workspaces/${currentWorkspace._id}/members`);
      if (res.data.success) {
        setMembers(res.data.members);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, priorityFilter, healthFilter, sortBy, order, currentWorkspace?._id]);

  useEffect(() => {
    fetchMembers();
  }, [currentWorkspace?._id]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/payments/config');
        if (res.data.success && res.data.feeInr) {
          setProjectFee(res.data.feeInr);
        }
      } catch (err) {
        console.error('Failed to load payment config:', err);
      }
    };
    fetchConfig();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      setLoadingBilling(true);
      const res = await api.get('/payments/history');
      if (res.data.success) {
        setBillingHistory(res.data.payments);
      }
    } catch (err) {
      console.error('Failed to load billing history:', err);
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      alert('Project title is required');
      return;
    }
    if (!newProject.dueDate) {
      alert('Due date is required');
      return;
    }

    setSubmitting(true);
    try {
      const tagsArray = newProject.tags
        ? newProject.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const projectData = {
        ...newProject,
        tags: tagsArray
      };

      // Initiate Razorpay Payment & Project Verification
      await initiateProjectPayment({
        projectData,
        user,
        onSuccess: (verifyData) => {
          setSubmitting(false);
          setProjects((prev) => [verifyData.project, ...prev]);
          setCreateModalOpen(false);
          setPaymentSuccessData(verifyData);
          setReceiptModalOpen(true);
          setNewProject({
            name: '',
            projectCode: '',
            description: '',
            startDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'medium',
            status: 'active',
            tags: ''
          });
        },
        onError: (err) => {
          setSubmitting(false);
          alert(err.message || 'Payment transaction failed. Project creation cancelled.');
        },
        onModalDismiss: () => {
          setSubmitting(false);
        }
      });
    } catch (err) {
      setSubmitting(false);
      alert(err.message || 'Error initiating payment');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/projects/${projectToDelete._id}`);
      if (res.data.success) {
        setProjects((prev) => prev.filter((p) => p._id !== projectToDelete._id));
        setDeleteConfirmOpen(false);
        setProjectToDelete(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleArchive = async (id) => {
    try {
      const res = await api.patch(`/projects/${id}/archive`);
      if (res.data.success) {
        fetchProjects();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle archive');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF]">
            Plan, execute, and monitor progress across all initiatives in this workspace.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            icon={Receipt}
            onClick={() => {
              fetchBillingHistory();
              setBillingHistoryOpen(true);
            }}
            title="View Razorpay project receipts and billing transactions"
          >
            Billing & Invoices
          </Button>

          {isManagerOrAdmin && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Project (₹{projectFee})
            </Button>
          )}
        </div>
      </div>

      {/* Filter and View Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search by name, code, or description..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-32">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'planning', label: 'Planning' },
                  { value: 'on_hold', label: 'On Hold' },
                  { value: 'completed', label: 'Completed' }
                ]}
              />
            </div>

            <div className="w-32">
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Priority' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' }
                ]}
              />
            </div>

            <div className="w-32">
              <Select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Health' },
                  { value: 'on_track', label: 'On Track' },
                  { value: 'at_risk', label: 'At Risk' },
                  { value: 'delayed', label: 'Delayed' },
                  { value: 'completed', label: 'Completed' }
                ]}
              />
            </div>

            <div className="w-36">
              <Select
                value={`${sortBy}-${order}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-');
                  setSortBy(field);
                  setOrder(dir);
                }}
                options={[
                  { value: 'createdAt-desc', label: 'Newest First' },
                  { value: 'dueDate-asc', label: 'Due Date' },
                  { value: 'progress-desc', label: 'Progress (%)' },
                  { value: 'name-asc', label: 'Name (A-Z)' }
                ]}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-[#E4E7EC] dark:border-[#374151] rounded-lg p-0.5 bg-gray-50 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Table View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Projects Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Get started by creating your team's first project to organize tasks, deadlines, and milestones."
          actionLabel={!isViewer ? 'Create First Project' : undefined}
          onAction={() => setCreateModalOpen(true)}
          actionIcon={Plus}
        />
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Card
              key={project._id}
              className="p-5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                    {project.projectCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3 h-3" />
                      ₹{project.paymentAmount || 499} Paid
                    </span>
                    <Badge variant={project.health} dot>
                      {project.health.replace('_', ' ')}
                    </Badge>
                    <Badge variant={project.priority}>{project.priority}</Badge>
                  </div>
                </div>

                <Link to={`/projects/${project._id}`} className="block mt-3">
                  <h3 className="text-base font-semibold text-[#172033] dark:text-[#F3F4F6] group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8] transition-colors truncate">
                    {project.name}
                  </h3>
                </Link>

                <p className="mt-1 text-xs text-[#667085] dark:text-[#9CA3AF] line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>

                {/* Tags */}
                {project.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="text-[10px] text-gray-400 font-medium self-center">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-[#E4E7EC] dark:border-[#374151]">
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#667085] dark:text-[#9CA3AF]">Progress</span>
                  <span className="font-bold text-[#172033] dark:text-[#F3F4F6]">
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      project.health === 'delayed'
                        ? 'bg-rose-500'
                        : project.health === 'at_risk'
                        ? 'bg-amber-500'
                        : 'bg-[#4F46E5]'
                    }`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                {/* Footer details: Due date & team avatars */}
                <div className="mt-4 flex items-center justify-between text-xs text-[#667085] dark:text-[#9CA3AF]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center -space-x-1.5">
                    {project.members?.slice(0, 3).map((m, idx) => (
                      <div
                        key={idx}
                        title={m.user?.name}
                        className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 ring-2 ring-white dark:ring-[#111827] flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-200 uppercase"
                      >
                        {m.user?.name ? m.user.name.substring(0, 1) : 'U'}
                      </div>
                    ))}
                    {project.members?.length > 3 && (
                      <span className="text-[10px] pl-2 font-medium">
                        +{project.members.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions row for Admins */}
                {isOwnerOrAdmin && (
                  <div className="mt-3 pt-2 flex items-center justify-end gap-1 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(project._id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                      title={project.isArchived ? 'Restore' : 'Archive'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProjectToDelete(project);
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E4E7EC] dark:border-[#374151] bg-gray-50 dark:bg-[#1F2937]/50 text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Owner</th>
                  {isOwnerOrAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
                {projects.map((project) => (
                  <tr
                    key={project._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-[#1F2937]/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {project.projectCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F3F4F6]">
                      <Link
                        to={`/projects/${project._id}`}
                        className="hover:text-[#4F46E5] dark:hover:text-[#818CF8]"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={project.health} dot>
                        {project.health.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={project.priority}>{project.priority}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-medium">{project.progress}%</span>
                        <div className="w-16 bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#4F46E5] h-1.5 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#667085] dark:text-[#9CA3AF]">
                      {new Date(project.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-[#172033] dark:text-[#F3F4F6]">
                      {project.owner?.name || 'Lead'}
                    </td>
                    {isOwnerOrAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setProjectToDelete(project);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Project"
        subtitle="Establish project scope, targets, and assign milestones."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Project Title"
                placeholder="e.g. NextGen Microservices Platform"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Input
                label="Project Code"
                placeholder="e.g. PRJ-200"
                value={newProject.projectCode}
                onChange={(e) => setNewProject({ ...newProject, projectCode: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Outline project objectives, deliverables, and technical criteria..."
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={newProject.startDate}
              onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={newProject.dueDate}
              onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={newProject.priority}
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
              onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
            />
            <Select
              label="Initial Status"
              value={newProject.status}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'planning', label: 'Planning' },
                { value: 'on_hold', label: 'On Hold' }
              ]}
              onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
            />
          </div>

          <Input
            label="Tags (comma-separated)"
            placeholder="Infrastructure, Security, Q3-Roadmap"
            value={newProject.tags}
            onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
          />

          {/* Razorpay Project Activation & Licensing Fee Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    Project Creation & Activation Fee
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      Razorpay
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    One-time payment required to allocate workspace project quota
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  ₹{projectFee}
                </span>
                <span className="text-[10px] text-gray-400 block -mt-1 font-medium">INR (One-Time)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Unlimited Tasks & Milestones</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Automated Health & Telemetry</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Cloud File Deliverables</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>256-bit Razorpay Security</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button
              variant="outline"
              type="button"
              onClick={() => setCreateModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              icon={CreditCard}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md px-5"
            >
              Pay ₹{projectFee} via Razorpay & Launch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Success & Project Receipt Modal */}
      {paymentSuccessData && (
        <Modal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          title="Payment Verified & Project Launched!"
          subtitle="Your Razorpay transaction was completed successfully."
          maxWidth="max-w-md"
        >
          <div className="text-center py-3 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-75">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-extrabold">
                Transaction Successful
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {paymentSuccessData.project?.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Project Code: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{paymentSuccessData.project?.projectCode}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid:</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{paymentSuccessData.payment?.amount || projectFee}.00 INR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Razorpay Payment ID:</span>
                <span className="font-mono text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{paymentSuccessData.payment?.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Gateway:</span>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">Razorpay Secure</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date & Time:</span>
                <span className="text-gray-700 dark:text-gray-300">{new Date().toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReceiptModalOpen(false)}
              >
                Close
              </Button>
              <Link
                to={`/projects/${paymentSuccessData.project?._id}`}
                className="flex-1"
              >
                <Button
                  variant="primary"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  icon={ExternalLink}
                >
                  Open Workspace
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* Billing & Payment Invoices History Modal */}
      <Modal
        isOpen={billingHistoryOpen}
        onClose={() => setBillingHistoryOpen(false)}
        title="Workspace Billing & Payment Invoices"
        subtitle="Review all paid project creation fees and Razorpay transactions."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {loadingBilling ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Loading payment receipts...
            </div>
          ) : billingHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No payment transactions found in this workspace yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E7EC] dark:border-[#374151] text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Razorpay ID</th>
                    <th className="py-2.5 px-3">Paid By</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
                  {billingHistory.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                        {p.project?.name || p.projectData?.name || 'Project'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{p.amount}.00
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-500 text-[11px]">
                        {p.razorpayPaymentId || 'pay_verified'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                        {p.user?.name || 'Admin'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          PAID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-3 border-t border-[#E4E7EC] dark:border-[#374151] flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBillingHistoryOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteProject}
        title={`Delete Project "${projectToDelete?.name}"?`}
        message="This will permanently delete this project and all its associated tasks, milestones, issues, and files. This action cannot be reversed."
        confirmLabel="Permanently Delete"
        loading={submitting}
      />
    </div>
  );
};

export default ProjectList;
