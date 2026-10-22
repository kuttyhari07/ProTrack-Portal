import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { CardSkeleton } from '../../components/common/Skeleton';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  FileSpreadsheet
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
  Cell,
  Legend
} from 'recharts';

import { useWorkspace } from '../../context/WorkspaceContext';
import { Navigate } from 'react-router-dom';

const ReportsAnalytics = () => {
  const { isManagerOrAdmin } = useWorkspace();

  if (!isManagerOrAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const query = selectedProject !== 'all' ? `?projectId=${selectedProject}` : '';
      const [rRes, pRes] = await Promise.all([
        api.get(`/reports/workspace${query}`),
        api.get('/projects')
      ]);

      if (rRes.data.success) setData(rRes.data);
      if (pRes.data.success) setProjects(pRes.data.projects);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedProject]);

  const handleExportCSV = async (type = 'tasks') => {
    try {
      const query = selectedProject !== 'all' ? `&projectId=${selectedProject}` : '';
      const res = await api.get(`/reports/export-csv?type=${type}${query}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `protrack_${type}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
            Executive Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF]">
            Comprehensive delivery telemetry, workload distribution, and schedule health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => handleExportCSV('projects')}
          >
            Export Projects CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={() => handleExportCSV('tasks')}
          >
            Export Tasks CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6]">
            Scope Report:
          </span>
          <div className="w-64">
            <Select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              options={[
                { value: 'all', label: 'All Projects (Aggregate)' },
                ...projects.map((p) => ({ value: p._id, label: p.name }))
              ]}
            />
          </div>
        </div>
        <span className="text-xs text-gray-400">
          Generated in real-time from active workspace records
        </span>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
            Task Completion Rate
          </span>
          <h3 className="text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] mt-1">
            {metrics.taskCompletionRate}%
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {metrics.completedTasks} of {metrics.totalTasks} tasks closed
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
            Overdue Tasks
          </span>
          <h3 className={`text-2xl font-bold mt-1 ${metrics.overdueTasks > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {metrics.overdueTasks}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {metrics.overdueTasks > 0 ? 'Past deadline' : 'Zero overdue items'}
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
            Milestone Achievement
          </span>
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.milestoneRate}%
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {metrics.completedMilestones} of {metrics.totalMilestones} checkpoints
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
            Issue Resolution Ratio
          </span>
          <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {metrics.issueResolutionRate}%
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {metrics.resolvedIssues} resolved / {metrics.openIssues} active
          </p>
        </Card>
      </div>

      {/* Visual Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress Comparison */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6] mb-1">
            Project Completion Benchmark
          </h3>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mb-4">
            Progress percentages across key initiatives
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.projectProgress || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          </div>
        </Card>

        {/* Task Priority Breakdown */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6] mb-1">
            Task Volume by Priority
          </h3>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mb-4">
            Distribution of deliverables by urgency level
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.taskPriority || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#0D9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Team Workload Distribution Table */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6] mb-1">
          Team Member Workload Distribution
        </h3>
        <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mb-4">
          Allocated tasks, delivery velocity, and overdue items per contributor
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E4E7EC] dark:border-[#374151] bg-gray-50 dark:bg-[#1F2937]/50 text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
                <th className="py-2.5 px-4">Contributor</th>
                <th className="py-2.5 px-4">Assigned Tasks</th>
                <th className="py-2.5 px-4">Completed</th>
                <th className="py-2.5 px-4">Overdue</th>
                <th className="py-2.5 px-4">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
              {(charts.teamWorkload || []).map((member, idx) => {
                const rate = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-[#1F2937]/30">
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F3F4F6]">
                      {member.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{member.total}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {member.completed}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600 dark:text-rose-400 font-semibold">
                      {member.overdue}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-medium">{rate}%</span>
                        <div className="w-20 bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#4F46E5] h-1.5 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ReportsAnalytics;
