import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Send,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  GitBranch
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import api from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';

const IntegrationsModal = ({ isOpen, onClose, project }) => {
  const { currentWorkspace } = useWorkspace();

  const [activeTab, setActiveTab] = useState('github'); // 'github' | 'slack' | 'discord'
  const [slackUrl, setSlackUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load existing workspace integrations
  useEffect(() => {
    if (currentWorkspace?.integrations) {
      setSlackUrl(currentWorkspace.integrations.slackWebhookUrl || '');
      setDiscordUrl(currentWorkspace.integrations.discordWebhookUrl || '');
    }
  }, [currentWorkspace]);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;
  const webhookUrl = `${currentOrigin}/api/webhooks/github/${currentWorkspace?._id}`;

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveIntegrations = async () => {
    try {
      setSaving(true);
      const res = await api.put(`/workspaces/${currentWorkspace._id}`, {
        integrations: {
          slackWebhookUrl: slackUrl.trim(),
          discordWebhookUrl: discordUrl.trim()
        }
      });
      if (res.data.success) {
        alert('Integrations saved successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save integrations');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPing = async (platform, url) => {
    if (!url || !url.startsWith('http')) {
      alert(`Please enter a valid ${platform} webhook URL first.`);
      return;
    }
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.post(`/workspaces/${currentWorkspace._id}/integrations/test`, {
        platform,
        webhookUrl: url
      });
      if (res.data.success) {
        setTestResult({ success: true, message: res.data.message });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || `Failed to deliver test message to ${platform}.`
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Webhook className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              DevOps & Real-time Integrations
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
              Connect GitHub, Slack, and Discord to automate your team workflows
            </p>
          </div>
        </div>
      }
      size="lg"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          <button
            onClick={() => { setActiveTab('github'); setTestResult(null); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'github'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            GitHub / GitLab Webhook
          </button>

          <button
            onClick={() => { setActiveTab('slack'); setTestResult(null); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'slack'
                ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Slack Webhooks
          </button>

          <button
            onClick={() => { setActiveTab('discord'); setTestResult(null); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'discord'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Discord Webhooks
          </button>
        </div>

        {/* Tab 1: GitHub / GitLab Webhook */}
        {activeTab === 'github' && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Automatic Two-Way Commit & Pull Request Sync
              </h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-400">
                Whenever your team pushes code or merges pull requests referencing task numbers (e.g. <code className="font-mono bg-white dark:bg-black/30 px-1 py-0.5 rounded text-[11px]">fix(PRO-24): resolved auth</code>), ProTrack automatically moves the task to <strong>Completed</strong> and records the commit in real-time!
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Your Workspace GitHub Webhook URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 select-all"
                />
                <Button
                  size="sm"
                  variant="outline"
                  icon={copied ? Check : Copy}
                  onClick={handleCopyWebhookUrl}
                  className="text-xs shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy URL'}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 text-xs space-y-2">
              <h5 className="font-bold text-gray-800 dark:text-gray-200">
                Quick Setup Instructions (GitHub Repository):
              </h5>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
                <li>Go to your GitHub repository ➔ <strong>Settings</strong> ➔ <strong>Webhooks</strong>.</li>
                <li>Click <strong>Add webhook</strong>.</li>
                <li>Paste the Webhook URL above into <strong>Payload URL</strong>.</li>
                <li>Select <strong>Content type</strong> as <code className="font-mono bg-gray-200 dark:bg-gray-800 px-1 rounded">application/json</code>.</li>
                <li>Choose: <em>Just the push event</em> and <em>Pull requests</em>.</li>
                <li>Click <strong>Add webhook</strong> — You're ready to roll!</li>
              </ol>
            </div>

            <div className="p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Supported Commit Syntax:</span>
              <ul className="mt-1.5 space-y-1 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                <li>• <code className="text-emerald-600">git commit -m "fix(PRO-12): resolved crash"</code> ➔ Marks task completed</li>
                <li>• <code className="text-indigo-600">git commit -m "wip(PRO-12): navbar styling"</code> ➔ Moves task to in progress</li>
                <li>• <code className="text-amber-600">git commit -m "closes #12: payment gateway"</code> ➔ Auto-completes deliverable</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Slack Webhook */}
        {activeTab === 'slack' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Receive formatted channel alerts whenever critical blockers are logged, deliverables are completed, or sprint milestones are reached.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Slack Incoming Webhook URL:
              </label>
              <input
                type="url"
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTestPing('slack', slackUrl)}
                disabled={testing || !slackUrl}
                className="text-xs"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Send Test Ping
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Discord Webhook */}
        {activeTab === 'discord' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Dispatch rich Discord embed cards to your team server channel with instant clickable deliverable links.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Discord Incoming Webhook URL:
              </label>
              <input
                type="url"
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTestPing('discord', discordUrl)}
                disabled={testing || !discordUrl}
                className="text-xs"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Send Test Ping
              </Button>
            </div>
          </div>
        )}

        {/* Test Result Banner */}
        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          {(activeTab === 'slack' || activeTab === 'discord') && (
            <Button
              size="sm"
              onClick={handleSaveIntegrations}
              disabled={saving}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Webhook Settings'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default IntegrationsModal;

