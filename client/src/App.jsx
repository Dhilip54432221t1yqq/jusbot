import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Flows from './pages/Flows';
import IntegrationsPage from './pages/Integrations';
import FlowBuilder from './FlowBuilder';
import ContentPage from './pages/Content';
import LiveChat from './pages/LiveChat';
import BotUsers from './pages/BotUsers';
import WhatsAppCloudSetup from './pages/WhatsAppCloudSetup';
import WhatsAppConnected from './pages/WhatsAppConnected';
import WhatsAppTemplates from './pages/WhatsAppTemplates';
import FlowTemplates from './pages/FlowTemplates';
import WhatsAppFlows from './pages/WhatsAppFlows';
import WhatsAppMarketing from './pages/WhatsAppMarketing';
import WhatsAppCatalog from './pages/WhatsAppCatalog';
import WhatsAppAd from './pages/WhatsAppAd';
import WhatsAppWidget from './pages/WhatsAppWidget';
import WhatsAppStore from './pages/WhatsAppStore';
import WhatsAppCRM from './pages/WhatsAppCRM';
import WhatsAppPayments from './pages/WhatsAppPayments';
import Triggers from './pages/Triggers';
import Keywords from './pages/Keywords';
import Sequences from './pages/Sequences';
import SequenceEditor from './pages/SequenceEditor';
import SettingsLayout from './components/SettingsLayout';
import WorkspaceProfile from './pages/Settings/WorkspaceProfile';
import Members from './pages/Settings/Members';
import AgentGroups from './pages/Settings/AgentGroups';
import BusinessHours from './pages/Settings/BusinessHours';
import AutomationLayout from './components/AutomationLayout';
import InstagramConnect from './pages/Instagram/InstagramConnect';
import InstagramCallback from './pages/Instagram/InstagramCallback';
import InstagramDashboard from './pages/Instagram/InstagramDashboard';
import InstagramAuthRedirect from './pages/Instagram/InstagramAuthRedirect';
import Ecommerce from './pages/Ecommerce';
import Billing from './pages/Billing';
import { WorkspaceProvider } from './contexts/WorkspaceContext';

import WorkspaceLayout from './components/WorkspaceLayout';
import WhatsAppLayout from './components/WhatsAppLayout';
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
          <Route path="analytics" element={<Analytics />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route element={<WhatsAppLayout />}>
            <Route path="whatsapp-cloud" element={<WhatsAppCloudSetup />} />
            <Route path="whatsapp-connected" element={<WhatsAppConnected />} />
            <Route path="whatsapp/templates" element={<WhatsAppTemplates />} />
            <Route path="whatsapp/flow-templates" element={<FlowTemplates />} />
            <Route path="whatsapp/ad" element={<WhatsAppAd />} />
            <Route path="whatsapp/widget" element={<WhatsAppWidget />} />
            <Route path="whatsapp/store" element={<WhatsAppStore />} />
            <Route path="whatsapp/payments" element={<WhatsAppPayments />} />
            <Route path="whatsapp/crm" element={<WhatsAppCRM />} />
            <Route path="whatsapp/contacts" element={<BotUsers />} />
            
            
            {/* Moved Flows, Automation and Content */}
            <Route path="whatsapp/chatbot-flows" element={<Flows />} />
            <Route path="whatsapp/flows/*" element={<WhatsAppFlows />} />
            <Route path="whatsapp/marketing/*" element={<WhatsAppMarketing />} />
            <Route path="whatsapp/catalog/*" element={<WhatsAppCatalog />} />
            <Route path="whatsapp/automation" element={<AutomationLayout />}>
              <Route path="triggers" element={<Triggers />} />
              <Route path="keywords" element={<Keywords />} />
              <Route path="sequences" element={<Sequences />} />
            </Route>
            <Route path="whatsapp/automation/sequences/:id" element={<SequenceEditor />} />
            <Route path="whatsapp/content" element={<ContentPage />} />
            <Route path="flow-builder/:id" element={<FlowBuilder />} />
          </Route>
          <Route path="livechat" element={<LiveChat />} />
          <Route path="instagram" element={<InstagramConnect />} />
          <Route path="instagram-callback" element={<InstagramCallback />} />
          <Route path="instagram-dashboard" element={<InstagramDashboard />} />
          <Route path="settings" element={<SettingsLayout />}>
            <Route path="profile" element={<WorkspaceProfile />} />
            <Route path="members" element={<Members />} />
            <Route path="agents" element={<AgentGroups />} />
            <Route path="hours" element={<BusinessHours />} />
          </Route>
          
          <Route path="ecommerce" element={<Ecommerce />} />
          <Route path="billing" element={<Billing />} />
        </Route>


        <Route path="/instagram-callback" element={<InstagramAuthRedirect />} />

        
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
