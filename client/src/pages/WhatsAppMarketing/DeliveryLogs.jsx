import React, { useState, useEffect } from 'react';
import { supabase } from '../../db';
import { Download, Search, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function DeliveryLogs() {
    const { workspaceId } = useParams();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [workspaceId]);

    const fetchLogs = async () => {
        try {
            const { data } = await supabase.from('whatsapp_marketing_message_logs')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });
            
            if (data) setLogs(data);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'delivered':
            case 'read':
                return <span className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded text-xs font-medium"><CheckCircle size={12}/> {status}</span>;
            case 'failed':
                return <span className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs font-medium"><XCircle size={12}/> {status}</span>;
            case 'sent':
                return <span className="flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs font-medium"><CheckCircle size={12}/> {status}</span>;
            default:
                return <span className="flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-medium"><Clock size={12}/> {status}</span>;
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">Delivery Logs</h2>
                    <p className="text-sm text-slate-500 mt-1">Track the status of all outgoing marketing messages.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <th className="px-6 py-4 font-medium">Recipient</th>
                                <th className="px-6 py-4 font-medium">Sent Via</th>
                                <th className="px-6 py-4 font-medium">Pricing</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-16 text-slate-500">
                                        No marketing messages have been sent yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{log.phone_number || log.bsuid}</div>
                                            {log.meta_message_id && <div className="text-xs text-slate-400 font-mono mt-1" title={log.meta_message_id}>ID: {log.meta_message_id.substring(0, 16)}...</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {log.sent_via || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {log.pricing_category || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(log.status)}
                                            {log.error_message && <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={log.error_message}>{log.error_message}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
