import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import config from '../../config';

export default function MarketingDashboard() {
    const { workspaceId } = useParams();
    const [checks, setChecks] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrerequisites();
    }, [workspaceId]);

    const fetchPrerequisites = async () => {
        try {
            const res = await fetch(`${config.API_BASE}/whatsapp-marketing/prerequisites?workspaceId=${workspaceId}`);
            if (res.ok) {
                const data = await res.json();
                setChecks(data);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const CheckItem = ({ label, status, desc }) => {
        let icon = <HelpCircle className="text-slate-400" />;
        let statusClass = "text-slate-500 bg-slate-100";
        if (status === 'Complete') {
            icon = <ShieldCheck className="text-green-500" />;
            statusClass = "text-green-700 bg-green-50";
        } else if (status === 'Missing') {
            icon = <ShieldAlert className="text-red-500" />;
            statusClass = "text-red-700 bg-red-50";
        } else if (status === 'Warning') {
            icon = <AlertTriangle className="text-yellow-500" />;
            statusClass = "text-yellow-700 bg-yellow-50";
        }

        return (
            <div className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm mb-3">
                <div className="mt-1">{icon}</div>
                <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{label}</h4>
                    <p className="text-sm text-slate-500 mt-1">{desc}</p>
                </div>
                <div>
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md ${statusClass}`}>
                        {status || 'Unknown'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">Marketing API Readiness</h2>
                    <p className="text-slate-600 mt-2">
                        Before sending marketing traffic through the <code className="bg-slate-200 px-1 rounded">/marketing_messages</code> API, 
                        Meta requires several prerequisites to be met. If onboarding is incomplete, messages may fall back to the standard Cloud API.
                    </p>
                </div>

                {loading ? (
                    <div className="text-slate-500">Checking prerequisites...</div>
                ) : (
                    <div className="space-y-2">
                        <CheckItem 
                            label="WhatsApp Business Account (WABA)" 
                            desc="A valid WABA ID must be configured in your settings." 
                            status={checks?.waba_exists} 
                        />
                        <CheckItem 
                            label="Business Phone Number" 
                            desc="The sender phone number ID must be registered and verified." 
                            status={checks?.phone_registered} 
                        />
                        <CheckItem 
                            label="Access Token Permissions" 
                            desc="The system token needs whatsapp_business_messaging permissions." 
                            status={checks?.token_valid} 
                        />
                        <CheckItem 
                            label="Marketing Templates" 
                            desc="At least one APPROVED template in the 'MARKETING' category must exist in your account." 
                            status={checks?.marketing_templates_exist} 
                        />
                        <CheckItem 
                            label="Marketing Messages Onboarding" 
                            desc="The WABA must be fully onboarded to use the marketing messages endpoint." 
                            status={checks?.onboarding_completed} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
