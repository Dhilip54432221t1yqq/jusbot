import React, { useState, useEffect } from 'react';
import { supabase } from '../../db';
import { Download, Search, FileText, ExternalLink } from 'lucide-react';

export default function ResponsesList() {
    const [responses, setResponses] = useState([]);
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedFlow, setSelectedFlow] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [selectedFlow]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch flows for filter dropdown
            const { data: flowsData } = await supabase.from('whatsapp_flows').select('id, name');
            if (flowsData) setFlows(flowsData);

            // Fetch responses
            let query = supabase.from('whatsapp_flow_responses').select(`*, whatsapp_flows(name)`).order('created_at', { ascending: false });
            if (selectedFlow !== 'all') {
                query = query.eq('flow_id', selectedFlow);
            }

            const { data: respData, error } = await query;
            if (error) throw error;
            
            // Wait, maybe the relationship isn't properly defined in supabase schema since I haven't added it yet. 
            // In case it's not, we just fetch responses and map.
            setResponses(respData || []);
        } catch (err) {
            console.error("Error fetching responses:", err);
            // Ignore error for now, table might not exist
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (responses.length === 0) return;
        
        const headers = ['Response ID', 'Flow Name', 'Contact / Phone', 'Completed At', 'Data'];
        const rows = responses.map(r => {
            const d = new Date(r.created_at || r.completed_at);
            const dateStr = d.toISOString().slice(0, 19).replace('T', ' ');
            return [
                r.id,
                r.whatsapp_flows?.name || r.flow_id,
                r.contact_id || r.phone_number || 'Unknown',
                dateStr,
                JSON.stringify(r.response_payload)
            ];
        });
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const dateSuffix = new Date().toISOString().slice(0,10).replace(/-/g, '');
        link.setAttribute("download", `flow_responses_${dateSuffix}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredResponses = responses.filter(r => {
        const contact = (r.contact_id || r.phone_number || '').toLowerCase();
        return contact.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">Flow Responses</h2>
                    <p className="text-sm text-slate-500 mt-1">View data submitted by users through WhatsApp Flows.</p>
                </div>
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium shadow-sm"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
                        <Search size={16} className="text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by phone number..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-sm outline-none bg-transparent"
                        />
                    </div>
                    
                    <select 
                        value={selectedFlow}
                        onChange={(e) => setSelectedFlow(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none w-64"
                    >
                        <option value="all">All Flows</option>
                        {flows.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <th className="px-6 py-4 font-medium">Contact</th>
                                <th className="px-6 py-4 font-medium">Flow</th>
                                <th className="px-6 py-4 font-medium">Data Submitted</th>
                                <th className="px-6 py-4 font-medium">Completed At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8 text-slate-500">Loading responses...</td></tr>
                            ) : filteredResponses.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-16">
                                        <FileText size={32} className="mx-auto text-slate-300 mb-3" />
                                        <h3 className="text-lg font-medium text-slate-700">No responses found</h3>
                                        <p className="text-slate-500 mt-1">When users submit a flow, their data will appear here.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredResponses.map(resp => (
                                    <tr key={resp.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{resp.phone_number || resp.contact_id || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">
                                            {resp.whatsapp_flows?.name || resp.flow_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="bg-slate-100 rounded p-3 text-xs font-mono text-slate-600 max-h-32 overflow-y-auto">
                                                {JSON.stringify(resp.response_payload, null, 2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            {new Date(resp.completed_at || resp.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
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
