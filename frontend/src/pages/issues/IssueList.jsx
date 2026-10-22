import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { AlertCircle, Plus, Search, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const IssueList = () => {
  const { currentWorkspace, isViewer } = useWorkspace();

  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: 'high',
    category: 'blocker',
    assigneeId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        projectId: projectFilter
      });

      const [iRes, pRes] = await Promise.all([
        api.get(`/issues?${queryParams.toString()}`),
        api.get('/projects')
      ]);

      if (iRes.data.success) setIssues(iRes.data.issues);
      if (pRes.data.success) {
        setProjects(pRes.data.projects);
        if (pRes.data.projects.length > 0 && !formData.projectId) {
          setFormData((prev) => ({ ...prev, projectId: pRes.data.projects[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!currentWorkspace?._id) return;
    try {
      const res = await api.get(`/workspaces/${currentWorkspace._id}/members`);
      if (res.data.success) setMembers(res.data.members);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, priorityFilter, categoryFilter, projectFilter, currentWorkspace?._id]);

  useEffect(() => {
    fetchMembers();
  }, [currentWorkspace?._id]);

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!formData.projectId) {
      alert('Please select a project');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/issues', formData);
      if (res.data.success) {
        setIssues((prev) => [res.data.issue, ...prev]);
        setCreateModalOpen(false);
        setFormData({
          projectId: projects[0]?._id || '',
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

  const handleResolveIssue = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/issues/${selectedIssue._id}`, {
        status: 'resolved',
        resolutionNotes
      });
      if (res.data.success) {
        setIssues((prev) =>
          prev.map((i) => (i._id === selectedIssue._id ? res.data.issue : i))
        );
        setResolveModalOpen(false);
        setSelectedIssue(null);
        setResolutionNotes('');
      }
    } catch (err) {
      alert('Failed to resolve issue');
    } finally {
      setSubmitting(false);
    }
  };

  const criticalCount = issues.filter((i) => i.priority === 'critical' && i.status !== 'resolved').length;
  const highCount = issues.filter((i) => i.priority === 'high' && i.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
            Issues & Risk Management
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF]">
            Track blockers, technical debt, and schedule risks to prevent milestone slippage.
          </p>
        </div>

        {!isViewer && (
          <Button
            variant="danger"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Report Issue
          </Button>
        )}
      </div>

      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-rose-600">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Critical Blockers</span>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {criticalCount}
            </h3>
            <span className="text-[11px] text-gray-400">Immediate action required</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-orange-500">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">High-Severity Risks</span>
            <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-0.5">
              {highCount}
            </h3>
            <span className="text-[11px] text-gray-400">Monitored by leads</span>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Resolved Issues</span>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length}
            </h3>
            <span className="text-[11px] text-gray-400">Successfully closed</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search issues by title or description..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-36">
              <Select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map((p) => ({ value: p._id, label: p.name }))
                ]}
              />
            </div>

            <div className="w-32">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' }
                ]}
              />
            </div>

            <div className="w-32">
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Priority' },
                  { value: 'critical', label: 'Critical' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' }
                ]}
              />
            </div>

            <div className="w-32">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Category' },
                  { value: 'blocker', label: 'Blocker' },
                  { value: 'bug', label: 'Bug' },
                  { value: 'risk', label: 'Risk' },
                  { value: 'technical_debt', label: 'Tech Debt' },
                  { value: 'compliance', label: 'Compliance' }
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Issues Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : issues.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No issues found"
          description="Everything is running smoothly or no reported blockers match your current filters."
          actionLabel={!isViewer ? 'Report an Issue' : undefined}
          onAction={() => setCreateModalOpen(true)}
          actionIcon={Plus}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E7EC] dark:border-[#374151] bg-gray-50 dark:bg-[#1F2937]/50 text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
                  <th className="py-3 px-4">Issue Title</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
                {issues.map((issue) => (
                  <tr
                    key={issue._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-[#1F2937]/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <h4 className="font-semibold text-[#172033] dark:text-[#F3F4F6]">
                          {issue.title}
                        </h4>
                        {issue.description && (
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                            {issue.description}
                          </p>
                        )}
                        {issue.resolutionNotes && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            Resolution: {issue.resolutionNotes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-indigo-600 dark:text-indigo-400">
                      <Link to={`/projects/${issue.project?._id || issue.project}`} className="hover:underline">
                        {issue.project?.name || 'Project'}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={issue.priority}>{issue.priority}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={issue.category}>{issue.category}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={issue.status}>{issue.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-[#172033] dark:text-[#F3F4F6]">
                      {issue.assignee?.name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isViewer && issue.status !== 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setResolveModalOpen(true);
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE ISSUE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Report New Issue or Risk"
        subtitle="Catalog a blocker or delivery impediment."
      >
        <form onSubmit={handleCreateIssue} className="space-y-4">
          <Select
            label="Project"
            value={formData.projectId}
            options={projects.map((p) => ({ value: p._id, label: p.name }))}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            required
          />

          <Input
            label="Issue Title"
            placeholder="e.g. Memory leak in high-throughput ingress pods"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={formData.priority}
              options={[
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            />
            <Select
              label="Category"
              value={formData.category}
              options={[
                { value: 'blocker', label: 'Blocker' },
                { value: 'bug', label: 'Bug' },
                { value: 'risk', label: 'Risk' },
                { value: 'technical_debt', label: 'Technical Debt' },
                { value: 'compliance', label: 'Compliance' }
              ]}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <Select
            label="Assignee"
            value={formData.assigneeId}
            options={[
              { value: '', label: 'Unassigned' },
              ...members.map((m) => ({ value: m.userId, label: m.name }))
            ]}
            onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe symptoms, steps to reproduce, or timeline impact..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={submitting}>
              Submit Issue
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESOLVE ISSUE MODAL */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Resolve Issue"
        subtitle={`Marking "${selectedIssue?.title}" as resolved`}
      >
        <form onSubmit={handleResolveIssue} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Resolution Notes
            </label>
            <textarea
              rows={4}
              placeholder="Document the solution, patch version, or mitigation strategy implemented..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
              className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Confirm Resolution
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IssueList;
