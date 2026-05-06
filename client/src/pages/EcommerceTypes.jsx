import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import { toast } from 'react-hot-toast';
import { Search, Plus, Edit3, X } from 'lucide-react';

const API_BASE = `${config.API_BASE}/ecommerce`;

const TYPES_STYLES = `
  .ecom-types {
    --blue: #2196F3;
    --blue-hover: #1976D2;
    --red: #ef4444;
    --border: #e5e7eb;
    --text-primary: #111827;
    --text-secondary: #6b7280;
    --text-muted: #9ca3af;
    --font: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    font-family: var(--font);
    font-size: 13px;
    color: var(--text-primary);
    padding: 0;
  }
  .ecom-types .t-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .ecom-types .t-search-wrap { display: flex; align-items: center; gap: 6px; }
  .ecom-types .t-search { width: 160px; padding: 7px 10px; border: 1px solid var(--border); border-radius: 6px; font-size: 12px; font-family: var(--font); color: var(--text-primary); outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  .ecom-types .t-search:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(33,150,243,0.10); }
  .ecom-types .t-search::placeholder { color: var(--text-muted); }
  .ecom-types .t-search-btn { width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 6px; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); transition: background 0.12s; }
  .ecom-types .t-search-btn:hover { background: #f3f4f6; }
  .ecom-types .t-add-btn { display: flex; align-items: center; gap: 5px; padding: 7px 16px; background: var(--blue); color: #fff; border: none; border-radius: 6px; font-size: 12.5px; font-weight: 600; font-family: var(--font); cursor: pointer; transition: background 0.15s; }
  .ecom-types .t-add-btn:hover { background: var(--blue-hover); }
  .ecom-types .t-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .ecom-types .t-table th { text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 600; color: var(--blue); text-transform: capitalize; border-bottom: 2px solid var(--blue); background: #fff; letter-spacing: 0.02em; }
  .ecom-types .t-table td { padding: 10px 16px; font-size: 12.5px; color: var(--text-primary); border-bottom: 1px solid #f3f4f6; }
  .ecom-types .t-table tr:last-child td { border-bottom: none; }
  .ecom-types .t-table tr:hover td { background: #f9fafb; }
  .ecom-types .t-edit-btn { width: 30px; height: 30px; border: 1px solid var(--border); border-radius: 5px; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); transition: all 0.12s; }
  .ecom-types .t-edit-btn:hover { background: #f0f7ff; color: var(--blue); border-color: var(--blue); }
  .ecom-types .t-empty { text-align: center; padding: 60px 20px; color: var(--text-muted); font-size: 13px; }

  .t-modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.32); display: flex; align-items: center; justify-content: center; animation: tFadeIn 0.15s ease; }
  @keyframes tFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .t-modal { background: #fff; border-radius: 8px; width: 520px; max-width: 92vw; box-shadow: 0 20px 60px rgba(0,0,0,0.18); animation: tSlideUp 0.2s ease; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif; overflow: hidden; }
  @keyframes tSlideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .t-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }
  .t-modal-header h3 { font-size: 14px; font-weight: 600; color: #111827; margin: 0; }
  .t-modal-close { width: 28px; height: 28px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; border-radius: 5px; transition: all 0.12s; }
  .t-modal-close:hover { background: #f3f4f6; color: #111827; }
  .t-modal-body { padding: 8px 20px 20px; }
  .t-modal-body .t-field-label { display: block; font-size: 12px; font-weight: 500; color: #111827; margin-bottom: 6px; }
  .t-modal-body .t-field-label .req { color: #ef4444; margin-right: 2px; }
  .t-modal-body .t-input { width: 100%; padding: 9px 12px; border: 1.5px solid #2196F3; border-radius: 6px; font-size: 13px; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif; color: #111827; outline: none; transition: border-color 0.15s, box-shadow 0.15s; box-shadow: 0 0 0 3px rgba(33,150,243,0.08); }
  .t-modal-body .t-input:focus { border-color: #2196F3; box-shadow: 0 0 0 3px rgba(33,150,243,0.12); }
  .t-modal-body .t-input::placeholder { color: #9ca3af; }
  .t-modal-body .t-char-hint { text-align: right; font-size: 10.5px; color: #9ca3af; margin-top: 3px; }
  .t-modal-divider { height: 1px; background: #e5e7eb; margin: 16px 0 14px; }
  .t-modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 0 20px 16px; }
  .t-modal-footer.has-delete { justify-content: space-between; }
  .t-modal-cancel { padding: 7px 18px; border: 1px solid #e5e7eb; border-radius: 5px; background: #fff; font-size: 12.5px; font-weight: 500; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif; color: #374151; cursor: pointer; transition: all 0.12s; }
  .t-modal-cancel:hover { background: #f9fafb; border-color: #d1d5db; }
  .t-modal-save { padding: 7px 22px; border: none; border-radius: 5px; background: #2196F3; font-size: 12.5px; font-weight: 600; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif; color: #fff; cursor: pointer; transition: background 0.12s; }
  .t-modal-save:hover { background: #1976D2; }
  .t-modal-delete { padding: 7px 18px; border: none; border-radius: 5px; background: #ef4444; font-size: 12.5px; font-weight: 600; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif; color: #fff; cursor: pointer; transition: background 0.12s; }
  .t-modal-delete:hover { background: #dc2626; }
`;

// Remove local ID generation

export default function EcommerceTypes() {
    const { workspaceId } = useParams();
    const { authFetch } = useAuth();
    const [types, setTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');

    const fetchTypes = useCallback(async () => {
        if (!workspaceId) return;
        try {
            const res = await authFetch(`${API_BASE}/types?workspaceId=${workspaceId}`);
            if (res.ok) {
                const data = await res.json();
                setTypes(data);
            }
        } catch (error) {
            console.error('Failed to fetch types:', error);
        } finally {
            setLoading(false);
        }
    }, [workspaceId, authFetch]);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    const openAdd = useCallback(() => { setEditing(null); setName(''); setShowModal(true); }, []);
    const openEdit = useCallback((item) => { setEditing(item); setName(item.name); setShowModal(true); }, []);
    const closeModal = useCallback(() => { setShowModal(false); setEditing(null); setName(''); }, []);

    const handleSave = useCallback(async () => {
        const trimmed = name.trim();
        if (!trimmed) return;

        try {
            if (editing) {
                const res = await authFetch(`${API_BASE}/types/${editing.id}?workspaceId=${workspaceId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: trimmed })
                });
                if (res.ok) {
                    toast.success('Type updated');
                    fetchTypes();
                } else toast.error('Failed to update type');
            } else {
                const res = await authFetch(`${API_BASE}/types?workspaceId=${workspaceId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: trimmed })
                });
                if (res.ok) {
                    toast.success('Type created');
                    fetchTypes();
                } else toast.error('Failed to create type');
            }
        } catch (error) {
            toast.error('Error saving type');
        }
        closeModal();
    }, [name, editing, closeModal, workspaceId, authFetch, fetchTypes]);

    const handleDelete = useCallback(async () => {
        if (editing) {
            try {
                const res = await authFetch(`${API_BASE}/types/${editing.id}?workspaceId=${workspaceId}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    toast.success('Type deleted');
                    fetchTypes();
                } else toast.error('Failed to delete type');
            } catch (error) {
                toast.error('Error deleting type');
            }
        }
        closeModal();
    }, [editing, closeModal, workspaceId, authFetch, fetchTypes]);

    const filtered = types.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <>
            <style>{TYPES_STYLES}</style>
            <div className="ecom-types">
                <div className="t-toolbar">
                    <div className="t-search-wrap">
                        <input type="text" className="t-search" placeholder="Search by name" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        <button className="t-search-btn"><Search size={14} /></button>
                    </div>
                    <button className="t-add-btn" onClick={openAdd}><Plus size={14} strokeWidth={2.5} /> Type</button>
                </div>

                {filtered.length > 0 ? (
                    <table className="t-table">
                        <thead><tr><th style={{ width: 300 }}>Id</th><th>Name</th><th>Usage Count</th><th style={{ width: 50 }}></th></tr></thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.id}</td><td>{t.name}</td><td>{t.usageCount}</td>
                                    <td><button className="t-edit-btn" onClick={() => openEdit(t)}><Edit3 size={14} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : loading ? (
                    <div className="t-table" style={{ borderRadius: 8 }}>
                        <div className="t-empty">Loading types...</div>
                    </div>
                ) : (
                    <div className="t-table" style={{ borderRadius: 8 }}>
                        <div className="t-empty">{types.length === 0 ? 'No types created yet. Click "+ Type" to add one.' : 'No types match your search.'}</div>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="t-modal-overlay" onClick={closeModal}>
                    <div className="t-modal" onClick={e => e.stopPropagation()}>
                        <div className="t-modal-header">
                            <h3>{editing ? 'Edit Type' : 'Add New Type'}</h3>
                            <button className="t-modal-close" onClick={closeModal}><X size={16} /></button>
                        </div>
                        <div className="t-modal-body">
                            <label className="t-field-label"><span className="req">*</span> Name</label>
                            <input type="text" className="t-input" placeholder="Enter a name" value={name} onChange={e => setName(e.target.value)} maxLength={100} autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSave(); }} />
                            <div className="t-char-hint">{name.length}/100</div>
                            <div className="t-modal-divider" />
                        </div>
                        <div className={`t-modal-footer ${editing ? 'has-delete' : ''}`}>
                            {editing && <button className="t-modal-delete" onClick={handleDelete}>Delete</button>}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="t-modal-cancel" onClick={closeModal}>Cancel</button>
                                <button className="t-modal-save" onClick={handleSave}>Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
