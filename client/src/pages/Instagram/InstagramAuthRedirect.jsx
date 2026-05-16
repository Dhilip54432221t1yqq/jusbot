import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LottieLoader from '../../components/LottieLoader';

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
      <LottieLoader size={140} message="Redirecting you back to your workspace..." />
    </div>
  );
}
