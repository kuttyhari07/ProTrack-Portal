import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const AIAutoPilotModal = ({ isOpen, onClose, report, onRefresh }) => {
  if (!isOpen || !report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              AI Autonomous Workspace Auto-Pilot
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
              Autonomous sprint optimization and deliverable workload balancing
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Metric Summary Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-100 dark:border-indigo-900 text-center">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-indigo-900 dark:text-indigo-200">
              {report.overdueRescheduled || 0}
            </div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              Overdue Rescheduled
            </div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl border border-purple-100 dark:border-purple-900 text-center">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-purple-900 dark:text-purple-200">
              {report.tasksAssigned || 0}
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              Backlog Balanced
            </div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-100 dark:border-emerald-900 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
              {report.projectsAudited || 0}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Projects Audited
            </div>
          </div>
        </div>

        {/* Action Highlights */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Autonomous Actions Executed:
          </span>
          <div className="space-y-1.5">
            {report.actionsSummary?.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              onClose();
              if (onRefresh) onRefresh();
            }}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Done & Refresh Dashboard
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AIAutoPilotModal;

