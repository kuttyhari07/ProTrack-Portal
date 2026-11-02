import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  FolderKanban,
  Flag,
  CheckSquare,
  ArrowRight,
  Zap,
  Calendar
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import api from '../../services/api';

const AIProjectGeneratorModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [idea, setIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const sampleIdeas = [
    'E-commerce shopping cart with UPI payments and invoice PDF export',
    'Real-time customer support chat widget with audio notifications',
    'Enterprise multi-tenant RBAC authentication engine with audit logs',
    'AI-powered expense tracker with receipt OCR scanning'
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!idea.trim()) return;

    try {
      setGenerating(true);
      setError(null);
      const res = await api.post('/ai/generate-project-plan', {
        idea: idea.trim(),
        autoCreate: true
      });

      if (res.data.success) {
        if (onProjectCreated) {
          onProjectCreated(res.data.project);
        }
        onClose();
        setIdea('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to auto-generate project. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              AI Autonomous Project & Sprint Decomposer
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
              Enter any product or feature idea — AI generates the project, milestones & tasks in 1 second
            </p>
          </div>
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Describe your project, feature, or initiative:
          </label>
          <textarea
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. Build an automated customer onboarding workflow with email verification and analytics..."
            className="w-full px-3 py-2.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            required
          />
        </div>

        {/* Quick Sample Prompts */}
        <div>
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
            Or pick an instant agile template:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleIdeas.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdea(s)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-left truncate max-w-full"
              >
                ⚡ {s}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-800 dark:text-indigo-300 space-y-1">
          <span className="font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            What will be automatically generated:
          </span>
          <ul className="text-[11px] space-y-0.5 text-indigo-700 dark:text-indigo-400 ml-4 list-disc">
            <li>1 New Project with Project Code and Health Tracking</li>
            <li>3 Phased Sprint Milestones (Architecture, Implementation, QA Launch)</li>
            <li>7 Prioritized Deliverables/Tasks with target deadlines and tags</li>
          </ul>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/50 rounded-lg text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={generating} className="text-xs">
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={generating || !idea.trim()}
            className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-sm"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Decomposing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate Entire Project & Sprint
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AIProjectGeneratorModal;

