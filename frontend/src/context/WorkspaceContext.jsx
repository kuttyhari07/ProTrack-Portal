import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/workspaces');
      if (res.data.success) {
        setWorkspaces(res.data.workspaces);

        // Find saved or default workspace
        const savedId = localStorage.getItem('protrack_workspace_id');
        let selected = res.data.workspaces.find((w) => w._id === savedId);

        if (!selected && res.data.workspaces.length > 0) {
          selected = res.data.workspaces[0];
        }

        if (selected) {
          setCurrentWorkspace(selected);
          localStorage.setItem('protrack_workspace_id', selected._id);
        }
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [isAuthenticated, user?.currentWorkspace]);

  const switchWorkspace = async (workspaceId) => {
    try {
      const res = await api.post(`/workspaces/switch/${workspaceId}`);
      if (res.data.success) {
        localStorage.setItem('protrack_workspace_id', workspaceId);
        const selected = workspaces.find((w) => w._id === workspaceId);
        if (selected) {
          setCurrentWorkspace(selected);
        } else {
          await fetchWorkspaces();
        }
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch workspace:', err);
      throw err;
    }
  };

  const createWorkspace = async (workspaceData) => {
    try {
      const res = await api.post('/workspaces', workspaceData);
      if (res.data.success) {
        await fetchWorkspaces();
        return res.data.workspace;
      }
    } catch (err) {
      console.error('Failed to create workspace:', err);
      throw err;
    }
  };

  const currentRole = currentWorkspace?.role || 'Member';
  const isOwnerOrAdmin = ['Owner', 'Admin'].includes(currentRole);
  const isManagerOrAdmin = ['Owner', 'Admin', 'Project Manager'].includes(currentRole);
  const isViewer = currentRole === 'Viewer';

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentRole,
        isOwnerOrAdmin,
        isManagerOrAdmin,
        isViewer,
        loading,
        switchWorkspace,
        createWorkspace,
        refreshWorkspaces: fetchWorkspaces
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
