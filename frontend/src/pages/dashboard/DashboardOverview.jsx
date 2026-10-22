import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Activity,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import MemberDashboard from './MemberDashboard';

const DashboardOverview = () => {
  const { user } = useAuth();
  const { currentWorkspace, isManagerOrAdmin } = useWorkspace();

  // If logged in as Member or Viewer, display dedicated Member Task & Delivery Portal (No workspace analytics)
  if (!isManagerOrAdmin) {
    return <MemberDashboard />;
  }

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [automationData, setAutomationData] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [activities, setActivities] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reportRes, autoRes, projRes, taskRes, actRes] = await Promise.all([
        api.get('/reports/workspace'),
        api.get('/automation/insights'),
        api.get('/projects?limit=5&sortBy=updatedAt&order=desc'),
        api.get('/tasks?filter=my_tasks&limit=6'),
        api.get(`/workspaces/${currentWorkspace?._id}/activity?limit=6`)
      ]);

      if (reportRes.data.success) setReportData(reportRes.data);
      if (autoRes.data.success) setAutomationData(autoRes.data.data);
      if (projRes.data.success) setRecentProjects(projRes.data.projects);
      if (taskRes.data.success) setMyTasks(taskRes.data.tasks);
      if (actRes.data.success) setActivities(actRes.data.activities);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchDashboardData();
    }
  }, [currentWorkspace?._id]);

  if (loading && !reportData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const metrics = reportData?.metrics || {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    atRiskProjects: 0,
    todoTasks: 0,
    overdueTasks: 0
  };

  const chartData = reportData?.charts || {
    taskStatus: [],
    taskPriority: [],
    projectProgress: []
  };

  const topInsight = automationData?.recommendations?.[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
            Workspace Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-0.5">
            Welcome back, {user?.name}. Here is what's happening in{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {currentWorkspace?.name}
            </span>.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/projects">
            <Button variant="primary" icon={FolderKanban} size="sm">
              Manage Projects
            </Button>
          </Link>
          <Link to="/tasks">
            <Button variant="outline" size="sm">
              View Tasks
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Metric Cards (6 core metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Projects"
          value={metrics.totalProjects}
          icon={FolderKanban}
          iconBg="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
          subtext="In workspace"
        />
        <StatCard
          title="Active Projects"
          value={metrics.activeProjects}
          icon={Activity}
          iconBg="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
          subtext="In progress"
        />
        <StatCard
          title="Completed"
          value={metrics.completedProjects}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
          subtext={`${metrics.totalProjects > 0 ? Math.round((metrics.completedProjects / metrics.totalProjects) * 100) : 0}% delivery rate`}
        />
        <StatCard
          title="At-Risk Projects"
          value={metrics.atRiskProjects}
          icon={AlertTriangle}
          iconBg="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
          trend={metrics.atRiskProjects > 0 ? 'Requires attention' : 'Healthy pace'}
          trendType={metrics.atRiskProjects > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="My Open Tasks"
          value={myTasks.filter((t) => t.status !== 'completed').length}
          icon={Clock}
          iconBg="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
          subtext="Assigned to me"
        />
        <StatCard
          title="Overdue Tasks"
          value={metrics.overdueTasks}
          icon={AlertCircle}
          iconBg="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
          trend={metrics.overdueTasks > 0 ? 'Behind schedule' : 'Zero backlog'}
          trendType={metrics.overdueTasks > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Task & Workflow Status Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-[#E4E7EC] dark:border-[#374151] text-xs shadow-xs">
        <div>
          <span className="text-[#667085] dark:text-[#9CA3AF] block text-[11px] font-medium uppercase tracking-wider">Total Tasks</span>
          <span className="font-bold text-base text-[#172033] dark:text-[#F3F4F6]">{metrics.totalTasks || 0}</span>
        </div>
        <div>
          <span className="text-[#667085] dark:text-[#9CA3AF] block text-[11px] font-medium uppercase tracking-wider">In Progress</span>
          <span className="font-bold text-base text-indigo-600 dark:text-indigo-400">{metrics.inProgressTasks || 0}</span>
        </div>
        <div>
          <span className="text-[#667085] dark:text-[#9CA3AF] block text-[11px] font-medium uppercase tracking-wider">Pending (To Do)</span>
          <span className="font-bold text-base text-gray-500">{metrics.todoTasks || 0}</span>
        </div>
        <div>
          <span className="text-[#667085] dark:text-[#9CA3AF] block text-[11px] font-medium uppercase tracking-wider">Delivery Rate</span>
          <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">{metrics.taskCompletionRate || 0}%</span>
        </div>
        <div>
          <span className="text-[#667085] dark:text-[#9CA3AF] block text-[11px] font-medium uppercase tracking-wider">Unresolved Issues</span>
          <span className={`font-bold text-base ${(metrics.criticalIssues || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {metrics.openIssues || 0} {metrics.criticalIssues > 0 && <span className="text-[10px] font-normal text-rose-500">({metrics.criticalIssues} critical)</span>}
          </span>
        </div>
      </div>

      {/* 2. Smart Project Insights Notification Banner */}
      {topInsight && (
        <Card className={`p-4 border-l-4 ${
          topInsight.type === 'error'
            ? 'border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
            : topInsight.type === 'warning'
            ? 'border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/20'
            : 'border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Rule-Based Automation Engine
                  </span>
                  <span className="text-[11px] text-gray-400">• {topInsight.category}</span>
                </div>
                <h4 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6] mt-0.5">
                  {topInsight.title}
                </h4>
                <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                  {topInsight.description}
                </p>
              </div>
            </div>
            <Link to={topInsight.actionRoute || '/automation'} className="shrink-0">
              <Button variant="secondary" size="sm" icon={ArrowRight}>
                {topInsight.actionLabel || 'View Insights'}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Velocity / Progress Comparison */}
        <Card className="lg:col-span-2 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
                Project Progress & Execution
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
                Completion percentage across key active workspace initiatives
              </p>
            </div>
            <Link to="/reports" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Full Analytics <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            {chartData.projectProgress.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No active projects to visualize yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.projectProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="code" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#374151',
                      borderRadius: '8px',
                      color: '#F3F4F6',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`${val}%`, 'Progress']}
                  />
                  <Bar dataKey="progress" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Task Status Distribution Donut Chart */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
              Task Status Distribution
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
              Current workflow state of all tasks
            </p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.taskStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.taskStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#E4E7EC] dark:border-[#374151] pt-3">
            {chartData.taskStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[#667085] dark:text-[#9CA3AF] truncate">{item.name}:</span>
                <span className="font-semibold text-[#172033] dark:text-[#F3F4F6]">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Active Projects & My Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Updated Projects */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
              Active Projects
            </h3>
            <Link to="/projects" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              View All ({recentProjects.length})
            </Link>
          </div>

          <div className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
            {recentProjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No active projects found.
              </div>
            ) : (
              recentProjects.map((project) => (
                <div key={project._id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                        {project.projectCode}
                      </span>
                      <Link
                        to={`/projects/${project._id}`}
                        className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6] hover:text-[#4F46E5] dark:hover:text-[#818CF8] truncate"
                      >
                        {project.name}
                      </Link>
                    </div>
                    <Badge variant={project.health}>{project.health.replace('_', ' ')}</Badge>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-[#667085] dark:text-[#9CA3AF]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
                    </div>
                    <span className="font-medium text-[#172033] dark:text-[#F3F4F6]">
                      {project.progress}% Complete
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
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
                </div>
              ))
            )}
          </div>
        </Card>

        {/* My Tasks */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
              Assigned to Me
            </h3>
            <Link to="/tasks?filter=my_tasks" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              View All ({myTasks.length})
            </Link>
          </div>

          <div className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
            {myTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                You currently have no tasks assigned.
              </div>
            ) : (
              myTasks.map((task) => (
                <div key={task._id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">#{task.taskNumber}</span>
                      <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] truncate">
                        {task.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#667085] dark:text-[#9CA3AF]">
                      <span>{task.project?.name}</span>
                      {task.dueDate && (
                        <span>• Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={task.priority}>{task.priority}</Badge>
                    <Badge variant={task.status}>{task.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 5. Workspace Activity & Critical Issues Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workspace Activity Stream */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
              Recent Activity
            </h3>
            <span className="text-xs text-gray-400">Real-time audit log</span>
          </div>

          <div className="space-y-3.5">
            {activities.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                No recent actions recorded.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act._id} className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[10px] text-gray-600 dark:text-gray-300 shrink-0 mt-0.5">
                    {act.user?.name ? act.user.name.substring(0, 1) : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#172033] dark:text-[#F3F4F6]">
                      <span className="font-semibold">{act.user?.name || 'User'}</span>{' '}
                      <span className="text-gray-500">{act.action}</span>{' '}
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        {act.entityTitle || act.entityType}
                      </span>
                    </p>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Issues Requiring Immediate Attention */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
              Blockers & Critical Risks
            </h3>
            <Link to="/issues" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              All Issues
            </Link>
          </div>

          <div className="space-y-3">
            {!automationData?.criticalIssues?.length ? (
              <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ No unresolved critical blockers in this workspace.
              </div>
            ) : (
              automationData.criticalIssues.map((issue) => (
                <div
                  key={issue._id}
                  className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-red-900 dark:text-red-300 truncate">
                      {issue.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Project: {issue.project?.name} • Assigned: {issue.assignee?.name || 'Unassigned'}
                    </p>
                  </div>
                  <Badge variant={issue.priority}>{issue.priority}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
