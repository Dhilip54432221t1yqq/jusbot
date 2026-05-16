import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';
import LottieLoader from '../../components/LottieLoader';

export default function InstagramCallback() {
  const [searchParams] = useSearchParams();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    const exchangeToken = async () => {
      const code = searchParams.get('code');
      if (!code) {
        setStatus('error');
        setError('No authorization code received from Facebook.');
        return;
      }

      try {
        const response = await authFetch(`${config.API_BASE}/instagram/exchange-token`, {
          method: 'POST',
          body: JSON.stringify({
            code,
            workspaceId
          })
        });

        const data = await response.json();
        if (data.success) {
          setStatus('success');
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate(`/${workspaceId}/instagram-dashboard`);
          }, 2000);
        } else {
          throw new Error(data.error || 'Failed to link Instagram account.');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message);
      }
    };

    exchangeToken();
  }, [searchParams, workspaceId, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100">
        {status === 'processing' && (
          <>
            <div className="mx-auto mb-6">
              <LottieLoader size={200} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Connecting to Instagram</h2>
            <p className="text-slate-500">Please wait while we set up your account...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Success!</h2>
            <p className="text-slate-500">Your Instagram account has been linked successfully.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Connection Failed</h2>
            <p className="text-red-500 mb-6">{error}</p>
            <button
              onClick={() => navigate(`/${workspaceId}/instagram`)}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
