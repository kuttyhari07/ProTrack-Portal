import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Home / Landing Page
import LandingPage from './pages/home/LandingPage';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Onboarding
import OnboardingWizard from './pages/onboarding/OnboardingWizard';

// App Pages
import DashboardOverview from './pages/dashboard/DashboardOverview';
import ProjectList from './pages/projects/ProjectList';
import ProjectDetail from './pages/projects/ProjectDetail';
import GlobalTaskList from './pages/tasks/GlobalTaskList';
import MilestonesTimeline from './pages/milestones/MilestonesTimeline';
import IssueList from './pages/issues/IssueList';
import DocumentsPage from './pages/documents/DocumentsPage';
import ReportsAnalytics from './pages/reports/ReportsAnalytics';
import AutomationPage from './pages/automation/AutomationPage';
import WorkspaceSettings from './pages/workspace/WorkspaceSettings';
import UserProfile from './pages/profile/UserProfile';

// Master System Admin Pages
import AdminRoute from './components/auth/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import ScrollToTop from './components/common/ScrollToTop';

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Landing & Home Page */}
        <Route path="/" element={<LandingPage />} />

      {/* Master System Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Public Auth Routes */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/member-register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />

      {/* Onboarding Wizard */}
      <Route path="/onboarding" element={<OnboardingWizard />} />

      {/* Protected App Routes inside Workspace Layout */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardOverview />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/tasks" element={<GlobalTaskList />} />
        <Route path="/milestones" element={<MilestonesTimeline />} />
        <Route path="/issues" element={<IssueList />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/reports" element={<ReportsAnalytics />} />
        <Route path="/automation" element={<AutomationPage />} />
        <Route path="/workspace/settings" element={<WorkspaceSettings />} />
        <Route path="/profile" element={<UserProfile />} />
      </Route>

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);
}

export default App;
