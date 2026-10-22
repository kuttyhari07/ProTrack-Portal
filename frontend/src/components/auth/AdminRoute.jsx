import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import Button from '../common/Button';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0B1120]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#667085] dark:text-[#9CA3AF]">
            Verifying Master Administrator Privileges...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const isSuperAdmin =
    user?.role === 'system_admin' ||
    user?.email?.toLowerCase() === 'protrack24@gmail.com';

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F7FB] dark:bg-[#0B1120]">
        <div className="max-w-md w-full bg-white dark:bg-[#111827] border border-red-200 dark:border-red-900/40 rounded-2xl p-8 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#172033] dark:text-white">
              Administrator Access Only
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
              This dashboard is strictly reserved for the Master System Administrator (<code className="text-indigo-600 dark:text-indigo-400 font-mono">protrack24@gmail.com</code>). Your account does not have access.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Link to="/dashboard">
              <Button variant="primary" icon={ArrowLeft} size="sm">
                Return to Workspace Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
