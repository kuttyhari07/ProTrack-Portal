import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowDownToLine,
  FileDown
} from 'lucide-react';
import {
  downloadProjectReportPDF,
  downloadProjectReportDOC,
  extractReportData
} from '../../utils/projectReportGenerator';

const ProjectReportModal = ({
  isOpen,
  onClose,
  projectId,
  initialProjectData = null
}) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const fetchReport = async () => {
    if (!projectId && !initialProjectData?.project?._id) return;
    const targetId = projectId || initialProjectData.project._id;

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/projects/${targetId}/report`);
      if (res.data.success) {
        setReportData(res.data.report);
      }
    } catch (err) {
      console.warn('Failed to fetch from /report endpoint, using fallback data if available', err);
      if (initialProjectData) {
        setReportData(initialProjectData);
      } else {
        setError(err.response?.data?.message || 'Failed to generate project report. You must be a Project Manager, Workspace Admin, or Project Owner.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialProjectData && (!projectId || initialProjectData.project?._id === projectId)) {
        setReportData(initialProjectData);
      }
      fetchReport();
    } else {
      setReportData(null);
      setError(null);
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    if (!reportData) return;
    try {
      setDownloadingFormat('pdf');
      downloadProjectReportPDF(reportData);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadDOC = () => {
    if (!reportData) return;
    try {
      setDownloadingFormat('doc');
      downloadProjectReportDOC(reportData);
    } catch (err) {
      console.error('DOC generation error:', err);
      alert('Failed to generate Word document. Please try again.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const data = reportData ? extractReportData(reportData) : null;
  const project = data?.project;
  const stats = data?.stats;
  const tasks = data?.tasks || [];
  const milestones = data?.milestones || [];
  const issues = data?.issues || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Executive Project Report"
      subtitle="Comprehensive project overview, status diagnostics, and progress intelligence"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* ACTION BAR: DOWNLOAD BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-indigo-900 dark:text-indigo-200">
              Export format for Project Managers, Owners & Workspace Admins:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleDownloadPDF}
              disabled={loading || !reportData || downloadingFormat === 'pdf'}
            >
              {downloadingFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={FileDown}
              onClick={handleDownloadDOC}
              disabled={loading || !reportData || downloadingFormat === 'doc'}
              className="bg-white dark:bg-gray-800"
            >
              {downloadingFormat === 'doc' ? 'Generating DOC...' : 'Download Word (.doc)'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              disabled={loading || !reportData}
              className="text-gray-600 dark:text-gray-300"
            >
              Print
            </Button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && !reportData && (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Generating project diagnostics and progress report...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to load report</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* REPORT PREVIEW BODY */}
        {data && project && (
          <div className="print-area space-y-6 max-h-[65vh] overflow-y-auto pr-1">
            {/* REPORT HEADER SUMMARY */}
            <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      {project.projectCode}
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {project.name}
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                    {project.description || 'No detailed description specified.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                  <Badge variant={project.health} dot>
                    {(project.health || 'on_track').replace('_', ' ')}
                  </Badge>
                  <Badge variant={project.priority}>{project.priority}</Badge>
                  <Badge variant={project.status}>{project.status}</Badge>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <span>Execution Completion</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stats.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              {/* STATS 4-GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 block">Total Tasks</span>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">{stats.totalTasks}</div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {stats.completedTasks} completed
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 block">Active Work</span>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                    {stats.inProgressTasks + stats.inReviewTasks}
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    {stats.inProgressTasks} in progress
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 block">Overdue Tasks</span>
                  <div className={`text-lg font-bold mt-0.5 ${stats.overdueTasksCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {stats.overdueTasksCount}
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {stats.overdueTasksCount > 0 ? 'Action required' : 'Deadlines healthy'}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 block">Open Blockers</span>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                    {issues.filter(i => i.status !== 'closed').length}
                  </div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                    {milestones.length} milestones
                  </span>
                </div>
              </div>

              {/* TIMELINE & LEAD INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Target Due: <strong>{new Date(project.dueDate).toLocaleDateString()}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span>Lead: <strong>{project.owner?.name || 'Assigned Lead'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Budget: <strong>₹{project.paymentAmount || 499} Paid</strong></span>
                </div>
              </div>
            </div>

            {/* AUTOMATED HEALTH & RISK INSIGHTS */}
            {data.healthData?.healthSummary && (
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center gap-2 mb-1 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Health Diagnostics & Automated Analysis</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {data.healthData.healthSummary}
                </p>
              </div>
            )}

            {/* TASKS TABLE PREVIEW */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Task Inventory ({tasks.length})
              </h3>
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="p-2.5 pl-3">Task Title</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Priority</th>
                      <th className="p-2.5">Assignee</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5 pr-3 text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {tasks.slice(0, 10).map((t, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="p-2.5 pl-3 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {t.title}
                        </td>
                        <td className="p-2.5">
                          <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {(t.status || 'todo').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <Badge variant={t.priority || 'medium'}>{t.priority || 'medium'}</Badge>
                        </td>
                        <td className="p-2.5 text-gray-600 dark:text-gray-400">
                          {t.assignee?.name || 'Unassigned'}
                        </td>
                        <td className="p-2.5 text-gray-500 dark:text-gray-400">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-2.5 pr-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {t.progress || (t.status === 'completed' ? 100 : 0)}%
                        </td>
                      </tr>
                    ))}
                    {tasks.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-400 text-xs">
                          No tasks recorded in this project yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {tasks.length > 10 && (
                <p className="text-[11px] text-gray-500 text-right">
                  Showing 10 of {tasks.length} tasks. Full list is included in the downloaded PDF and Word documents.
                </p>
              )}
            </div>

            {/* MILESTONES PREVIEW (IF ANY) */}
            {milestones.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Target Milestones ({milestones.length})
                </h3>
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="p-2.5 pl-3">Milestone</th>
                        <th className="p-2.5">Target Date</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 pr-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {milestones.map((m, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 pl-3 font-medium text-gray-900 dark:text-gray-100">{m.title}</td>
                          <td className="p-2.5 text-gray-500 dark:text-gray-400">
                            {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-2.5 capitalize">{m.status || 'upcoming'}</td>
                          <td className="p-2.5 pr-3 text-gray-500 dark:text-gray-400 truncate max-w-xs">{m.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleDownloadPDF}
            disabled={loading || !reportData || downloadingFormat === 'pdf'}
          >
            Download PDF Report
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectReportModal;
