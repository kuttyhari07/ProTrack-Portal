import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Flag,
  AlertCircle,
  BarChart3,
  Sparkles,
  FileText,
  Users,
  X,
  Layers,
  Shield
} from 'lucide-react';

import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { isManagerOrAdmin, isOwnerOrAdmin } = useWorkspace();
  const { user } = useAuth();

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Milestones', path: '/milestones', icon: Flag },
    { name: 'Issues & Risks', path: '/issues', icon: AlertCircle },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, managerOnly: true },
    { name: 'Smart Automation', path: '/automation', icon: Sparkles, managerOnly: true },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Team & Workspace', path: '/workspace/settings', icon: Users, adminOnly: true }
  ];

  const navItems = allNavItems.filter((item) => {
    if (item.adminOnly && !isOwnerOrAdmin) return false;
    if (item.managerOnly && !isManagerOrAdmin) return false;
    return true;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#101828] dark:bg-[#080D19] text-gray-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="ProTrack" 
              className="w-9 h-9 object-contain rounded-xl bg-white p-0.5 shadow-md" 
            />
            <div>
              <span className="font-extrabold text-base tracking-tight text-white font-sans">
                Pro<span className="text-[#38bdf8]">Track</span>
              </span>
              <p className="text-[9px] text-gray-400 font-medium -mt-1 tracking-wider uppercase">
                Plan • Track • Achieve
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Workspace Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-sm'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {(user?.role === 'system_admin' || user?.email?.toLowerCase() === 'protrack24@gmail.com') && (
            <div className="pt-2 mt-2 border-t border-gray-800">
              <NavLink
                to="/admin"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60'
                  }`
                }
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Master Admin Console</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Tagline footer banner */}
        <div className="p-4 border-t border-gray-800 bg-[#0d1422] dark:bg-[#060913]">
          <p className="text-[11px] font-medium text-gray-300">
            Plan Smarter. Track Progress.
          </p>
          <p className="text-[10px] text-indigo-400 mt-0.5">
            Deliver Better.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
