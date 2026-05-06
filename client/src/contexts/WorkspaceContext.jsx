import { createContext, useContext, useState } from 'react';
import { supabase } from '../supabase';
import config from '../config';

const WorkspaceContext = createContext(null);

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};

/**
 * Helper to get auth headers for API calls.
 * Fetches the current session and returns Bearer token headers.
 */
const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('No active session. Please log in again.');
    }
    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
    };
};

export const WorkspaceProvider = ({ children }) => {
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);

    const fetchWorkspace = async (workspaceId) => {
        if (!workspaceId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .eq('id', workspaceId)
                .single();

            if (data) {
                setActiveWorkspace(data);
            } else if (error) {
                console.error('Error fetching workspace:', error);
            }
        } catch (err) {
            console.error('Unexpected error fetching workspace:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkspaces = async () => {
        setListLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${config.API_BASE}/workspaces`, { headers });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setWorkspaces(data);
            }
        } catch (err) {
            console.error('Error fetching workspace list:', err);
        } finally {
            setListLoading(false);
        }
    };

    return (
        <WorkspaceContext.Provider value={{ 
            activeWorkspace, 
            setActiveWorkspace, 
            fetchWorkspace, 
            workspaces, 
            fetchWorkspaces,
            loading,
            listLoading,
            getAuthHeaders  // expose helper for child components
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
};
