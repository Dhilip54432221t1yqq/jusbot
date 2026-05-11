import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Upload, Globe, Palette, CheckCircle2, 
    Copy, Info, Loader2, Image as ImageIcon
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../supabase';
import config from '../../config';

const timezones = [
    { value: 'UTC', label: '(UTC+00:00) UTC' },
    { value: 'America/New_York', label: '(UTC-05:00) Eastern Time' },
    { value: 'America/Chicago', label: '(UTC-06:00) Central Time' },
    { value: 'America/Denver', label: '(UTC-07:00) Mountain Time' },
    { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time' },
    { value: 'Europe/London', label: '(UTC+00:00) London' },
    { value: 'Europe/Paris', label: '(UTC+01:00) Paris' },
    { value: 'Asia/Dubai', label: '(UTC+04:00) Dubai' },
    { value: 'Asia/Kolkata', label: '(UTC+05:30) Chennai, Mumbai, Kolkata' },
    { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore' },
    { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo' },
    { value: 'Australia/Sydney', label: '(UTC+11:00) Sydney' }
];

const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'custom', label: 'Custom' }
];

export default function WorkspaceProfile() {
    const { workspaceId } = useParams();
    /** @type {any} */
    const { activeWorkspace, fetchWorkspace, getAuthHeaders } = useWorkspace();
    
    const [formData, setFormData] = useState({
        name: '',
        timezone: 'UTC',
        default_theme: 'light',
        logo_url: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (activeWorkspace) {
            setFormData({
                name: activeWorkspace.name || '',
                timezone: activeWorkspace.timezone || 'UTC',
                default_theme: activeWorkspace.default_theme || 'light',
                logo_url: activeWorkspace.logo_url || ''
            });
        }
    }, [activeWorkspace]);

    const handleCopyId = () => {
        navigator.clipboard.writeText(workspaceId || '');
        // Could add a toast here
    };

    const handleLogoUpload = async (/** @type {any} */ e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // --- Dimension Check ---
        const checkDimensions = () => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                if (img.width < 512 || img.height < 512) {
                    reject(new Error(`Image is too small (${img.width}x${img.height}). Please use at least 512x512px.`));
                } else {
                    resolve(true);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image for validation.'));
            img.src = URL.createObjectURL(file);
        });

        try {
            await checkDimensions();
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${workspaceId}-${Math.random()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('workspace-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('workspace-assets')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Logo Upload Failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (/** @type {any} */ e) => {
        e.preventDefault();
        setLoading(true);
        setSaved(false);

        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${config.API_BASE}/workspaces/${workspaceId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update workspace');

            await fetchWorkspace(workspaceId);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error updating workspace:', error);
            alert('Failed to update workspace settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
                    Workspace Profile
                </h1>
                <p className="text-slate-500 text-sm mt-1">Manage your workspace branding and general settings.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Workspace Branding</h2>
                    
                    <div className="flex items-center gap-8">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-green-400">
                                {formData.logo_url ? (
                                    <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-slate-300 w-8 h-8" />
                                )}
                                
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 bg-white shadow-lg border border-slate-100 p-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all text-slate-600">
                                <Upload size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                            </label>
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 text-sm mb-1">Workspace Logo</h3>
                            <p className="text-xs text-slate-400 mb-4">Recommended: Square image, at least 512x512px. PNG or JPG.</p>
                            <div className="flex gap-2">
                                <label className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 transition-all">
                                    Upload New Logo
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                                </label>
                                {formData.logo_url && (
                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                                        className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
                                    >
                                        Remove Logo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">General Settings</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Workspace ID</label>
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 group">
                                <code className="text-xs font-bold text-slate-400 flex-1 truncate">{workspaceId}</code>
                                <button type="button" onClick={handleCopyId} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <Copy size={14} />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Info size={10} /> This ID is used for API access and unique identification.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Workspace Name</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                                    placeholder="e.g. Acme Corp"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Globe size={14} /> Timezone
                            </label>
                            <select 
                                value={formData.timezone}
                                onChange={e => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none appearance-none"
                            >
                                {timezones.map(tz => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Palette size={14} /> Default Theme
                            </label>
                            <div className="flex gap-2">
                                {themes.map(theme => (
                                    <button
                                        key={theme.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, default_theme: theme.value }))}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                            formData.default_theme === theme.value
                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        {theme.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        {saved && (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-bold animate-in fade-in slide-in-from-left-4">
                                <CheckCircle2 size={16} />
                                Settings saved successfully!
                            </div>
                        )}
                    </div>
                    <button 
                        type="submit"
                        disabled={loading || uploading}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-200 hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Update Workspace
                    </button>
                </div>
            </form>
        </div>
    );
}
