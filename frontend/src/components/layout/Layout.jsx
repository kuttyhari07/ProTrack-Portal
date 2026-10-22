import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Loader2 } from 'lucide-react';

import MemberWaitingPortal from '../../pages/workspace/MemberWaitingPortal';
import AIChatBot from '../common/AIChatBot';

const Layout = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (authLoading || wsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0B1120]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5] dark:text-[#818CF8]" />
          <p className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!currentWorkspace) {
    return <MemberWaitingPortal />;
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] dark:bg-[#0B1120]">
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ProTrack AI Assistant across the entire website */}
      <AIChatBot />
    </div>
  );
};

export default Layout;
