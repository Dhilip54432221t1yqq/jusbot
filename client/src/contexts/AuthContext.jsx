import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Initialize: check for existing session
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session: existingSession } } = await supabase.auth.getSession();
                if (existingSession) {
                    setSession(existingSession);
                    setUser(existingSession.user);
                }
            } catch (err) {
                console.error('[Auth] Failed to get session:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth state changes (login, logout, token refresh, expiry)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, newSession) => {
                switch (event) {
                    case 'SIGNED_IN':
                        setSession(newSession);
                        setUser(newSession?.user || null);
                        break;
                    case 'SIGNED_OUT':
                        setSession(null);
                        setUser(null);
                        navigate('/', { replace: true });
                        break;
                    case 'TOKEN_REFRESHED':
                        setSession(newSession);
                        setUser(newSession?.user || null);
                        break;
                    case 'USER_UPDATED':
                        setUser(newSession?.user || null);
                        break;
                    default:
                        break;
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, [navigate]);

    /**
     * Returns auth headers for API calls.
     * Automatically fetches the current session and extracts the access token.
     */
    const getAuthHeaders = useCallback(async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession?.access_token) {
            // Session expired — redirect to login
            navigate('/', { replace: true });
            throw new Error('Session expired. Please log in again.');
        }
        return {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json'
        };
    }, [navigate]);

    /**
     * Makes an authenticated fetch call.
     * Automatically includes the JWT token in the Authorization header.
     */
    const authFetch = useCallback(async (url, options = {}) => {
        const headers = await getAuthHeaders();
        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        });

        // If we get a 401, the token is invalid/expired
        if (response.status === 401) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error === 'Session expired' || errorData.error === 'Invalid token') {
                await supabase.auth.signOut();
                navigate('/', { replace: true });
            }
            throw new Error(errorData.message || 'Authentication failed');
        }

        return response;
    }, [getAuthHeaders, navigate]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        navigate('/', { replace: true });
    }, [navigate]);

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            getAuthHeaders,
            authFetch,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
