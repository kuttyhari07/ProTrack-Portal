import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowRight,
  Sliders,
  Sparkles,
  Link2
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

const GanttTimeline = ({ project, tasks = [], milestones = [], onUpdateTaskDate }) => {
  const [zoomLevel, setZoomLevel] = useState('day'); // 'day' | 'week'
  const [viewFilter, setViewFilter] = useState('all'); // 'all' | 'milestones_only' | 'critical'

  // Calculate project timeline boundaries
  const timelineDates = useMemo(() => {
    const dates = [];
    const now = new Date();

    const start = project?.startDate
      ? new Date(project.startDate)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const end = project?.dueDate
      ? new Date(project.dueDate)
      : new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

    // Ensure at least 14 days visible
    const adjustedEnd = new Date(Math.max(end.getTime(), start.getTime() + 14 * 24 * 60 * 60 * 1000));

    // Pad 3 days on both sides
    const cur = new Date(start);
    cur.setDate(cur.getDate() - 3);

    const stop = new Date(adjustedEnd);
    stop.setDate(stop.getDate() + 5);

    while (cur <= stop) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    return dates;
  }, [project?.startDate, project?.dueDate]);

  const startDate = timelineDates[0];
  const totalDays = timelineDates.length;

  // Filter tasks based on viewFilter
  const filteredTasks = useMemo(() => {
    if (viewFilter === 'critical') {
      return tasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');
    }
    return tasks;
  }, [tasks, viewFilter]);

  // Calculate column offsets and widths
  const getPositionStyles = (itemStart, itemDue) => {
    if (!startDate) return { left: '0%', width: '10%' };

    const start = itemStart ? new Date(itemStart) : new Date();
    const due = itemDue ? new Date(itemDue) : new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);

    const diffStartMs = start.getTime() - startDate.getTime();
    const startDayIndex = Math.max(0, Math.floor(diffStartMs / (24 * 60 * 60 * 1000)));

    const durationDays = Math.max(1, Math.ceil((due.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);

    const leftPercent = Math.min(95, Math.max(0, (startDayIndex / totalDays) * 100));
    const widthPercent = Math.min(100 - leftPercent, Math.max(3, (durationDays / totalDays) * 100));

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`
    };
  };

  const getStatusColor = (status, priority) => {
    if (status === 'completed') return 'bg-emerald-500 border-emerald-600 text-white';
    if (priority === 'urgent') return 'bg-red-500 border-red-600 text-white';
    if (priority === 'high') return 'bg-amber-500 border-amber-600 text-white';
    if (status === 'in_progress') return 'bg-indigo-600 border-indigo-700 text-white';
    return 'bg-slate-400 border-slate-500 text-white';
  };

  const isToday = (d) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Interactive Gantt & Schedule Roadmap
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                Live Timeline
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Visual task durations, dependency chains, and milestone delivery checkpoints
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900 text-xs">
            <button
              onClick={() => setViewFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewFilter === 'all'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All Deliverables ({tasks.length})
            </button>
            <button
              onClick={() => setViewFilter('critical')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewFilter === 'critical'
                  ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              High & Urgent Only
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${Math.max(900, totalDays * 40)}px` }}>
            {/* Header: Date Columns */}
            <div className="grid grid-cols-[260px_1fr] border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50">
              <div className="p-3 font-semibold text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span>Deliverable / Milestone</span>
                <span className="text-[10px] text-gray-400 font-mono">Status & Progress</span>
              </div>
              <div className="relative flex">
                {timelineDates.map((d, idx) => {
                  const today = isToday(d);
                  return (
                    <div
                      key={idx}
                      className={`flex-1 min-w-[36px] py-2 text-center border-r border-gray-100 dark:border-gray-800 text-[10px] font-mono select-none ${
                        today
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <div className="font-semibold">{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                      <div className="text-[11px]">{d.getDate()}</div>
                      {today && (
                        <div className="mt-0.5 inline-block w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section: Milestones */}
            {milestones.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="px-3 py-1.5 bg-indigo-50/40 dark:bg-indigo-950/20 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-indigo-600" />
                  Key Sprint Milestones ({milestones.length})
                </div>

                {milestones.map((m) => {
                  const pos = getPositionStyles(m.dueDate, m.dueDate);
                  const isDone = m.status === 'completed';
                  return (
                    <div
                      key={m._id}
                      className="grid grid-cols-[260px_1fr] border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors py-2"
                    >
                      <div className="px-3 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            isDone ? 'bg-emerald-500' : 'bg-indigo-600 animate-pulse'
                          }`}
                        />
                        <span className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[170px]" title={m.title}>
                          {m.title}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-auto font-mono">
                          {m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                        </span>
                      </div>

                      <div className="relative h-7 flex items-center px-1">
                        <div
                          className="absolute flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold shadow-sm transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                          style={{ left: pos.left }}
                        >
                          <Flag className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{m.title}</span>
                          {isDone ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-300 ml-1" />
                          ) : (
                            <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded">Target</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Section: Tasks */}
            <div>
              <div className="px-3 py-1.5 bg-gray-50/60 dark:bg-gray-900/40 text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  Sprint Deliverables & Tasks ({filteredTasks.length})
                </span>
                <span className="text-[10px] text-gray-400">Duration & Dependencies</span>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No tasks match the active filter.
                </div>
              ) : (
                filteredTasks.map((t) => {
                  const pos = getPositionStyles(t.startDate, t.dueDate);
                  const isDone = t.status === 'completed';
                  const hasDependency = t.dependencies && t.dependencies.length > 0;

                  return (
                    <div
                      key={t._id}
                      className="grid grid-cols-[260px_1fr] border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors py-2 group"
                    >
                      {/* Left Title & Status */}
                      <div className="px-3 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700">
                        <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950 px-1 py-0.5 rounded">
                          #{t.taskNumber}
                        </span>
                        <div className="truncate flex-1">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={t.title}>
                            {t.title}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <span>{t.assignee?.name ? t.assignee.name.split(' ')[0] : 'Unassigned'}</span>
                            <span>•</span>
                            <span className="font-semibold text-gray-500">{t.progress || 0}%</span>
                            {hasDependency && (
                              <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold" title="Has prerequisites">
                                <Link2 className="w-2.5 h-2.5" /> Dep
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant={t.priority} size="sm">
                          {t.priority}
                        </Badge>
                      </div>

                      {/* Right Gantt Bar Canvas */}
                      <div className="relative h-7 flex items-center px-1">
                        <div
                          className={`absolute h-5 rounded-md flex items-center justify-between px-2 text-[10px] font-semibold shadow-sm transition-all cursor-pointer ${getStatusColor(
                            t.status,
                            t.priority
                          )} hover:brightness-110`}
                          style={{ left: pos.left, width: pos.width }}
                          title={`Task #${t.taskNumber}: ${t.title} (${t.progress || 0}% Complete)`}
                        >
                          {/* Inner Progress Fill */}
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-black/20 rounded-l-md pointer-events-none"
                            style={{ width: `${t.progress || 0}%` }}
                          />

                          <span className="relative z-10 truncate text-[10px] leading-tight font-medium drop-shadow-sm">
                            {t.title}
                          </span>

                          <span className="relative z-10 text-[9px] font-mono opacity-90 pl-1 shrink-0">
                            {t.progress || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-3 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4 text-[11px] text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500 inline-block" />
            <span>Urgent Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-indigo-500 to-purple-600 inline-block" />
            <span>Milestone Target</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttTimeline;

