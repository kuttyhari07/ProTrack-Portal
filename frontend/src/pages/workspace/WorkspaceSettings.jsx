import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  Building2,
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Mail,
  Clock,
  Activity,
  CheckCircle2,
  Sliders
} from 'lucide-react';

const WorkspaceSettings = () => {
  const { user } = useAuth();
  const { currentWorkspace, currentRole, isOwnerOrAdmin, isManagerOrAdmin, refreshWorkspaces } = useWorkspace();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Remove Member Confirm
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [submittingRemove, setSubmittingRemove] = useState(false);

  // Edit Workspace Form
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [wsTeamType, setWsTeamType] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const fetchWorkspaceData = async () => {
    if (!currentWorkspace?._id) return;
    try {
      setLoading(true);
      const [wsRes, memRes] = await Promise.all([
        api.get(`/workspaces/${currentWorkspace._id}`),
        api.get(`/workspaces/${currentWorkspace._id}/members`)
      ]);

      if (wsRes.data.success) {
        setWorkspace(wsRes.data.workspace);
        setWsName(wsRes.data.workspace.name);
        setWsDesc(wsRes.data.workspace.description || '');
        setWsTeamType(wsRes.data.workspace.teamType || 'General');
      }

      if (memRes.data.success) {
        setMembers(memRes.data.members);
        setInvitations(memRes.data.invitations || []);
      }
    } catch (err) {
      console.error('Failed to load workspace settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [currentWorkspace?._id]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) return;
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const res = await api.put(`/workspaces/${currentWorkspace._id}`, {
        name: wsName,
        description: wsDesc,
        teamType: wsTeamType
      });
      if (res.data.success) {
        setSettingsSuccess(true);
        refreshWorkspaces();
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update workspace');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmittingInvite(true);
    try {
      const res = await api.post(`/workspaces/${currentWorkspace._id}/invitations`, {
        email: inviteEmail,
        role: inviteRole
      });
      if (res.data.success) {
        alert(res.data.message || 'Invitation sent!');
        setInviteModalOpen(false);
        setInviteEmail('');
        fetchWorkspaceData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const res = await api.put(`/workspaces/${currentWorkspace._id}/members/${memberId}`, {
        role: newRole
      });
      if (res.data.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setSubmittingRemove(true);
    try {
      const res = await api.delete(`/workspaces/${currentWorkspace._id}/members/${memberToRemove.id}`);
      if (res.data.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
        setRemoveConfirmOpen(false);
        setMemberToRemove(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setSubmittingRemove(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
            Workspace & Team Management
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF]">
            Configure workspace parameters, control role-based access, and invite teammates.
          </p>
        </div>

        {isManagerOrAdmin && (
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => setInviteModalOpen(true)}
          >
            Invite Member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Profile & Settings Form */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E4E7EC] dark:border-[#374151] pb-3">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
              Workspace Profile
            </h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <Input
              label="Workspace Name"
              value={wsName}
              disabled={!isOwnerOrAdmin}
              onChange={(e) => setWsName(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={wsDesc}
                disabled={!isOwnerOrAdmin}
                onChange={(e) => setWsDesc(e.target.value)}
                placeholder="Workspace purpose..."
                className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-xs text-[#172033] dark:text-[#F3F4F6] p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>

            <Select
              label="Team Industry / Type"
              value={wsTeamType}
              disabled={!isOwnerOrAdmin}
              options={[
                { value: 'Software Development', label: 'Software Development' },
                { value: 'Agency / Client Services', label: 'Agency / Client Services' },
                { value: 'Startup', label: 'High-Growth Startup' },
                { value: 'Product Management', label: 'Product Management' },
                { value: 'Enterprise Operations', label: 'Enterprise Operations' }
              ]}
              onChange={(e) => setWsTeamType(e.target.value)}
            />

            {settingsSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Workspace updated successfully.
              </p>
            )}

            {isOwnerOrAdmin && (
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={savingSettings}
                className="w-full"
              >
                Save Settings
              </Button>
            )}
          </form>

          <div className="pt-3 border-t border-[#E4E7EC] dark:border-[#374151] text-xs text-[#667085] dark:text-[#9CA3AF]">
            <span className="font-semibold text-[#172033] dark:text-[#F3F4F6]">Your Role:</span>{' '}
            <Badge variant={currentRole}>{currentRole}</Badge>
          </div>
        </Card>

        {/* Team Members List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-[#374151] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
                  Active Team Members ({members.length})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E7EC] dark:border-[#374151] text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Role</th>
                    {isOwnerOrAdmin && <th className="py-2.5 px-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
                  {members.map((m) => {
                    const isSelf = m.userId === user?.id || m.userId === user?._id;
                    const isOwner = m.role === 'Owner';
                    return (
                      <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1F2937]/30">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
                                {m.name ? m.name.substring(0, 1) : 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#172033] dark:text-[#F3F4F6]">
                                {m.name} {isSelf && <span className="text-[10px] text-gray-400 font-normal">(You)</span>}
                              </p>
                              <p className="text-[11px] text-gray-400">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#667085] dark:text-[#9CA3AF]">
                          {m.title || 'Contributor'}
                        </td>
                        <td className="py-3 px-3">
                          {isOwnerOrAdmin && !isOwner && !isSelf ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                              className="bg-transparent border border-[#E4E7EC] dark:border-[#374151] rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Project Manager">Project Manager</option>
                              <option value="Member">Member</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          ) : (
                            <Badge variant={m.role}>{m.role}</Badge>
                          )}
                        </td>
                        {isOwnerOrAdmin && (
                          <td className="py-3 px-3 text-right">
                            {!isOwner && !isSelf && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMemberToRemove(m);
                                  setRemoveConfirmOpen(true);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 rounded"
                                title="Remove member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6] mb-3">
                Pending Invitations ({invitations.length})
              </h3>
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#E4E7EC] dark:border-[#374151] text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#172033] dark:text-[#F3F4F6]">{inv.email}</p>
                      <p className="text-[11px] text-gray-400">Invited by {inv.invitedBy} • Role: {inv.role}</p>
                    </div>
                    <Badge variant="todo">Pending Acceptance</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* INVITE MODAL */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Teammate to Workspace"
        subtitle="Invite colleagues or clients with granular role-based permissions."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <Select
            label="Role & Access Level"
            value={inviteRole}
            options={[
              { value: 'Admin', label: 'Admin (Full management)' },
              { value: 'Project Manager', label: 'Project Manager (Create & lead projects)' },
              { value: 'Member', label: 'Member (Create & edit tasks, issues, files)' },
              { value: 'Viewer', label: 'Viewer (Read-only observation)' }
            ]}
            onChange={(e) => setInviteRole(e.target.value)}
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submittingInvite}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* REMOVE CONFIRM */}
      <ConfirmDialog
        isOpen={removeConfirmOpen}
        onClose={() => setRemoveConfirmOpen(false)}
        onConfirm={handleRemoveMember}
        title={`Remove ${memberToRemove?.name}?`}
        message="This user will lose access to all projects, documents, and discussions in this workspace."
        confirmLabel="Remove Access"
        loading={submittingRemove}
      />
    </div>
  );
};

export default WorkspaceSettings;
