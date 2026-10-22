import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus, User as UserIcon, Settings, LogOut, Check, Building2, Menu, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import GlobalSearchModal from './GlobalSearchModal';
import { useNavigate, Link } from 'react-router-dom';
import Badge from '../common/Badge';

const Navbar = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, switchWorkspace, currentRole } = useWorkspace();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const wsDropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(e.target)) {
        setWorkspaceDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#111827] border-b border-[#E4E7EC] dark:border-[#374151] px-4 sm:px-6 flex items-center justify-between transition-colors">
        {/* Left: Mobile hamburger & Workspace Switcher */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Workspace Dropdown */}
          <div className="relative" ref={wsDropdownRef}>
            <button
              type="button"
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#E4E7EC] dark:border-[#374151] hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-md bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {currentWorkspace?.name ? currentWorkspace.name.substring(0, 1) : 'P'}
              </div>
              <div className="hidden sm:block max-w-[140px] truncate">
                <p className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] truncate">
                  {currentWorkspace?.name || 'Workspace'}
                </p>
                <p className="text-[10px] text-[#667085] dark:text-[#9CA3AF] capitalize">
                  {currentRole}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>

            {workspaceDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-[14px] bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] shadow-xl z-50 py-2">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
                  Workspaces
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5 px-1">
                  {workspaces.map((ws) => (
                    <button
                      key={ws._id}
                      type="button"
                      onClick={() => {
                        switchWorkspace(ws._id);
                        setWorkspaceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        currentWorkspace?._id === ws._id
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-[#818CF8]'
                          : 'text-[#172033] dark:text-[#F3F4F6] hover:bg-gray-100 dark:hover:bg-[#1F2937]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{ws.name}</span>
                      </div>
                      {currentWorkspace?._id === ws._id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#E4E7EC] dark:border-[#374151] mt-2 pt-1 px-1">
                  <Link
                    to="/workspace/settings"
                    onClick={() => setWorkspaceDropdownOpen(false)}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-[#667085] dark:text-[#9CA3AF] hover:text-[#172033] dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F2937] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Workspace Settings
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Global Search Bar Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-[#F5F7FB] dark:bg-[#0B1120] text-gray-400 text-xs hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search workspace...</span>
            </div>
            <kbd className="hidden sm:inline-block rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Theme Toggle, Notification Bell, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <ThemeToggle />
          <NotificationBell />

          {/* User Avatar Menu */}
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#4F46E5] transition-all cursor-pointer"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name ? user.name.substring(0, 2) : 'PT'}
                </div>
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-[14px] bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-[#E4E7EC] dark:border-[#374151]">
                  <p className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] truncate">
                    {user?.email}
                  </p>
                  <div className="mt-1">
                    <Badge variant={currentRole}>{currentRole}</Badge>
                  </div>
                </div>

                <div className="py-1 px-1 space-y-0.5">
                  {(user?.role === 'system_admin' || user?.email?.toLowerCase() === 'protrack24@gmail.com') && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg transition-colors border border-amber-200 dark:border-amber-800/60 mb-1"
                    >
                      <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Master Admin Console
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#172033] dark:text-[#F3F4F6] hover:bg-gray-100 dark:hover:bg-[#1F2937] rounded-lg transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF]" />
                    My Profile
                  </Link>
                  <Link
                    to="/workspace/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#172033] dark:text-[#F3F4F6] hover:bg-gray-100 dark:hover:bg-[#1F2937] rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF]" />
                    Workspace Settings
                  </Link>
                </div>

                <div className="border-t border-[#E4E7EC] dark:border-[#374151] pt-1 px-1">
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
