import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Layers, CheckCircle2, ArrowRight, Building, Sparkles, FolderPlus, Users } from 'lucide-react';

const OnboardingWizard = () => {
  const { user } = useAuth();
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Workspace & Team Type
  const [workspaceData, setWorkspaceData] = useState({
    name: currentWorkspace?.name || `${user?.name?.split(' ')[0] || 'My'}'s Workspace`,
    teamType: 'Software Development'
  });

  // Step 2: First Project
  const [projectData, setProjectData] = useState({
    name: 'Customer Portal Redesign',
    projectCode: 'PRJ-001',
    description: 'Launch the initial modern web client for our customer base.',
    priority: 'high',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Step 3: Invite Teammates
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [invites, setInvites] = useState([]);

  const teamTypes = [
    { value: 'Software Development', label: 'Software & Engineering' },
    { value: 'Agency / Client Work', label: 'Agency / Client Work' },
    { value: 'Startup', label: 'Startup / High-Growth Team' },
    { value: 'Product Management', label: 'Product & Design' },
    { value: 'Enterprise Operations', label: 'Enterprise Operations' }
  ];

  const handleAddInvite = (e) => {
    e.preventDefault();
    if (inviteEmail && inviteEmail.trim()) {
      setInvites((prev) => [...prev, { email: inviteEmail.trim(), role: inviteRole }]);
      setInviteEmail('');
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // 1. Update workspace profile
      if (currentWorkspace?._id) {
        await api.put(`/workspaces/${currentWorkspace._id}`, {
          name: workspaceData.name,
          teamType: workspaceData.teamType
        });
      }

      // 2. Create first project
      await api.post('/projects', {
        name: projectData.name,
        projectCode: projectData.projectCode,
        description: projectData.description,
        priority: projectData.priority,
        dueDate: projectData.dueDate
      });

      // 3. Send invitations if any
      if (invites.length > 0 && currentWorkspace?._id) {
        for (const inv of invites) {
          try {
            await api.post(`/workspaces/${currentWorkspace._id}/invitations`, inv);
          } catch (e) {
            console.error('Invite error:', e);
          }
        }
      }

      await refreshWorkspaces();
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding completion error:', err);
      // Navigate to dashboard anyway if first project succeeded
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B1120] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img 
            src="/logo.png" 
            alt="ProTrack Logo" 
            className="w-10 h-10 object-contain rounded-2xl shadow-md bg-white p-0.5" 
          />
          <span className="font-extrabold text-2xl tracking-tight text-[#172033] dark:text-white">
            Pro<span className="text-[#0284c7] dark:text-[#38bdf8]">Track</span>
          </span>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            >
              1
            </span>
            <span className="text-xs font-medium text-[#172033] dark:text-[#F3F4F6] hidden sm:inline">
              Workspace
            </span>
          </div>
          <div className="h-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mx-3" />
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            >
              2
            </span>
            <span className="text-xs font-medium text-[#172033] dark:text-[#F3F4F6] hidden sm:inline">
              First Project
            </span>
          </div>
          <div className="h-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mx-3" />
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 3
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            >
              3
            </span>
            <span className="text-xs font-medium text-[#172033] dark:text-[#F3F4F6] hidden sm:inline">
              Team & Launch
            </span>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] rounded-[16px] shadow-xl p-6 sm:p-8">
          {/* STEP 1: Workspace & Team */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#172033] dark:text-white">
                  Welcome aboard, {user?.name}! Let's set up your workspace.
                </h2>
                <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
                  Workspaces isolate your projects, tasks, documents, and team members.
                </p>
              </div>

              <Input
                label="Workspace Name"
                icon={Building}
                value={workspaceData.name}
                onChange={(e) => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                required
              />

              <Select
                label="Primary Team Type / Use Case"
                options={teamTypes}
                value={workspaceData.teamType}
                onChange={(e) => setWorkspaceData({ ...workspaceData, teamType: e.target.value })}
              />

              <div className="pt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setStep(2)}
                  icon={ArrowRight}
                >
                  Continue to First Project
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: First Project */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#172033] dark:text-white">
                  Create your first project
                </h2>
                <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
                  Define the primary initiative your team is tackling right now.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    label="Project Name"
                    value={projectData.name}
                    onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Project Code"
                    value={projectData.projectCode}
                    onChange={(e) => setProjectData({ ...projectData, projectCode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Target Due Date"
                  type="date"
                  value={projectData.dueDate}
                  onChange={(e) => setProjectData({ ...projectData, dueDate: e.target.value })}
                  required
                />
                <Select
                  label="Priority"
                  value={projectData.priority}
                  options={[
                    { value: 'urgent', label: 'Urgent' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' }
                  ]}
                  onChange={(e) => setProjectData({ ...projectData, priority: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="primary" onClick={() => setStep(3)} icon={ArrowRight}>
                  Next: Invite Team
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Invite Team & Complete */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#172033] dark:text-white">
                  Invite your team or colleagues
                </h2>
                <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
                  Collaborate in real-time. You can also skip this and invite them later from workspace settings.
                </p>
              </div>

              <form onSubmit={handleAddInvite} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="colleague@company.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <Select
                    value={inviteRole}
                    options={[
                      { value: 'Admin', label: 'Admin' },
                      { value: 'Project Manager', label: 'PM' },
                      { value: 'Member', label: 'Member' },
                      { value: 'Viewer', label: 'Viewer' }
                    ]}
                    onChange={(e) => setInviteRole(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Add
                </Button>
              </form>

              {invites.length > 0 && (
                <div className="border border-[#E4E7EC] dark:border-[#374151] rounded-lg p-2 max-h-36 overflow-y-auto space-y-1">
                  {invites.map((inv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <span className="font-medium text-[#172033] dark:text-[#F3F4F6]">{inv.email}</span>
                      <span className="text-gray-400">({inv.role})</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleComplete} disabled={loading}>
                    Skip for Now
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleComplete}
                    loading={loading}
                    icon={CheckCircle2}
                  >
                    Launch Workspace
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
