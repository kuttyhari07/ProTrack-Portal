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
import { CardSkeleton } from '../../components/common/Skeleton';
import {
  Flag,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MilestonesTimeline = () => {
  const { isViewer } = useWorkspace();
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('all');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    dueDate: '',
    status: 'upcoming'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = selectedProject !== 'all' ? `?projectId=${selectedProject}` : '';
      const [mRes, pRes] = await Promise.all([
        api.get(`/milestones${query}`),
        api.get('/projects')
      ]);

      if (mRes.data.success) setMilestones(mRes.data.milestones);
      if (pRes.data.success) {
        setProjects(pRes.data.projects);
        if (pRes.data.projects.length > 0 && !formData.projectId) {
          setFormData((prev) => ({ ...prev, projectId: pRes.data.projects[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  const handleToggleComplete = async (milestone) => {
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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.projectId) {
      alert('Please select a project');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/milestones', formData);
      if (res.data.success) {
        setMilestones((prev) => [...prev, res.data.milestone]);
        setCreateModalOpen(false);
        setFormData({
          projectId: projects[0]?._id || '',
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

  const overdueCount = milestones.filter((m) => m.isOverdue).length;
  const completedCount = milestones.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
            Milestones & Project Roadmaps
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF]">
            Track high-level checkpoints, release dates, and critical delivery dependencies.
          </p>
        </div>

        {!isViewer && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Milestone
          </Button>
        )}
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Total Milestones</span>
            <h3 className="text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] mt-0.5">
              {milestones.length}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <Flag className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Achieved Checkpoints</span>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {completedCount}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Overdue Milestones</span>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {overdueCount}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Project Selector Filter */}
      <Card className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6]">
            Filter by Project:
          </span>
          <div className="w-64">
            <Select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              options={[
                { value: 'all', label: 'All Workspace Projects' },
                ...projects.map((p) => ({ value: p._id, label: p.name }))
              ]}
            />
          </div>
        </div>
        <span className="text-xs text-gray-400">
          Click any checkpoint node to toggle completion
        </span>
      </Card>

      {/* Visual Timeline View */}
      <Card className="p-6">
        {loading ? (
          <CardSkeleton />
        ) : milestones.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="No milestones found"
            description="Create milestone checkpoints to anchor deadlines and maintain alignment across teams."
            actionLabel={!isViewer ? 'Create Milestone' : undefined}
            onAction={() => setCreateModalOpen(true)}
            actionIcon={Plus}
          />
        ) : (
          <div className="relative border-l-2 border-indigo-200 dark:border-indigo-950 ml-6 space-y-8 py-4">
            {milestones.map((m) => {
              const isDone = m.status === 'completed';
              return (
                <div key={m._id} className="relative pl-8">
                  {/* Timeline Node */}
                  <button
                    type="button"
                    disabled={isViewer}
                    onClick={() => handleToggleComplete(m)}
                    className={`absolute -left-4 top-0.5 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : m.isOverdue
                        ? 'bg-rose-500 text-white ring-4 ring-rose-100 dark:ring-rose-950/50'
                        : 'bg-white dark:bg-[#111827] border-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    }`}
                    title="Toggle completion"
                  >
                    <Flag className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-base font-bold ${isDone ? 'line-through text-gray-400' : 'text-[#172033] dark:text-[#F3F4F6]'}`}>
                          {m.title}
                        </h3>
                        <Link
                          to={`/projects/${m.project?._id || m.project}`}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          ({m.project?.name || 'Project'})
                        </Link>
                      </div>
                      {m.description && (
                        <p className="mt-1 text-xs text-[#667085] dark:text-[#9CA3AF] max-w-2xl">
                          {m.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {m.isOverdue && (
                        <Badge variant="delayed">Overdue Target</Badge>
                      )}
                      <Badge variant={m.status}>{m.status}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                      <Calendar className="w-3.5 h-3.5" />
                      Target Date: {new Date(m.dueDate).toLocaleDateString()}
                    </span>
                    {m.completedAt && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Completed on {new Date(m.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* CREATE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Milestone"
        subtitle="Establish milestone targets for your project schedule."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Project"
            value={formData.projectId}
            options={projects.map((p) => ({ value: p._id, label: p.name }))}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            required
          />

          <Input
            label="Milestone Title"
            placeholder="e.g. Infrastructure Zero-Downtime Cutover"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MilestonesTimeline;
