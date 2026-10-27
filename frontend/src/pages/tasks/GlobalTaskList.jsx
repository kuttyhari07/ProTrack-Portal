import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
import { TableSkeleton } from '../../components/common/Skeleton';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Kanban,
  List as ListIcon,
  Calendar,
  MessageSquare,
  AlertCircle,
  Clock,
  Trash2,
  CheckCircle2,
  BellRing,
  Edit2
} from 'lucide-react';

const GlobalTaskList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'all';

  const { user } = useAuth();
  const { currentWorkspace, isViewer, isManagerOrAdmin } = useWorkspace();

  const [triggeringReminders, setTriggeringReminders] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // View & Filter states
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'board'
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [taskForm, setTaskForm] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    assigneeId: ''
  });

  // Edit & Delete Task State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [taskEditForm, setTaskEditForm] = useState({
    id: '',
    projectId: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    assigneeId: '',
    progress: 0,
    labels: ''
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search,
        projectId: selectedProject,
        status: statusFilter,
        priority: priorityFilter,
        filter: currentFilter
      });

      const [tasksRes, projsRes] = await Promise.all([
        api.get(`/tasks?${queryParams.toString()}`),
        api.get('/projects')
      ]);

      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (projsRes.data.success) {
        setProjects(projsRes.data.projects);
        if (projsRes.data.projects.length > 0 && !taskForm.projectId) {
          setTaskForm((prev) => ({ ...prev, projectId: projsRes.data.projects[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
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
    fetchTasks();
  }, [search, selectedProject, statusFilter, priorityFilter, currentFilter, currentWorkspace?._id]);

  useEffect(() => {
    fetchMembers();
  }, [currentWorkspace?._id]);

  const handleUpdateStatus = async (taskId, newStatus, newProgress) => {
    try {
      const payload = { status: newStatus };
      if (newProgress !== undefined) payload.progress = newProgress;
      const res = await api.patch(`/tasks/${taskId}/status`, payload);
      if (res.data.success) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
        if (activeTask?._id === taskId) {
          setActiveTask(res.data.task);
        }
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleTriggerReminders = async () => {
    setTriggeringReminders(true);
    try {
      const res = await api.post('/tasks/reminders/trigger');
      if (res.data.success) {
        alert(res.data.message || 'Due date reminder emails and in-app notifications sent.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch due date reminders.');
    } finally {
      setTriggeringReminders(false);
    }
  };

  const handleTriggerMyReminders = async () => {
    setTriggeringReminders(true);
    try {
      const res = await api.post('/tasks/my-reminders/trigger');
      if (res.data.success) {
        alert(res.data.message || 'Due date reminder email sent to your inbox!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send your due date reminders.');
    } finally {
      setTriggeringReminders(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.projectId) {
      alert('Please select a project');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/tasks', taskForm);
      if (res.data.success) {
        setTasks((prev) => [res.data.task, ...prev]);
        setCreateModalOpen(false);
        setTaskForm({
          projectId: projects[0]?._id || '',
          title: '',
          description: '',
          priority: 'medium',
          status: 'todo',
          dueDate: '',
          assigneeId: ''
        });
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
      projectId: task.project?._id || task.project,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assigneeId: task.assignee?._id || task.assignee || '',
      progress: task.progress || 0,
      labels: Array.isArray(task.labels) ? task.labels.join(', ') : ''
    });
    setEditModalOpen(true);
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
        setEditModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteTask = (task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
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
        setDeleteConfirmOpen(false);
        setTaskToDelete(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTask) return;
    try {
      const res = await api.post(`/tasks/${activeTask._id}/comments`, { text: newComment.trim() });
      if (res.data.success) {
        const updated = { ...activeTask, comments: res.data.comments };
        setActiveTask(updated);
        setTasks((prev) => prev.map((t) => (t._id === activeTask._id ? updated : t)));
        setNewComment('');
      }
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const kanbanColumns = [
    { id: 'todo', title: 'To Do', color: 'border-t-gray-400' },
    { id: 'in_progress', title: 'In Progress', color: 'border-t-indigo-500' },
    { id: 'in_review', title: 'In Review', color: 'border-t-amber-500' },
    { id: 'completed', title: 'Completed', color: 'border-t-emerald-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
            Tasks & Workflow
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF]">
            Track assignments, priorities, deadlines, and delivery status across all workspace projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManagerOrAdmin ? (
            <>
              <Button
                variant="outline"
                icon={BellRing}
                loading={triggeringReminders}
                onClick={handleTriggerReminders}
                title="Send deadline reminders to assigned members via email & in-app"
              >
                Send Due Reminders
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setCreateModalOpen(true)}
              >
                Create Task
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              icon={BellRing}
              loading={triggeringReminders}
              onClick={handleTriggerMyReminders}
              title="Send my task deadline reminders to my email"
            >
              Send My Due Reminders
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filter Pill Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentFilter === 'all'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] text-[#667085] dark:text-[#9CA3AF] hover:text-[#172033] dark:hover:text-[#F3F4F6]'
          }`}
        >
          All Tasks
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ filter: 'my_tasks' })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentFilter === 'my_tasks'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] text-[#667085] dark:text-[#9CA3AF] hover:text-[#172033] dark:hover:text-[#F3F4F6]'
          }`}
        >
          Assigned to Me
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ filter: 'overdue' })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentFilter === 'overdue'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] text-[#667085] dark:text-[#9CA3AF] hover:text-[#172033] dark:hover:text-[#F3F4F6]'
          }`}
        >
          Overdue Tasks
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ filter: 'upcoming' })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentFilter === 'upcoming'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] text-[#667085] dark:text-[#9CA3AF] hover:text-[#172033] dark:hover:text-[#F3F4F6]'
          }`}
        >
          Upcoming (Next 7 Days)
        </button>
      </div>

      {/* Filter and View Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search tasks by title or keyword..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-40">
              <Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
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
                  { value: 'todo', label: 'To Do' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'in_review', label: 'In Review' },
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

            {/* View Mode Toggle */}
            <div className="flex items-center border border-[#E4E7EC] dark:border-[#374151] rounded-lg p-0.5 bg-gray-50 dark:bg-gray-800">
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
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Kanban Board View"
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Task Content */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found matching criteria"
          description="Try clearing your filters or create a new task to get work moving."
          actionLabel={!isViewer ? 'Create Task' : undefined}
          onAction={() => setCreateModalOpen(true)}
          actionIcon={Plus}
        />
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E7EC] dark:border-[#374151] bg-gray-50 dark:bg-[#1F2937]/50 text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
                {tasks.map((task) => (
                  <tr
                    key={task._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-[#1F2937]/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-gray-400">#{task.taskNumber}</td>
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F3F4F6]">
                      <button
                        type="button"
                        onClick={() => setActiveTask(task)}
                        className="hover:text-[#4F46E5] dark:hover:text-[#818CF8] text-left truncate max-w-sm"
                      >
                        {task.title}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/projects/${task.project?._id || task.project}`}
                        className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {task.project?.name || 'Project'}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={task.status}
                        disabled={isViewer}
                        onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
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
                          className="p-1.5 text-gray-400 hover:text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                          title="View comments & discussion"
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
        </Card>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`bg-gray-100/70 dark:bg-[#111827]/70 rounded-[14px] p-3.5 border-t-4 ${col.color} border border-[#E4E7EC] dark:border-[#374151] min-h-[460px] flex flex-col`}
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
                  {colTasks.map((task) => (
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

                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="truncate max-w-[120px] font-medium text-indigo-600 dark:text-indigo-400">
                          {task.project?.name}
                        </span>
                        <span>{task.assignee?.name || 'Unassigned'}</span>
                      </div>

                      {!isViewer && (
                        <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 text-[10px]">
                          {col.id !== 'todo' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const prevMap = { completed: 'in_review', in_review: 'in_progress', in_progress: 'todo' };
                                handleUpdateStatus(task._id, prevMap[col.id]);
                              }}
                              className="text-gray-400 hover:text-indigo-600"
                            >
                              ← Move
                            </button>
                          )}
                          {col.id !== 'completed' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextMap = { todo: 'in_progress', in_progress: 'in_review', in_review: 'completed' };
                                handleUpdateStatus(task._id, nextMap[col.id]);
                              }}
                              className="text-indigo-600 dark:text-indigo-400 font-medium ml-auto"
                            >
                              Advance →
                            </button>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Task"
        subtitle="Assign deliverables and deadlines across your projects."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Select
            label="Project"
            value={taskForm.projectId}
            options={projects.map((p) => ({ value: p._id, label: p.name }))}
            onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
            required
          />

          <Input
            label="Task Title"
            placeholder="e.g. Implement webhook dispatch engine"
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
              label="Assignee"
              value={taskForm.assigneeId}
              options={[
                { value: '', label: 'Unassigned' },
                ...members.map((m) => ({ value: m.userId, label: m.name }))
              ]}
              onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
            <Select
              label="Initial Status"
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

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
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
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Task"
        subtitle="Update deliverables, schedule, priority, and assignees."
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
              options={[
                { value: '', label: 'Unassigned' },
                ...members.map((m) => ({ value: m.userId, label: m.name }))
              ]}
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
                Completion Progress
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
            <Button variant="outline" type="button" onClick={() => setEditModalOpen(false)}>
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
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Task"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#667085] dark:text-[#9CA3AF]">
            Are you sure you want to delete task{' '}
            <strong className="text-gray-900 dark:text-white">
              #{taskToDelete?.taskNumber}: {taskToDelete?.title}
            </strong>
            ? This action cannot be undone and will remove all associated comments and tracking data.
          </p>

          <div className="pt-3 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" type="button" onClick={() => setDeleteConfirmOpen(false)}>
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

      {/* TASK COMMENTS & DRAWER MODAL */}
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
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {activeTask.project?.name}
                </span>
                {activeTask.dueDate && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Due: {new Date(activeTask.dueDate).toLocaleDateString()}
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

            {/* Status & Progress Controller for Team Member */}
            {!isViewer && (
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Update Task Status
                    </label>
                    <select
                      value={activeTask.status}
                      onChange={(e) => handleUpdateStatus(activeTask._id, e.target.value, e.target.value === 'completed' ? 100 : undefined)}
                      className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Progress
                      </label>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {activeTask.progress || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={activeTask.progress || 0}
                      onChange={(e) => handleUpdateStatus(activeTask._id, undefined, Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF]">
              {activeTask.description || 'No detailed instructions provided.'}
            </p>

            <div className="pt-4 border-t border-[#E4E7EC] dark:border-[#374151]">
              <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] uppercase tracking-wider mb-3">
                Discussion & Comments ({activeTask.comments?.length || 0})
              </h4>

              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {activeTask.comments?.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#172033] dark:text-[#F3F4F6]">
                      <span>{c.user?.name || 'Contributor'}</span>
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
                    placeholder="Add a comment to this task..."
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
    </div>
  );
};

export default GlobalTaskList;
