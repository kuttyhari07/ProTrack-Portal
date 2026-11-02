import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

const LandingPage = lazy(() => import('./pages/home/LandingPage'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const OnboardingWizard = lazy(() => import('./pages/onboarding/OnboardingWizard'));
const DashboardOverview = lazy(() => import('./pages/dashboard/DashboardOverview'));
const ProjectList = lazy(() => import('./pages/projects/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/projects/ProjectDetail'));
const GlobalTaskList = lazy(() => import('./pages/tasks/GlobalTaskList'));
const MilestonesTimeline = lazy(() => import('./pages/milestones/MilestonesTimeline'));
const IssueList = lazy(() => import('./pages/issues/IssueList'));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'));
const ReportsAnalytics = lazy(() => import('./pages/reports/ReportsAnalytics'));
const AutomationPage = lazy(() => import('./pages/automation/AutomationPage'));
const WorkspaceSettings = lazy(() => import('./pages/workspace/WorkspaceSettings'));
const UserProfile = lazy(() => import('./pages/profile/UserProfile'));
import AdminRoute from './components/auth/AdminRoute';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
import ScrollToTop from './components/common/ScrollToTop';

function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-gray-500" role="status">
          Loading page...
        </div>
      }>
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
      </Suspense>
  </>
);
}

export default App;
