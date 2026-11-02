import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const AIDiagnosticModal = ({ isOpen, onClose, data, type = 'task_breakdown' }) => {
  if (!isOpen || !data) return null;

  const isTask = type === 'task_breakdown';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {isTask ? 'AI Subtask Decomposition & Checklist' : 'AI Blocker Root-Cause Diagnosis'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-normal truncate max-w-sm">
              {data.taskTitle || data.issueTitle}
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {isTask ? (
          <>
            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-2">
                🧩 Recommended Subtasks & Implementation Steps:
              </span>
              <div className="space-y-2">
                {data.subtasks?.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={s.done}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">{s.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1.5">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Verified Acceptance Criteria:
              </span>
              <ul className="space-y-1 text-indigo-700 dark:text-indigo-400 ml-5 list-disc text-[11px]">
                {data.acceptanceCriteria?.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Blocker Diagnosis */}
            <div className="p-3 bg-red-50/50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/40 text-xs">
              <div className="font-bold text-red-900 dark:text-red-300 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Probable Root Cause:
              </div>
              <p className="text-red-700 dark:text-red-400 leading-relaxed">
                {data.diagnosis?.rootCause}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-2">
                🛠️ Recommended Step-by-Step Fix:
              </span>
              <div className="space-y-1.5">
                {data.diagnosis?.resolutionSteps?.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Prevention & Testing Strategy:
              </div>
              <p className="text-amber-800 dark:text-amber-400 text-[11px]">
                {data.diagnosis?.preventionTip}
              </p>
            </div>
          </>
        )}

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AIDiagnosticModal;

