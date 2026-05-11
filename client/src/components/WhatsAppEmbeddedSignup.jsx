import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, Loader2 } from 'lucide-react';
import config from '../config';

const WhatsAppEmbeddedSignup = ({ workspaceId, onSetupComplete }) => {
  const [status, setStatus] = useState('NOT_CONNECTED'); // 'NOT_CONNECTED', 'CONNECTING', 'CONNECTED'
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [error, setError] = useState(null);

  const fbAppId = import.meta.env.VITE_FB_APP_ID || '';
  const fbConfigId = import.meta.env.VITE_FB_CONFIG_ID || '';

  useEffect(() => {
    // Initialize FB SDK if it's already loaded, or define the init function
    const initFbSdk = () => {
      if (window.FB) {
        window.FB.init({
          appId: fbAppId,
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v23.0' // Latest version
        });
      }
    };

    if (window.FB) {
      initFbSdk();
    } else {
      window.fbAsyncInit = initFbSdk;
    }
  }, [fbAppId]);

  useEffect(() => {
    // Listen for messages from the Embedded Signup flow popup
    const handleMessage = async (event) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          // If error tracking was needed via postMessage
          if (data.event === 'CANCEL' || data.event === 'ERROR') {
             setStatus('NOT_CONNECTED');
             console.log("Signup flow abandoned or errored:", data);
             // Could send logs to backend here
             if (data.event === 'ERROR') {
                 setError('An error occurred during WhatsApp setup.');
             }
          }
        }
      } catch (e) {
        // Not all messages will parse as JSON
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [workspaceId]);

  const launchSignup = () => {
    if (!window.FB) {
      setError('Facebook SDK failed to load. Please disable adblockers or try again.');
      return;
    }
    
    if (!fbAppId || !fbConfigId) {
        setError('Missing Facebook App ID or Configuration ID. Please configure environment variables.');
        return;
    }

    setStatus('CONNECTING');
    setError(null);

    window.FB.login(
      async (response) => {
        if (response.authResponse) {
          const authCode = response.authResponse.code;
          
          if (!authCode) {
               setStatus('NOT_CONNECTED');
               setError("No authorization code received.");
               return;
          }

          try {
            // Immediately exchange code for token
            const res = await fetch(`${config.API_BASE}/whatsapp-cloud/exchange-code`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: authCode,
                workspaceId
              })
            });

            const data = await res.json();
            
            if (data.success) {
                // Now we have long-lived token. The backend or frontend logic should now 
                // onboard the user (grabbing WABA ID, Phone ID) if not done inside exchange-code.
                // For this implementation, we assume exchange-code returns the details or triggers onboard.
                
                // Let's call the onboard endpoint with the returned data from FB graph (if available)
                // Assuming exchange code gives back access_token, and we can fetch accounts,
                // OR backend does it all. Let's assume the backend does it since it exchanges the code.
                
                setStatus('CONNECTED');
                setConnectionDetails({
                    wabaId: data.wabaId || 'Fetched via Graph',
                    phoneId: data.phoneId || 'Fetched via Graph'
                });
                
                if (onSetupComplete) onSetupComplete(true);
            } else {
                throw new Error(data.error || 'Failed to exchange token');
            }
          } catch (err) {
            console.error('Exchange error:', err);
            setError('Failed to setup integration on our end: ' + err.message);
            setStatus('NOT_CONNECTED');
          }
        } else {
            // User cancelled or error
            console.log('User cancelled login or did not fully authorize.');
            setStatus('NOT_CONNECTED');
        }
      },
      {
        config_id: fbConfigId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureProxy: true
        }
      }
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4">
             <div className="bg-[#25D366]/10 text-[#128C7E] text-xs font-bold px-3 py-1 rounded-full border border-[#25D366]/20 flex items-center gap-1.5">
                 <MessageCircle size={14} /> Embedded Signup
             </div>
        </div>
        
        <h3 className="textlg font-bold text-slate-800 mb-2">Fast Setup</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
            Use Meta's quick setup to automatically configure your WhatsApp Business Account.
        </p>

        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
            </div>
        )}

        {status === 'NOT_CONNECTED' && (
            <div className="flex justify-start">
                <button
                    onClick={launchSignup}
                    className="px-5 py-2.5 bg-[#4B84FF] hover:bg-[#3970EA] text-white font-bold rounded-lg flex items-center gap-2.5 transition-colors shadow-sm"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Connect WhatsApp Business
                </button>
            </div>
        )}

        {status === 'CONNECTING' && (
            <div className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Connecting...
            </div>
        )}

        {status === 'CONNECTED' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700 font-bold mb-3">
                    <CheckCircle size={18} />
                    Connected Successfully!
                </div>
                {connectionDetails && (
                     <div className="space-y-1.5 pt-3 border-t border-green-200/50">
                        <p className="text-xs text-green-800 flex justify-between">
                            <span className="opacity-70">WABA ID:</span>
                            <span className="font-mono">{connectionDetails.wabaId}</span>
                        </p>
                        <p className="text-xs text-green-800 flex justify-between">
                            <span className="opacity-70">Phone ID:</span>
                            <span className="font-mono">{connectionDetails.phoneId}</span>
                        </p>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default WhatsAppEmbeddedSignup;
