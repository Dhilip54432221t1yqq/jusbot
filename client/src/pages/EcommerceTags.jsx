import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import { toast } from 'react-hot-toast';
import { Search, Plus, Edit3, X } from 'lucide-react';

const API_BASE = `${config.API_BASE}/ecommerce`;

const TAGS_STYLES = `
  .ecom-tags {
    --blue: #2196F3;
    --blue-hover: #1976D2;
    --red: #ef4444;
    --red-hover: #dc2626;
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

  .ecom-tags .tags-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .ecom-tags .tags-search-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ecom-tags .tags-search {
    width: 160px;
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 12px;
    font-family: var(--font);
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ecom-tags .tags-search:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(33,150,243,0.10);
  }
  .ecom-tags .tags-search::placeholder { color: var(--text-muted); }

  .ecom-tags .tags-search-btn {
    width: 32px;
    height: 32px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary);
    transition: background 0.12s;
  }
  .ecom-tags .tags-search-btn:hover { background: #f3f4f6; }

  .ecom-tags .add-tag-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 16px;
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 600;
    font-family: var(--font);
    cursor: pointer;
    transition: background 0.15s;
  }
  .ecom-tags .add-tag-btn:hover { background: var(--blue-hover); }

  .ecom-tags .tags-table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .ecom-tags .tags-table th {
    text-align: left;
    padding: 10px 16px;
    font-size: 11px;
    font-weight: 600;
    color: var(--blue);
    text-transform: capitalize;
    border-bottom: 2px solid var(--blue);
    background: #fff;
    letter-spacing: 0.02em;
  }

  .ecom-tags .tags-table td {
    padding: 10px 16px;
    font-size: 12.5px;
    color: var(--text-primary);
    border-bottom: 1px solid #f3f4f6;
  }

  .ecom-tags .tags-table tr:last-child td { border-bottom: none; }

  .ecom-tags .tags-table tr:hover td { background: #f9fafb; }

  .ecom-tags .edit-icon-btn {
    width: 30px;
    height: 30px;
    border: 1px solid var(--border);
    border-radius: 5px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.12s;
  }
  .ecom-tags .edit-icon-btn:hover { background: #f0f7ff; color: var(--blue); border-color: var(--blue); }

  .ecom-tags .tags-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-muted);
    font-size: 13px;
  }

  /* Modal Overlay */
  .tag-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0,0,0,0.32);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: tagFadeIn 0.15s ease;
  }
  @keyframes tagFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .tag-modal {
    background: #fff;
    border-radius: 8px;
    width: 520px;
    max-width: 92vw;
    box-shadow: 0 20px 60px rgba(0,0,0,0.18);
    animation: tagSlideUp 0.2s ease;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    overflow: hidden;
  }
  @keyframes tagSlideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .tag-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
  }

  .tag-modal-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .tag-modal-close {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #9ca3af;
    border-radius: 5px;
    transition: all 0.12s;
  }
  .tag-modal-close:hover { background: #f3f4f6; color: #111827; }

  .tag-modal-body {
    padding: 8px 20px 20px;
  }

  .tag-modal-body .field-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #111827;
    margin-bottom: 6px;
  }
  .tag-modal-body .field-label .req { color: #ef4444; margin-right: 2px; }

  .tag-modal-body .tag-input {
    width: 100%;
    padding: 9px 12px;
    border: 1.5px solid #2196F3;
    border-radius: 6px;
    font-size: 13px;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #111827;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-shadow: 0 0 0 3px rgba(33,150,243,0.08);
  }
  .tag-modal-body .tag-input:focus {
    border-color: #2196F3;
    box-shadow: 0 0 0 3px rgba(33,150,243,0.12);
  }
  .tag-modal-body .tag-input::placeholder { color: #9ca3af; }

  .tag-modal-body .char-hint {
    text-align: right;
    font-size: 10.5px;
    color: #9ca3af;
    margin-top: 3px;
  }

  .tag-modal-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 16px 0 14px;
  }

  .tag-modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 20px 16px;
  }

  .tag-modal-footer.has-delete {
    justify-content: space-between;
  }

  .tag-modal-cancel {
    padding: 7px 18px;
    border: 1px solid #e5e7eb;
    border-radius: 5px;
    background: #fff;
    font-size: 12.5px;
    font-weight: 500;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #374151;
    cursor: pointer;
    transition: all 0.12s;
  }
  .tag-modal-cancel:hover { background: #f9fafb; border-color: #d1d5db; }

  .tag-modal-save {
    padding: 7px 22px;
    border: none;
    border-radius: 5px;
    background: #2196F3;
    font-size: 12.5px;
    font-weight: 600;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #fff;
    cursor: pointer;
    transition: background 0.12s;
  }
  .tag-modal-save:hover { background: #1976D2; }

  .tag-modal-delete {
    padding: 7px 18px;
    border: none;
    border-radius: 5px;
    background: #ef4444;
    font-size: 12.5px;
    font-weight: 600;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #fff;
    cursor: pointer;
    transition: background 0.12s;
  }
  .tag-modal-delete:hover { background: #dc2626; }
`;

// Remove local ID generation

export default function EcommerceTags() {
    const { workspaceId } = useParams();
    const { authFetch } = useAuth();
    const [tags, setTags] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingTag, setEditingTag] = useState(null); // null = add mode, object = edit mode
    const [tagName, setTagName] = useState('');

    const fetchTags = useCallback(async () => {
        if (!workspaceId) return;
        try {
            const res = await authFetch(`${API_BASE}/tags?workspaceId=${workspaceId}`);
            if (res.ok) {
                const data = await res.json();
                setTags(data);
            }
        } catch (error) {
            console.error('Failed to fetch tags:', error);
        } finally {
            setLoading(false);
        }
    }, [workspaceId, authFetch]);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    const openAddModal = useCallback(() => {
        setEditingTag(null);
        setTagName('');
        setShowModal(true);
    }, []);

    const openEditModal = useCallback((tag) => {
        setEditingTag(tag);
        setTagName(tag.name);
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditingTag(null);
        setTagName('');
    }, []);

    const handleSave = useCallback(async () => {
        const trimmed = tagName.trim();
        if (!trimmed) return;

        try {
            if (editingTag) {
                // Update existing tag
                const res = await authFetch(`${API_BASE}/tags/${editingTag.id}?workspaceId=${workspaceId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: trimmed })
                });
                if (res.ok) {
                    toast.success('Tag updated');
                    fetchTags();
                } else toast.error('Failed to update tag');
            } else {
                // Create new tag
                const res = await authFetch(`${API_BASE}/tags?workspaceId=${workspaceId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: trimmed })
                });
                if (res.ok) {
                    toast.success('Tag created');
                    fetchTags();
                } else toast.error('Failed to create tag');
            }
        } catch (error) {
            toast.error('Error saving tag');
        }
        closeModal();
    }, [tagName, editingTag, closeModal, workspaceId, authFetch, fetchTags]);

    const handleDelete = useCallback(async () => {
        if (editingTag) {
            try {
                const res = await authFetch(`${API_BASE}/tags/${editingTag.id}?workspaceId=${workspaceId}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    toast.success('Tag deleted');
                    fetchTags();
                } else toast.error('Failed to delete tag');
            } catch (error) {
                toast.error('Error deleting tag');
            }
        }
        closeModal();
    }, [editingTag, closeModal, workspaceId, authFetch, fetchTags]);

    const filteredTags = tags.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <style>{TAGS_STYLES}</style>
            <div className="ecom-tags">
                {/* Toolbar */}
                <div className="tags-toolbar">
                    <div className="tags-search-wrap">
                        <input
                            type="text"
                            className="tags-search"
                            placeholder="Search by name"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <button className="tags-search-btn">
                            <Search size={14} />
                        </button>
                    </div>
                    <button className="add-tag-btn" onClick={openAddModal}>
                        <Plus size={14} strokeWidth={2.5} /> Tag
                    </button>
                </div>

                {/* Table */}
                {filteredTags.length > 0 ? (
                    <table className="tags-table">
                        <thead>
                            <tr>
                                <th style={{ width: 300 }}>Id</th>
                                <th>Name</th>
                                <th>Usage Count</th>
                                <th style={{ width: 50 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTags.map(tag => (
                                <tr key={tag.id}>
                                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tag.id}</td>
                                    <td>{tag.name}</td>
                                    <td>{tag.usageCount}</td>
                                    <td>
                                        <button className="edit-icon-btn" onClick={() => openEditModal(tag)}>
                                            <Edit3 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : loading ? (
                    <div className="tags-table" style={{ borderRadius: 8 }}>
                        <div className="tags-empty">Loading tags...</div>
                    </div>
                ) : (
                    <div className="tags-table" style={{ borderRadius: 8 }}>
                        <div className="tags-empty">
                            {tags.length === 0
                                ? 'No tags created yet. Click "+ Tag" to add one.'
                                : 'No tags match your search.'}
                        </div>
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="tag-modal-overlay" onClick={closeModal}>
                    <div className="tag-modal" onClick={e => e.stopPropagation()}>
                        <div className="tag-modal-header">
                            <h3>{editingTag ? 'Edit Tag' : 'Add New Tag'}</h3>
                            <button className="tag-modal-close" onClick={closeModal}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="tag-modal-body">
                            <label className="field-label">
                                <span className="req">*</span> Name
                            </label>
                            <input
                                type="text"
                                className="tag-input"
                                placeholder="Enter a name"
                                value={tagName}
                                onChange={e => setTagName(e.target.value)}
                                maxLength={100}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                            />
                            <div className="char-hint">{tagName.length}/100</div>
                            <div className="tag-modal-divider" />
                        </div>

                        <div className={`tag-modal-footer ${editingTag ? 'has-delete' : ''}`}>
                            {editingTag && (
                                <button className="tag-modal-delete" onClick={handleDelete}>Delete</button>
                            )}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="tag-modal-cancel" onClick={closeModal}>Cancel</button>
                                <button className="tag-modal-save" onClick={handleSave}>Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
