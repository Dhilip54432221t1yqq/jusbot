import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function InstagramAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state'); // our workspaceId

    if (code && state) {
      // Redirect to the workspace-specific callback page
      navigate(`/${state}/instagram-callback${location.search}`);
    } else {
      // Fallback if something is missing
      navigate('/');
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Redirecting you back to your workspace...</p>
      </div>
    </div>
  );
}
