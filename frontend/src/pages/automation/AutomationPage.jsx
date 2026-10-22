import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';

const AutomationPage = () => {
  const { isManagerOrAdmin } = useWorkspace();

  if (!isManagerOrAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await api.get('/automation/insights');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      const res = await api.post('/automation/run');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      alert('Failed to execute scan');
    } finally {
      setScanning(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const recommendations = data?.recommendations || [];
  const overdueTasks = data?.overdueTasks || [];
  const upcomingTasks = data?.upcomingTasks || [];
  const criticalIssues = data?.criticalIssues || [];
  const atRiskProjects = data?.atRiskProjects || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
              Smart Automation & Risk Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-1">
            Rule-based intelligence that monitors project pacing, detects bottlenecks, and suggests corrective actions.
          </p>
        </div>

        <Button
          variant="primary"
          icon={RefreshCw}
          loading={scanning}
          onClick={handleTriggerScan}
        >
          Run Workspace Scan
        </Button>
      </div>

      {/* Rules Architecture Banner */}
      <Card className="p-5 bg-gradient-to-r from-indigo-50/50 to-teal-50/30 dark:from-indigo-950/20 dark:to-teal-950/10 border-indigo-200 dark:border-indigo-900/40">
        <div className="flex items-start gap-3">
          <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h3 className="font-semibold text-[#172033] dark:text-[#F3F4F6]">
              Deterministic Policy-Driven Monitoring
            </h3>
            <p className="text-[#667085] dark:text-[#9CA3AF]">
              ProTrack evaluates project health using calculated rules: pacing gaps (schedule elapsed vs progress), active critical blockers, approaching 48h deadlines, and overdue milestone slips.
            </p>
          </div>
        </div>
      </Card>

      {/* Recommended Action Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
          Active Automation Findings ({recommendations.length})
        </h2>

        {recommendations.map((rec, idx) => (
          <Card
            key={idx}
            className={`p-4 border-l-4 ${
              rec.type === 'error'
                ? 'border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                : rec.type === 'warning'
                ? 'border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/20'
                : rec.type === 'info'
                ? 'border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                : 'border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 sm:mt-0 ${
                    rec.type === 'error'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      : rec.type === 'warning'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                      : rec.type === 'info'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  }`}
                >
                  {rec.type === 'error' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : rec.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : rec.type === 'info' ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {rec.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172033] dark:text-[#F3F4F6] mt-0.5">
                    {rec.title}
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                    {rec.description}
                  </p>
                </div>
              </div>

              {rec.actionRoute && (
                <Link to={rec.actionRoute} className="shrink-0">
                  <Button variant="secondary" size="sm" icon={ArrowRight}>
                    {rec.actionLabel}
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Grid of Rule Triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks Detected */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6] flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              Overdue Deliverables ({overdueTasks.length})
            </h3>
            <Link to="/tasks?filter=overdue" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              View Tasks
            </Link>
          </div>

          <div className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
            {overdueTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ No overdue tasks in this workspace.
              </div>
            ) : (
              overdueTasks.map((task) => (
                <div key={task._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[#172033] dark:text-[#F3F4F6] truncate">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {task.project?.name} • Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={task.priority}>{task.priority}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Critical Issues Detected */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Critical Blocker Risks ({criticalIssues.length})
            </h3>
            <Link to="/issues?priority=critical" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              View Issues
            </Link>
          </div>

          <div className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
            {criticalIssues.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Zero critical blockers active.
              </div>
            ) : (
              criticalIssues.map((issue) => (
                <div key={issue._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-rose-900 dark:text-rose-300 truncate">
                      {issue.title}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {issue.project?.name} • Assigned: {issue.assignee?.name || 'Unassigned'}
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

export default AutomationPage;
