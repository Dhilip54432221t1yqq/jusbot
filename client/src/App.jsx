import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Flows from './pages/Flows';
import IntegrationsPage from './pages/Integrations';
import FlowBuilder from './FlowBuilder';
import ContentPage from './pages/Content';
import LiveChat from './pages/LiveChat';
import BotUsers from './pages/BotUsers';
import WhatsAppCloudSetup from './pages/WhatsAppCloudSetup';
import WhatsAppConnected from './pages/WhatsAppConnected';
import Triggers from './pages/Triggers';
import Keywords from './pages/Keywords';
import Sequences from './pages/Sequences';
import SequenceEditor from './pages/SequenceEditor';
import WorkspaceProfile from './pages/Settings/WorkspaceProfile';
import Members from './pages/Settings/Members';
import InstagramConnect from './pages/Instagram/InstagramConnect';
import InstagramCallback from './pages/Instagram/InstagramCallback';
import InstagramDashboard from './pages/Instagram/InstagramDashboard';
import InstagramAuthRedirect from './pages/Instagram/InstagramAuthRedirect';
import Ecommerce from './pages/Ecommerce';
import { WorkspaceProvider } from './contexts/WorkspaceContext';

import WorkspaceLayout from './components/WorkspaceLayout';
import './App.css';

/**
 * ProtectedRoute: Redirects to login if user is not authenticated.
 * Shows a loading spinner while checking session.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0fdf4'
      }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #22c55e',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <WorkspaceProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Protected Workspace Routes */}
        <Route path="/:workspaceId" element={
          <ProtectedRoute>
            <WorkspaceLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="flows" element={<Flows />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="whatsapp-cloud" element={<WhatsAppCloudSetup />} />
          <Route path="whatsapp-connected" element={<WhatsAppConnected />} />
          <Route path="automation/triggers" element={<Triggers />} />
          <Route path="automation/keywords" element={<Keywords />} />
          <Route path="automation/sequences" element={<Sequences />} />
          <Route path="automation/sequences/:id" element={<SequenceEditor />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="livechat" element={<LiveChat />} />
          <Route path="contacts" element={<BotUsers />} />
          <Route path="instagram" element={<InstagramConnect />} />
          <Route path="instagram-callback" element={<InstagramCallback />} />
          <Route path="instagram-dashboard" element={<InstagramDashboard />} />
          <Route path="settings/profile" element={<WorkspaceProfile />} />
          <Route path="settings/members" element={<Members />} />
          <Route path="ecommerce" element={<Ecommerce />} />
        </Route>


        <Route path="/instagram-callback" element={<InstagramAuthRedirect />} />
        <Route path="/:workspaceId/flow-builder/:id" element={
          <ProtectedRoute>
            <FlowBuilder />
          </ProtectedRoute>
        } />
        
        {/* Fallback for old routes or root access when logged in */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/flows" element={<Navigate to="/" replace />} />
      </Routes>
    </WorkspaceProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
