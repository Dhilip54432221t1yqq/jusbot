import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useParams, Outlet, useLocation } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import LottieLoader from './LottieLoader';

export default function WorkspaceLayout() {
    const { workspaceId } = useParams();
    const { fetchWorkspace, loading } = useWorkspace();
    const location = useLocation();

    useEffect(() => {
        if (workspaceId) {
            fetchWorkspace(workspaceId);
        }
    }, [workspaceId]);

    // Determine activeNav from location
    const getActiveNav = () => {
        const path = location.pathname;
        if (path.includes('/dashboard')) return 'Dashboard';
        if (path.includes('/flows')) return 'Flows';
        if (path.includes('/automation/triggers')) return 'Triggers';
        if (path.includes('/automation/keywords')) return 'Keywords';
        if (path.includes('/automation/sequences')) return 'Sequences';
        if (path.includes('/content')) return 'Content';
        if (path.includes('/livechat')) return 'Live Chat';
        if (path.includes('/contacts')) return 'Bot Users';
        if (path.includes('/integrations')) return 'Integration';
        if (path.includes('/ecommerce')) return 'Ecommerce';
        if (path.includes('/settings/profile')) return 'Profile';
        if (path.includes('/settings/members')) return 'Members';
        if (path.includes('/settings/agents')) return 'Agent Groups';
        if (path.includes('/settings/hours')) return 'Business Hours';
        if (path.includes('/settings')) return 'Workspace Settings';

        return '';
    };

    if (loading) {
        return <LottieLoader fullPage={true} />;
    }

    const isWhatsAppSetup = location.pathname.includes('/whatsapp-cloud');
    const hideSidebar = location.pathname.includes('/flow-builder/'); 

    return (
        <div className="flex flex-col h-screen bg-slate-50/50" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Full-width Header */}
            <Header />
            
            {/* Sidebar + Content below header */}
            <div className="flex flex-1 overflow-hidden">
                {!hideSidebar && <Sidebar activeNav={getActiveNav()} />}
                <main className="flex-1 overflow-y-auto bg-slate-50/30">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
