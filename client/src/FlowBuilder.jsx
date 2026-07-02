
import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dagre from 'dagre';
import { supabase } from './supabase';
import { useAuth } from './contexts/AuthContext';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Plus, Minus, MessageSquare, Zap, ShoppingCart,
  MoreHorizontal, X, ChevronRight, ChevronDown, CheckSquare, ArrowLeft, Code,
  User, Briefcase, Link2, Bell, Sparkles, Settings2, Trash2, Edit3,
  Repeat, Square, ExternalLink, Bug, Save, Eye,
  HelpCircle, GitBranch, Shuffle, CornerDownRight, Mail, MessageCircle,
  FileText, Hash, Phone, Calendar, Clock, List, MapPin, Image as ImageIcon, EyeOff,
  Table2 as Sheet, Move, Network, ArrowUp, ArrowDown,
  Camera, Video, Music, Smile, Upload, FolderOpen, AlertTriangle
} from 'lucide-react';

import StartNode from './nodes/StartNode';
import MessageNode from './nodes/MessageNode';
import ActionNode from './nodes/ActionNode';
import QuestionNode from './nodes/QuestionNode';
import ConditionNode from './nodes/ConditionNode';
import SplitNode from './nodes/SplitNode';
import SendEmailNode from './nodes/SendEmailNode';
import GoToNode from './nodes/GoToNode';
import CommentNode from './nodes/CommentNode';
import appConfig from './config';

const GOOGLE_SHEET_ACTIONS = [
  { id: 'insert_row', label: 'Insert Row' },
  { id: 'update_row', label: 'Update Row' },
  { id: 'get_row', label: 'Get Row By Value' },
  { id: 'get_rows', label: 'Get Multiple Rows' },
  { id: 'upsert_row', label: 'Upsert Row' },
  { id: 'delete_row', label: 'Delete Row' },
  { id: 'clear_row', label: 'Clear Row' },
];

// ─── Google Sheets Config ────────────────────────────────────────────────────
const GoogleSheetsConfig = ({ action: initialAction, onSave, onBack, workspaceId }) => {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [cfg, setCfg] = useState({
    action: initialAction.action || 'insert_row',
    spreadsheetId: initialAction.spreadsheetId || '',
    sheetName: initialAction.sheetName || '',
    mappings: initialAction.mappings || {},
  });

  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await authFetch(`${appConfig.API_URL}/api/sheets/list`);
        const data = await res.json();
        setSpreadsheets(data.files || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [workspaceId]);

  useEffect(() => {
    if (!cfg.spreadsheetId || !workspaceId) return;
    (async () => {
      try {
        const res = await authFetch(`${appConfig.API_URL}/api/sheets/${cfg.spreadsheetId}/details`);
        const data = await res.json();
        setSheets(data.sheets?.map(s => s.properties.title) || []);
      } catch (e) { console.error(e); }
    })();
  }, [cfg.spreadsheetId, workspaceId]);

  useEffect(() => {
    if (!cfg.spreadsheetId || !cfg.sheetName || !workspaceId) return;
    if (!['insert_row', 'update_row', 'upsert_row'].includes(cfg.action)) return;
    (async () => {
      try {
        const res = await authFetch(`${appConfig.API_URL}/api/sheets/headers`, {
          method: 'POST',
          body: JSON.stringify({ spreadsheetId: cfg.spreadsheetId, sheetName: cfg.sheetName })
        });
        const data = await res.json();
        setHeaders(data.headers || []);
      } catch (e) { console.error(e); }
    })();
  }, [cfg.spreadsheetId, cfg.sheetName, cfg.action, workspaceId]);

  const updateCfg = (key, value) => {
    const next = { ...cfg, [key]: value };
    setCfg(next);
    let label = initialAction.label;
    if (key === 'action') {
      const a = GOOGLE_SHEET_ACTIONS.find(a => a.id === value);
      if (a) label = `Google Sheets: ${a.label}`;
    }
    onSave({ ...initialAction, ...next, label });
  };

  if (loading) return (
    <div className="p-4 text-xs text-slate-500 flex items-center gap-2">
      <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      Loading sheets...
    </div>
  );

  return (
    <div className="animate-in slide-in-from-right duration-200 h-full flex flex-col">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 mb-4 hover:text-green-600 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back
      </button>
      <h4 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Google Sheets Config</h4>
      <div className="space-y-4 overflow-y-auto flex-1 pr-1">
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Action</label>
          <select className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" value={cfg.action} onChange={e => updateCfg('action', e.target.value)}>
            {GOOGLE_SHEET_ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Spreadsheet</label>
          <select className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" value={cfg.spreadsheetId} onChange={e => updateCfg('spreadsheetId', e.target.value)}>
            <option value="">Select Spreadsheet</option>
            {spreadsheets.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        {cfg.spreadsheetId && (
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Sheet Tab</label>
            <select className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" value={cfg.sheetName} onChange={e => updateCfg('sheetName', e.target.value)}>
              <option value="">Select Sheet</option>
              {sheets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {cfg.sheetName && headers.length > 0 && ['insert_row', 'update_row', 'upsert_row'].includes(cfg.action) && (
          <div className="border-t border-slate-100 pt-3">
            <label className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Sheet size={14} className="text-green-500" /> Field Mapping
            </label>
            <div className="space-y-3">
              {headers.map(header => (
                <div key={header}>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">{header}</label>
                  <input className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 placeholder:text-slate-300 transition-all" placeholder={`Value for ${header}`} value={cfg.mappings[header] || ''} onChange={e => updateCfg('mappings', { ...cfg.mappings, [header]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Set Variable Modal ───────────────────────────────────────────────────────
const SetVariableModal = ({ action, onSave, onClose, onDelete, workspaceId }) => {
  const [variable, setVariable] = useState(action.variable || '');
  const [operation, setOperation] = useState(action.operation || 'input_value');
  const [value, setValue] = useState(action.value || '');
  const [userFields, setUserFields] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [step, setStep] = useState('input');
  const [newFieldName, setNewFieldName] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    supabase.from('user_fields').select('*').eq('workspace_id', workspaceId)
      .then(({ data }) => setUserFields(data || []));
  }, [workspaceId]);

  const filteredFields = userFields.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const exactMatch = userFields.find(f => f.name.toLowerCase() === searchTerm.toLowerCase());

  const handleCreateField = async (type) => {
    try {
      const { data, error } = await supabase.from('user_fields').insert({ workspace_id: workspaceId, name: newFieldName, type }).select().single();
      if (error) throw error;
      setUserFields([...userFields, data]);
      setVariable(data.name);
      setStep('input');
      setSearchTerm('');
    } catch (err) { alert("Failed to create field: " + err.message); }
  };

  const handleSave = () => {
    if (!variable) return alert("Please select a variable");
    onSave({ ...action, variable, operation, value, label: `Set ${variable}: ${operation.replace('_', ' ')}` });
  };

  const operations = [
    { id: 'input_value', label: 'Input value' }, { id: 'formula', label: 'Math Formula' },
    { id: 'trim', label: 'Trim text' }, { id: 'to_lower', label: 'To lower case' },
    { id: 'to_upper', label: 'To upper case' }, { id: 'random', label: 'Generate random text' },
  ];

  if (step === 'type_selection') return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>Select Field Type</h3>
          <button onClick={() => setStep('input')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-8">
          <p className="text-sm text-slate-500 mb-6">New field: <span className="text-slate-900 font-bold">{newFieldName}</span></p>
          <div className="grid grid-cols-5 gap-4">
            {[
              { id: 'text', label: 'Text', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
              { id: 'number', label: 'Number', icon: Hash, color: 'text-green-600', bg: 'bg-green-50' },
              { id: 'boolean', label: 'Boolean', icon: CheckSquare, color: 'text-slate-500', bg: 'bg-slate-50' },
              { id: 'date', label: 'Date', icon: Calendar, color: 'text-red-500', bg: 'bg-red-50' },
              { id: 'datetime', label: 'Datetime', icon: Clock, color: 'text-pink-500', bg: 'bg-pink-50' },
            ].map(t => (
              <button key={t.id} onClick={() => handleCreateField(t.id)} className="flex flex-col items-center p-6 rounded-xl border border-slate-200 hover:border-green-400 hover:shadow-md transition-all gap-3 bg-white">
                <div className={`p-3 rounded-xl ${t.bg}`}><t.icon size={22} className={t.color} /></div>
                <span className="text-xs font-bold text-slate-700">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const selectedField = userFields.find(f => f.name === variable);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>Set Variable Value</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6 flex-1 overflow-auto space-y-6">
          <div className="relative">
            <label className="text-xs font-bold text-slate-600 mb-2 block">Custom Field</label>
            <div className={`relative ${showDropdown ? 'z-[102]' : ''}`}>
              <div className="w-full h-11 bg-white border border-slate-200 rounded-xl flex items-center px-4 cursor-text focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all" onClick={() => setShowDropdown(true)}>
                {variable && !showDropdown && !searchTerm ? (
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                    {selectedField?.type === 'text' && <FileText size={14} className="text-blue-500" />}
                    {selectedField?.type === 'number' && <Hash size={14} className="text-green-600" />}
                    {variable}
                  </div>
                ) : (
                  <input autoFocus placeholder="Choose Custom Field" className="w-full bg-transparent outline-none text-sm placeholder:text-slate-400 font-medium" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} />
                )}
                <ChevronDown size={16} className={`ml-auto text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </div>
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-[101]" onClick={() => setShowDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[102] max-h-56 overflow-y-auto py-1">
                    {filteredFields.map(f => (
                      <button key={f.id} onClick={() => { setVariable(f.name); setSearchTerm(''); setShowDropdown(false); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 flex items-center gap-2 transition-colors">
                        {f.type === 'text' && <FileText size={14} className="text-blue-500" />}
                        {f.type === 'number' && <Hash size={14} className="text-green-600" />}
                        <span className="font-medium text-slate-700">{f.name}</span>
                      </button>
                    ))}
                    {searchTerm && !exactMatch && (
                      <button onClick={() => { setNewFieldName(searchTerm); setStep('type_selection'); setShowDropdown(false); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 text-green-600 font-bold border-t border-slate-50 transition-colors">
                        Create field: "{searchTerm}"
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          {variable && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide">Operation</label>
                <select className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 outline-none text-sm font-medium focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all" value={operation} onChange={e => setOperation(e.target.value)}>
                  {operations.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide">Value</label>
                <div className="relative">
                  <textarea className="w-full min-h-[100px] bg-white border border-slate-200 rounded-xl p-4 outline-none text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all placeholder:text-slate-300" placeholder="Enter value or use variables like {{first_name}}..." value={value} onChange={e => setValue(e.target.value)} />
                  <div className="absolute bottom-3 right-3 p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-green-600 cursor-pointer border border-slate-200 transition-all">
                    <Code size={14} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {showConfirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-600 mr-1">Are you sure?</span>
                <button onClick={() => setShowConfirmDelete(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all">No</button>
                <button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all">Yes, Delete</button>
              </div>
            ) : (
              <button onClick={() => setShowConfirmDelete(true)} className="px-5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-all border border-red-100">Delete</button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-green-200">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sequence Action Modal ────────────────────────────────────────────────────
const SequenceActionModal = ({ action, onSave, onClose, workspaceId }) => {
  const { authFetch } = useAuth();
  const [sequenceId, setSequenceId] = useState(action.sequenceId || '');
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    authFetch(`${appConfig.API_URL}/api/sequences?workspace_id=${workspaceId}`)
      .then(r => r.json()).then(d => setSequences(d || [])).finally(() => setLoading(false));
  }, [workspaceId]);

  const handleSave = () => {
    if (!sequenceId) return alert("Please select a sequence");
    const seqName = sequences.find(s => s.id === sequenceId)?.name || 'Unknown';
    onSave({ ...action, sequenceId, label: `${action.type === 'subscribe_sequence' ? 'Subscribe' : 'Unsubscribe'}: ${seqName}` });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Clock size={20} className="text-white" /></div>
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{action.type === 'subscribe_sequence' ? 'Subscribe' : 'Unsubscribe'}</h3>
                <p className="text-green-100 text-xs">Choose the target sequence</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={18} /></button>
          </div>
        </div>
        <div className="p-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Choose Sequence</label>
          <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" value={sequenceId} onChange={e => setSequenceId(e.target.value)}>
            <option value="">Select a sequence...</option>
            {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {loading && <p className="text-[10px] text-slate-400 mt-1 animate-pulse">Loading sequences...</p>}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
          <button onClick={handleSave} className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100 transition-all">Save Action</button>
        </div>
      </div>
    </div>
  );
};

// ─── Action Sidebar ───────────────────────────────────────────────────────────
const ActionSidebar = ({ node, updateNode, onOpenContentManager, workspaceId, onEditAction }) => {
  const [view, setView] = useState('categories');
  const [configuringActionIndex, setConfiguringActionIndex] = useState(null);
  const actions = node.data.actions || [];

  const categories = [
    { id: 'basic', label: 'Basic Actions', icon: User },
    { id: 'advanced', label: 'Advanced', icon: Briefcase },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'notification', label: 'Notification', icon: Bell },
    { id: 'ecommerce', label: 'Ecommerce', icon: ShoppingCart },
    { id: 'ai', label: 'AI Actions', icon: Sparkles },
  ];

  const handleAddAction = (action) => {
    const newActions = [...actions, action];
    updateNode({ actions: newActions });
    if (action.type === 'set_variable' || action.type === 'clear_variable') {
      onEditAction(newActions.length - 1);
    }
  };

  const removeAction = (idx) => updateNode({ actions: actions.filter((_, i) => i !== idx) });

  if (view === 'integrations') return (
    <div className="animate-in slide-in-from-right duration-200">
      <button onClick={() => setView('categories')} className="flex items-center gap-2 text-sm text-slate-500 mb-4 hover:text-green-600 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back
      </button>
      <h4 className="font-bold text-slate-800 mb-3 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Integrations</h4>
      <div className="space-y-2">
        <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all text-left group" onClick={() => {
          const newAction = { type: 'google_sheets', label: 'Google Sheets: Insert Row', action: 'insert_row' };
          const newActions = [...actions, newAction];
          updateNode({ actions: newActions });
          setConfiguringActionIndex(newActions.length - 1);
          setView('google_sheets_config');
        }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><Sheet size={18} /></div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Google Sheets</p>
              <p className="text-xs text-slate-500">Append or update rows</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-green-500" />
        </button>
      </div>



    </div>
  );

  if (view === 'basic_actions') return (
    <div className="animate-in slide-in-from-right duration-200">
      <button onClick={() => setView('categories')} className="flex items-center gap-2 text-sm text-slate-500 mb-4 hover:text-green-600 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back
      </button>
      <h4 className="font-bold text-slate-800 mb-3 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Basic Actions</h4>
      <div className="space-y-2">
        {[
          { type: 'set_variable', label: 'Set Variable Value', desc: 'Update a custom user field', icon: Settings2, color: 'blue' },
          { type: 'clear_variable', label: 'Clear Variable Value', desc: 'Remove data from a field', icon: EyeOff, color: 'slate' },
          { type: 'fire_trigger', label: 'Fire Trigger', desc: 'Send data and activate a trigger', icon: Zap, color: 'purple' },
          { type: 'subscribe_sequence', label: 'Subscribe Sequence', desc: 'Add user to a sequence', icon: Clock, color: 'green' },
          { type: 'unsubscribe_sequence', label: 'Unsubscribe Sequence', desc: 'Remove user from a sequence', icon: Clock, color: 'red' },
        ].map(item => (
          <button key={item.type} className={`w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left group`}
            onClick={() => handleAddAction({ type: item.type, label: item.label, variable: '', operation: 'Set Value', value: '' })}>
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
              <item.icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  if (view === 'google_sheets_config' && configuringActionIndex !== null) return (
    <GoogleSheetsConfig
      action={actions[configuringActionIndex]}
      onSave={(updated) => {
        const na = [...actions]; na[configuringActionIndex] = updated; updateNode({ actions: na });
      }}
      onBack={() => { setConfiguringActionIndex(null); setView('integrations'); }}
      workspaceId={workspaceId}
    />
  );

  return (
    <div className="flex flex-col h-full">
      {actions.length > 0 && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Configured Actions</h4>
            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md font-bold">{actions.length}</span>
          </div>
          {actions.map((action, idx) => (
            <div key={idx} className="group relative flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-green-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-400 flex-shrink-0">
                  {action.type === 'google_sheets' ? <Sheet size={16} /> : <Zap size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">{action.label}</p>
                  {action.type === 'set_variable' && <p className="text-[11px] text-slate-400 truncate">{action.variable} = {action.value}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { if (action.type === 'google_sheets') { setConfiguringActionIndex(idx); setView('google_sheets_config'); } else { onEditAction(idx); } }} className="p-1.5 hover:bg-green-50 text-green-500 rounded-lg transition-colors"><Edit3 size={14} /></button>
                <button onClick={() => removeAction(idx)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          <div className="h-px bg-slate-100 my-4" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => (
          <button key={cat.id}
            onClick={() => { if (cat.id === 'integrations') setView('integrations'); else if (cat.id === 'basic') setView('basic_actions'); else if (cat.id === 'content') onOpenContentManager(); }}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-green-300 transition-all gap-2 group">
            <div className="text-slate-400 group-hover:text-green-600 transition-colors"><cat.icon size={20} strokeWidth={1.5} /></div>
            <span className="text-xs font-semibold text-slate-600 text-center leading-tight">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Question Sidebar ─────────────────────────────────────────────────────────
const QuestionSidebar = ({ node, setNodes }) => {
  const questionTypes = [
    { label: '+ Text', icon: FileText, type: 'text' },
    { label: '+ Number', icon: Hash, type: 'number' },
    { label: '+ Email', icon: Mail, type: 'email' },
    { label: '+ Phone', icon: Phone, type: 'phone' },
    { label: '+ Date', icon: Calendar, type: 'date' },
    { label: '+ DateTime', icon: Clock, type: 'datetime' },
    { label: '+ Choice', icon: List, type: 'choice' },
    { label: '+ Location', icon: MapPin, type: 'location' },
    { label: 'Rich Media', icon: ImageIcon, type: 'rich_media' },
    { label: 'Silent', icon: EyeOff, type: 'silent' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
        <p className="text-xs text-blue-700 font-medium leading-relaxed">Select the type of input to capture from the user.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {questionTypes.map(qt => (
          <button key={qt.type} onClick={() => setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, question_type: qt.type, question_text: `Collect ${qt.type} input...` } } : n))}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:border-green-400 hover:bg-green-50 transition-all gap-2 group">
            <div className="text-slate-400 group-hover:text-green-600 transition-colors"><qt.icon size={18} strokeWidth={1.5} /></div>
            <span className="text-[11px] font-semibold text-slate-600 text-center">{qt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Condition Sidebar ────────────────────────────────────────────────────────
const ConditionSidebar = ({ node, setNodes }) => {
  const groups = node.data.groups || [{ label: 'Group 1' }, { label: 'Otherwise' }];

  const addGroup = () => {
    const newGroups = [...groups];
    newGroups.splice(groups.length - 1, 0, { label: `Group ${groups.length}` });
    setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, groups: newGroups } } : n));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
        <p className="text-xs text-green-700 font-medium leading-relaxed">
          Add condition groups. The flow takes the first matching group's path. <strong>Otherwise</strong> always runs last.
        </p>
      </div>
      <div className="space-y-2 mb-4">
        {groups.map((g, i) => (
          <div key={i} className={`flex items-center gap-2 p-3 rounded-xl border ${i === groups.length - 1 ? 'bg-slate-50 border-slate-200 border-dashed' : 'bg-green-50 border-green-100'}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === groups.length - 1 ? 'bg-slate-300' : 'bg-green-500'}`} />
            <input
              className={`flex-1 text-xs font-semibold bg-transparent outline-none ${i === groups.length - 1 ? 'text-slate-400' : 'text-green-700'}`}
              value={g.label}
              readOnly={i === groups.length - 1}
              onChange={(e) => {
                const ng = [...groups]; ng[i] = { ...ng[i], label: e.target.value };
                setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, groups: ng } } : n));
              }}
            />
          </div>
        ))}
      </div>
      <button onClick={addGroup} className="w-full py-3 border border-dashed border-green-300 text-green-600 text-xs font-bold rounded-xl hover:bg-green-50 hover:border-green-400 transition-all flex items-center justify-center gap-2">
        <Plus size={14} /> Add Condition Group
      </button>
    </div>
  );
};

// ─── Split Sidebar ────────────────────────────────────────────────────────────
const SplitSidebar = ({ node, setNodes }) => {
  const branches = node.data.branches || [{ label: 'Branch A', percent: 50 }, { label: 'Branch B', percent: 50 }];
  const total = branches.reduce((s, b) => s + (b.percent || 0), 0);

  const updateBranches = (nb) => setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, branches: nb } } : n));
  const addBranch = () => updateBranches([...branches, { label: `Branch ${String.fromCharCode(65 + branches.length)}`, percent: 0 }]);

  return (
    <div className="flex flex-col h-full">
      <div className={`p-3 rounded-xl mb-4 text-xs font-bold ${total === 100 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
        Total: {total}% {total === 100 ? '✓ Perfect' : '— Must equal 100%'}
      </div>
      <div className="space-y-2 mb-4">
        {branches.map((b, i) => (
          <div key={i} className="flex items-center gap-2 p-3 bg-pink-50 border border-pink-100 rounded-xl">
            <input className="flex-1 text-xs font-semibold bg-transparent outline-none text-pink-700" value={b.label} onChange={e => { const nb = [...branches]; nb[i] = { ...nb[i], label: e.target.value }; updateBranches(nb); }} />
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="100" className="w-14 text-xs font-black text-pink-600 bg-white border border-pink-200 rounded-lg px-2 py-1 outline-none text-center" value={b.percent} onChange={e => { const nb = [...branches]; nb[i] = { ...nb[i], percent: Number(e.target.value) }; updateBranches(nb); }} />
              <span className="text-xs text-pink-400">%</span>
            </div>
            {branches.length > 2 && <button onClick={() => updateBranches(branches.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>}
          </div>
        ))}
      </div>
      <button onClick={addBranch} className="w-full py-3 border border-dashed border-pink-300 text-pink-600 text-xs font-bold rounded-xl hover:bg-pink-50 transition-all flex items-center justify-center gap-2">
        <Plus size={14} /> Add Branch
      </button>
    </div>
  );
};

// ─── Send Email Sidebar ───────────────────────────────────────────────────────
const SendEmailSidebar = ({ node, setNodes }) => {
  const data = node.data;
  const update = (key, val) => setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, [key]: val } } : n));

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
        <p className="text-xs text-blue-700 font-medium">Configure the email details. Use {'{{variable}}'} to inject dynamic content.</p>
      </div>
      {[
        { key: 'from_name', label: 'From Name', placeholder: 'JusBot' },
        { key: 'from_email', label: 'From Email', placeholder: 'bot@yourdomain.com' },
        { key: 'to', label: 'To (Recipient)', placeholder: '{{email}}' },
        { key: 'subject', label: 'Subject', placeholder: 'Your order is confirmed!' },
      ].map(f => (
        <div key={f.key}>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">{f.label}</label>
          <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300" placeholder={f.placeholder} value={data[f.key] || ''} onChange={e => update(f.key, e.target.value)} />
        </div>
      ))}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Body (HTML supported)</label>
        <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 min-h-[120px]" placeholder="Enter your email body..." value={data.body || ''} onChange={e => update('body', e.target.value)} />
      </div>
    </div>
  );
};

// ─── Comment Sidebar ──────────────────────────────────────────────────────────
const CommentSidebar = ({ node, setNodes }) => {
  const data = node.data;
  const update = (key, val) => setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, [key]: val } } : n));
  const colors = ['yellow', 'green', 'blue', 'red', 'purple'];
  const colorMap = { yellow: 'bg-amber-400', green: 'bg-green-500', blue: 'bg-blue-500', red: 'bg-red-500', purple: 'bg-purple-500' };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Title</label>
        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all" placeholder="Comment title..." value={data.title || ''} onChange={e => update('title', e.target.value)} />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Note</label>
        <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all min-h-[100px]" placeholder="Add your note here..." value={data.body || ''} onChange={e => update('body', e.target.value)} />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Color</label>
        <div className="flex gap-2">
          {colors.map(c => (
            <button key={c} onClick={() => update('color', c)} className={`w-8 h-8 rounded-full ${colorMap[c]} transition-all ${data.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Node Types Registration ──────────────────────────────────────────────────
const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  action: ActionNode,
  question: QuestionNode,
  condition: ConditionNode,
  split: SplitNode,
  send_email: SendEmailNode,
  go_to: GoToNode,
  comment: CommentNode,
};

const initialNodes = [
  { id: 'start', type: 'start', position: { x: 400, y: 150 }, data: { label: 'Start', actions: [], text: '', buttons: [] } },
];

// All 9 step types
const steps = [
  { type: 'Send Message', value: 'message', icon: MessageSquare, desc: 'Send text, image or buttons', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.2)' },
  { type: 'Question', value: 'question', icon: HelpCircle, desc: 'Ask and capture user input', color: '#2563EB', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)' },
  { type: 'Action', value: 'action', icon: Zap, desc: 'Trigger webhook or API call', color: '#ea580c', bg: 'rgba(234,88,12,0.08)', border: 'rgba(234,88,12,0.2)' },
  { type: 'Condition', value: 'condition', icon: GitBranch, desc: 'Branch based on logic', color: '#16a34a', bg: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.15)' },
  { type: 'Split', value: 'split', icon: Shuffle, desc: 'A/B test or random split', color: '#db2777', bg: 'rgba(219,39,119,0.08)', border: 'rgba(219,39,119,0.2)' },
  { type: 'Send Email', value: 'send_email', icon: Mail, desc: 'Send a formatted email', color: '#2563EB', bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.15)' },
  { type: 'Go To', value: 'go_to', icon: CornerDownRight, desc: 'Jump to another flow step', color: '#0891b2', bg: 'rgba(8,145,178,0.08)', border: 'rgba(8,145,178,0.2)' },
  { type: 'Comment', value: 'comment', icon: MessageCircle, desc: 'Add a canvas note', color: '#92400e', bg: 'rgba(146,64,14,0.06)', border: 'rgba(146,64,14,0.15)' },
];

// ─── Variable Input with </> Injector ──────────────────────────────────────────
function VariableInput({
  value = '',
  onChange,
  placeholder = '',
  type = 'text', // 'text', 'password', 'tel', or 'textarea'
  className = '',
  rows = 3,
  fields = [],
  onVariableCreated,
  workspaceId,
  authFetch
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVar, setNewVar] = useState({ name: '', scope: 'user', type: 'text' });
  const [creating, setCreating] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
        setShowCreateForm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectVar = (varName) => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const insertion = `{{${varName}}}`;
    const newValue = value.substring(0, start) + insertion + value.substring(end);
    onChange(newValue);
    setShowDropdown(false);

    setTimeout(() => {
      input.focus();
      const pos = start + insertion.length;
      input.setSelectionRange(pos, pos);
    }, 50);
  };

  const handleCreateVar = async (e) => {
    e.preventDefault();
    if (!newVar.name.trim()) return;
    setCreating(true);
    try {
      const res = await authFetch(`${appConfig.API_BASE}/content/fields?workspace_id=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_name: newVar.name.trim().toLowerCase().replace(/\s+/g, '_'),
          field_scope: newVar.scope,
          variable_type: newVar.type,
          workspace_id: workspaceId,
          is_editable: true
        })
      });
      if (res.ok) {
        const created = await res.json();
        if (onVariableCreated) {
          onVariableCreated(created);
        }
        handleSelectVar(created.field_name);
        setNewVar({ name: '', scope: 'user', type: 'text' });
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full flex items-center">
      {type === 'textarea' ? (
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${className} pr-10`}
        />
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${className} pr-10`}
        />
      )}
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-md transition-colors text-[10px] font-bold font-mono border-0 cursor-pointer"
        title="Insert Variable"
      >
        {"</>"}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {!showCreateForm ? (
            <div className="flex flex-col">
              <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Variable</span>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="text-[9px] font-extrabold text-blue-600 hover:text-blue-700 bg-transparent border-0 cursor-pointer uppercase"
                >
                  + Create New
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {fields.length === 0 ? (
                  <div className="p-3 text-center text-[10px] text-slate-400 italic">No variables saved.</div>
                ) : (
                  fields.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => handleSelectVar(field.field_name)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between border-0 bg-transparent cursor-pointer"
                    >
                      <span className="text-[11px] font-mono text-slate-700">{field.field_name}</span>
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 tracking-wider">
                        {field.field_scope}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateVar} className="p-3.5 space-y-3 m-0 text-left">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">New Variable</span>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-[9px] font-bold text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer uppercase"
                >
                  Cancel
                </button>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. user_phone"
                  required
                  value={newVar.name}
                  onChange={(e) => setNewVar({ ...newVar, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Scope</label>
                  <select
                    value={newVar.scope}
                    onChange={(e) => setNewVar({ ...newVar, scope: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-slate-800"
                  >
                    <option value="user">User</option>
                    <option value="bot">Bot</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Type</label>
                  <select
                    value={newVar.type}
                    onChange={(e) => setNewVar({ ...newVar, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-slate-800"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {creating ? 'Creating...' : 'Create & Select'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dynamic Config Modal ─────────────────────────────────────────────────────
function DynamicConfigModal({
  isOpen,
  onClose,
  component,
  onSave,
  workspaceId,
  authFetch,
  fields,
  onVariableCreated
}) {
  const [localConfig, setLocalConfig] = useState({
    method: 'POST',
    url: '',
    headers: [],
    params: [],
    bodyType: 'none',
    bodyRaw: '',
    bodyParams: [],
    authType: 'none',
    authBasicUsername: '',
    authBasicPassword: '',
    authBasicUsernameTest: '',
    authBasicPasswordTest: '',
    authBearerToken: '',
    authBearerTokenTest: '',
    authDigestUsername: '',
    authDigestPassword: '',
    authDigestUsernameTest: '',
    authDigestPasswordTest: '',
  });

  const [activeTab, setActiveTab] = useState('url-params');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState(null);

  useEffect(() => {
    if (component) {
      setLocalConfig({
        method: component.method || 'POST',
        url: component.url || '',
        headers: component.headers || [],
        params: component.params || [],
        bodyType: component.bodyType || 'none',
        bodyRaw: component.bodyRaw || '',
        bodyParams: component.bodyParams || [],
        authType: component.authType || 'none',
        authBasicUsername: component.authBasicUsername || '',
        authBasicPassword: component.authBasicPassword || '',
        authBasicUsernameTest: component.authBasicUsernameTest || '',
        authBasicPasswordTest: component.authBasicPasswordTest || '',
        authBearerToken: component.authBearerToken || '',
        authBearerTokenTest: component.authBearerTokenTest || '',
        authDigestUsername: component.authDigestUsername || '',
        authDigestPassword: component.authDigestPassword || '',
        authDigestUsernameTest: component.authDigestUsernameTest || '',
        authDigestPasswordTest: component.authDigestPasswordTest || '',
      });
      setTestResponse(null);
      setActiveTab('url-params');
    }
  }, [component]);

  if (!isOpen) return null;

  const handleTestRequest = async () => {
    setTestLoading(true);
    setTestResponse(null);
    try {
      const res = await authFetch(`${appConfig.API_BASE}/content/test-request?workspace_id=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setTestResponse(data);
      } else {
        setTestResponse({ success: false, error: 'Test request failed.' });
      }
    } catch (err) {
      setTestResponse({ success: false, error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const addRow = (type) => {
    const list = [...(localConfig[type] || [])];
    list.push({ key: '', value: '', testValue: '' });
    setLocalConfig({ ...localConfig, [type]: list });
  };

  const updateRow = (type, idx, field, val) => {
    const list = [...(localConfig[type] || [])];
    list[idx] = { ...list[idx], [field]: val };
    setLocalConfig({ ...localConfig, [type]: list });
  };

  const removeRow = (type, idx) => {
    const list = (localConfig[type] || []).filter((_, i) => i !== idx);
    setLocalConfig({ ...localConfig, [type]: list });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col border border-slate-150 h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Dynamic Content</span>
            <a href="#" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">Help <HelpCircle size={10} /></a>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 border-0 bg-transparent transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* HTTP Request Bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex gap-3 items-center">
          <select
            value={localConfig.method}
            onChange={(e) => setLocalConfig({ ...localConfig, method: e.target.value })}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 cursor-pointer shadow-sm"
          >
            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="flex-1">
            <VariableInput
              value={localConfig.url}
              onChange={(val) => setLocalConfig({ ...localConfig, url: val })}
              placeholder="https://api.yourdomain.com/endpoint"
              fields={fields}
              onVariableCreated={onVariableCreated}
              workspaceId={workspaceId}
              authFetch={authFetch}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleTestRequest}
            disabled={testLoading || !localConfig.url}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white border-0 rounded-xl text-xs font-bold transition-all shadow-md shadow-green-100 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {testLoading ? 'Testing...' : 'Test'}
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-100 bg-white px-6">
          {[
            { id: 'url-params', label: 'URL Params' },
            { id: 'headers', label: 'Headers' },
            { id: 'body', label: 'Body' },
            { id: 'auth', label: 'Authorization' },
            { id: 'response', label: 'Response' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 px-4 text-xs font-bold transition-all border-0 bg-transparent cursor-pointer border-b-2 relative ${
                activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          
          {/* URL Params Tab */}
          {activeTab === 'url-params' && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Query Parameters</span>
                <button type="button" onClick={() => addRow('params')} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 cursor-pointer">+ Add Row</button>
              </div>
              {(localConfig.params || []).map((p, idx) => (
                <div key={idx} className="flex gap-2.5 items-center bg-white p-3 rounded-2xl border border-slate-150 shadow-sm">
                  <input
                    type="text"
                    placeholder="Key"
                    value={p.key}
                    onChange={(e) => updateRow('params', idx, 'key', e.target.value)}
                    className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold"
                  />
                  <div className="flex-1">
                    <VariableInput
                      value={p.value}
                      onChange={(val) => updateRow('params', idx, 'value', val)}
                      placeholder="Value"
                      fields={fields}
                      onVariableCreated={onVariableCreated}
                      workspaceId={workspaceId}
                      authFetch={authFetch}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Test Value"
                    value={p.testValue || ''}
                    onChange={(e) => updateRow('params', idx, 'testValue', e.target.value)}
                    className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold"
                  />
                  <button type="button" onClick={() => removeRow('params', idx)} className="text-slate-350 hover:text-red-500 border-0 bg-transparent cursor-pointer transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
              {(localConfig.params || []).length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 italic">No query parameters defined.</div>
              )}
            </div>
          )}

          {/* Headers Tab */}
          {activeTab === 'headers' && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">HTTP Headers</span>
                <button type="button" onClick={() => addRow('headers')} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 cursor-pointer">+ Add Row</button>
              </div>
              {(localConfig.headers || []).map((h, idx) => (
                <div key={idx} className="flex gap-2.5 items-center bg-white p-3 rounded-2xl border border-slate-150 shadow-sm">
                  <input
                    type="text"
                    placeholder="Key"
                    value={h.key}
                    onChange={(e) => updateRow('headers', idx, 'key', e.target.value)}
                    className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold"
                  />
                  <div className="flex-1">
                    <VariableInput
                      value={h.value}
                      onChange={(val) => updateRow('headers', idx, 'value', val)}
                      placeholder="Value"
                      fields={fields}
                      onVariableCreated={onVariableCreated}
                      workspaceId={workspaceId}
                      authFetch={authFetch}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Test Value"
                    value={h.testValue || ''}
                    onChange={(e) => updateRow('headers', idx, 'testValue', e.target.value)}
                    className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold"
                  />
                  <button type="button" onClick={() => removeRow('headers', idx)} className="text-slate-350 hover:text-red-500 border-0 bg-transparent cursor-pointer transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
              {(localConfig.headers || []).length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 italic">No headers defined.</div>
              )}
            </div>
          )}

          {/* Body Tab */}
          {activeTab === 'body' && (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-6 pb-2 border-b border-slate-100">
                {[
                  { id: 'none', label: 'none' },
                  { id: 'multipart', label: 'multipart/form-data' },
                  { id: 'urlencoded', label: 'x-www-form-urlencoded' },
                  { id: 'raw', label: 'raw' }
                ].map(b => (
                  <label key={b.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      value={b.id}
                      checked={localConfig.bodyType === b.id}
                      onChange={(e) => setLocalConfig({ ...localConfig, bodyType: e.target.value })}
                      className="accent-blue-600"
                    />
                    {b.label}
                  </label>
                ))}
              </div>

              {localConfig.bodyType === 'none' && (
                <div className="py-12 text-center text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-2xl bg-white">
                  This request does not send a body.
                </div>
              )}

              {localConfig.bodyType === 'raw' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Raw JSON/Text Body</span>
                  <VariableInput
                    type="textarea"
                    rows={8}
                    value={localConfig.bodyRaw}
                    onChange={(val) => setLocalConfig({ ...localConfig, bodyRaw: val })}
                    placeholder='{"key": "value"}'
                    fields={fields}
                    onVariableCreated={onVariableCreated}
                    workspaceId={workspaceId}
                    authFetch={authFetch}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:border-slate-800 leading-relaxed"
                  />
                </div>
              )}

              {(localConfig.bodyType === 'urlencoded' || localConfig.bodyType === 'multipart') && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Body Parameters</span>
                    <button type="button" onClick={() => addRow('bodyParams')} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 cursor-pointer">+ Add Row</button>
                  </div>
                  {(localConfig.bodyParams || []).map((bp, idx) => (
                    <div key={idx} className="flex gap-2.5 items-center bg-white p-3 rounded-2xl border border-slate-150 shadow-sm">
                      <input
                        type="text"
                        placeholder="Key"
                        value={bp.key}
                        onChange={(e) => updateRow('bodyParams', idx, 'key', e.target.value)}
                        className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold"
                      />
                      <div className="flex-1">
                        <VariableInput
                          value={bp.value}
                          onChange={(val) => updateRow('bodyParams', idx, 'value', val)}
                          placeholder="Value"
                          fields={fields}
                          onVariableCreated={onVariableCreated}
                          workspaceId={workspaceId}
                          authFetch={authFetch}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Test Value"
                        value={bp.testValue || ''}
                        onChange={(e) => updateRow('bodyParams', idx, 'testValue', e.target.value)}
                        className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold"
                      />
                      <button type="button" onClick={() => removeRow('bodyParams', idx)} className="text-slate-350 hover:text-red-500 border-0 bg-transparent cursor-pointer transition-colors"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {(localConfig.bodyParams || []).length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 italic">No parameters defined.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Authorization Tab */}
          {activeTab === 'auth' && (
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Auth Type</label>
                <select
                  value={localConfig.authType}
                  onChange={(e) => setLocalConfig({ ...localConfig, authType: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer shadow-sm max-w-xs"
                >
                  <option value="none">No Auth</option>
                  <option value="basic">Basic Auth</option>
                  <option value="digest">Digest Auth</option>
                  <option value="bearer">Bearer Token</option>
                </select>
              </div>

              {localConfig.authType === 'none' && (
                <div className="py-12 text-center text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-2xl bg-white">
                  This request does not use authentication headers.
                </div>
              )}

              {localConfig.authType === 'basic' && (
                <div className="grid grid-cols-2 gap-4 bg-white p-5 rounded-3xl border border-slate-150 shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Username</label>
                      <VariableInput
                        value={localConfig.authBasicUsername}
                        onChange={(val) => setLocalConfig({ ...localConfig, authBasicUsername: val })}
                        placeholder="Username"
                        fields={fields}
                        onVariableCreated={onVariableCreated}
                        workspaceId={workspaceId}
                        authFetch={authFetch}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Password</label>
                      <VariableInput
                        type="password"
                        value={localConfig.authBasicPassword}
                        onChange={(val) => setLocalConfig({ ...localConfig, authBasicPassword: val })}
                        placeholder="Password"
                        fields={fields}
                        onVariableCreated={onVariableCreated}
                        workspaceId={workspaceId}
                        authFetch={authFetch}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 border-l border-slate-100 pl-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Username Test Value</label>
                      <input
                        type="text"
                        placeholder="Test Username"
                        value={localConfig.authBasicUsernameTest || ''}
                        onChange={(e) => setLocalConfig({ ...localConfig, authBasicUsernameTest: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Password Test Value</label>
                      <input
                        type="text"
                        placeholder="Test Password"
                        value={localConfig.authBasicPasswordTest || ''}
                        onChange={(e) => setLocalConfig({ ...localConfig, authBasicPasswordTest: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {localConfig.authType === 'digest' && (
                <div className="grid grid-cols-2 gap-4 bg-white p-5 rounded-3xl border border-slate-150 shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Username</label>
                      <VariableInput
                        value={localConfig.authDigestUsername}
                        onChange={(val) => setLocalConfig({ ...localConfig, authDigestUsername: val })}
                        placeholder="Username"
                        fields={fields}
                        onVariableCreated={onVariableCreated}
                        workspaceId={workspaceId}
                        authFetch={authFetch}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone</label>
                      <VariableInput
                        value={localConfig.authDigestPassword}
                        onChange={(val) => setLocalConfig({ ...localConfig, authDigestPassword: val })}
                        placeholder="Phone / Password"
                        fields={fields}
                        onVariableCreated={onVariableCreated}
                        workspaceId={workspaceId}
                        authFetch={authFetch}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 border-l border-slate-100 pl-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Username Test Value</label>
                      <input
                        type="text"
                        placeholder="Test Username"
                        value={localConfig.authDigestUsernameTest || ''}
                        onChange={(e) => setLocalConfig({ ...localConfig, authDigestUsernameTest: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone Test Value</label>
                      <input
                        type="text"
                        placeholder="Test Phone"
                        value={localConfig.authDigestPasswordTest || ''}
                        onChange={(e) => setLocalConfig({ ...localConfig, authDigestPasswordTest: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {localConfig.authType === 'bearer' && (
                <div className="grid grid-cols-2 gap-4 bg-white p-5 rounded-3xl border border-slate-150 shadow-sm">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Bearer Token</label>
                    <VariableInput
                      value={localConfig.authBearerToken}
                      onChange={(val) => setLocalConfig({ ...localConfig, authBearerToken: val })}
                      placeholder="Token"
                      fields={fields}
                      onVariableCreated={onVariableCreated}
                      workspaceId={workspaceId}
                      authFetch={authFetch}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="border-l border-slate-100 pl-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Test Token Value</label>
                    <input
                      type="text"
                      placeholder="Test Token"
                      value={localConfig.authBearerTokenTest || ''}
                      onChange={(e) => setLocalConfig({ ...localConfig, authBearerTokenTest: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Response Tab */}
          {activeTab === 'response' && (
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Test Response Panel</span>
                <button
                  type="button"
                  disabled={testLoading || !localConfig.url}
                  onClick={handleTestRequest}
                  className="px-4 py-1.5 border border-slate-800 text-slate-800 hover:bg-slate-50 border-solid rounded-xl text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {testLoading ? 'Loading...' : 'Click to test request'}
                </button>
              </div>

              {testLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">Sending Test Request...</span>
                </div>
              )}

              {!testLoading && !testResponse && (
                <div className="py-12 text-center text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-2xl bg-white">
                  No response data available. Please click test above to run the webhook.
                </div>
              )}

              {!testLoading && testResponse && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      testResponse.status >= 200 && testResponse.status < 300
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      Status: {testResponse.status || (testResponse.success ? 'OK' : 'Error')} {testResponse.statusText || ''}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      Time: {testResponse.timeMs || 0}ms
                    </span>
                  </div>

                  {testResponse.error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium font-mono leading-relaxed">
                      Error: {testResponse.error}
                    </div>
                  )}

                  {testResponse.body && (
                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Response Body</label>
                      <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-60">
                        {typeof testResponse.body === 'object'
                          ? JSON.stringify(testResponse.body, null, 2)
                          : String(testResponse.body)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              onSave(null);
              onClose();
            }}
            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all hover:text-red-700 cursor-pointer"
          >
            Delete
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-350 hover:border-slate-800 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(localConfig);
                onClose();
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-100"
            >
              Save
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main Flow Builder Content ────────────────────────────────────────────────
function FlowBuilderContent() {
  const { id, workspaceId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showStepMenu, setShowStepMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const { authFetch } = useAuth();
  const [fields, setFields] = useState([]);
  const [showDynamicConfigModal, setShowDynamicConfigModal] = useState(null);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [fetchingMediaAssets, setFetchingMediaAssets] = useState(false);
  const [activeMediaSelectCompId, setActiveMediaSelectCompId] = useState(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const fetchMediaAssets = useCallback(async () => {
    if (!workspaceId) return;
    setFetchingMediaAssets(true);
    try {
      const res = await authFetch(`${appConfig.API_BASE}/content/media?workspace_id=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setMediaAssets(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch media assets", e);
    } finally {
      setFetchingMediaAssets(false);
    }
  }, [workspaceId, authFetch]);

  const [templates, setTemplates] = useState([]);
  const [fetchingTemplates, setFetchingTemplates] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!workspaceId) return;
    setFetchingTemplates(true);
    try {
      const res = await authFetch(`${appConfig.API_BASE}/content/templates?workspace_id=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch templates", e);
    } finally {
      setFetchingTemplates(false);
    }
  }, [workspaceId, authFetch]);

  const fetchFields = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await authFetch(`${appConfig.API_BASE}/content/fields?workspace_id=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setFields(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch fields", e);
    }
  }, [workspaceId, authFetch]);

  useEffect(() => {
    if (workspaceId) {
      fetchFields();
      fetchMediaAssets();
      fetchTemplates();
    }
  }, [workspaceId, fetchFields, fetchMediaAssets, fetchTemplates]);

  const handleAddComponent = (type) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => {
      if (n.id !== selectedNodeId) return n;
      const comps = n.data.components || [];
      const currentComps = [...comps];
      if (currentComps.length === 0 && (n.data.text || n.data.message_configured)) {
        currentComps.push({
          id: `comp-text-legacy`,
          type: 'text',
          text: n.data.text || '',
          buttons: n.data.buttons || []
        });
      }

      let newComp = {
        id: `comp-${type}-${Date.now()}`,
        type: type
      };

      if (type === 'text') {
        newComp.text = '';
        newComp.buttons = [];
      } else if (type === 'dynamic') {
        newComp.method = 'POST';
        newComp.url = '';
        newComp.headers = [];
        newComp.params = [];
        newComp.bodyType = 'none';
        newComp.bodyRaw = '';
        newComp.bodyParams = [];
        newComp.authType = 'none';
      } else if (type === 'card') {
        newComp.cards = [{ id: `card-${Date.now()}`, title: '', subtitle: '', image: '', buttons: [] }];
        newComp.activeCardIdx = 0;
      } else if (type === 'media') {
        newComp.mediaType = '';
        newComp.mediaUrl = '';
        newComp.mediaName = '';
        newComp.mediaSize = '';
        newComp.location = { latitude: '', longitude: '', name: '', address: '' };
      } else if (type === 'others') {
        newComp.otherType = '';
      }

      return {
        ...n,
        data: {
          ...n.data,
          message_configured: true,
          components: [...currentComps, newComp]
        }
      };
    }));
  };

  const handleUpdateComponent = (compId, updates) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => {
      if (n.id !== selectedNodeId) return n;
      const comps = n.data.components || [];
      const currentComps = [...comps];
      if (currentComps.length === 0 && (n.data.text || n.data.message_configured)) {
        currentComps.push({
          id: `comp-text-legacy`,
          type: 'text',
          text: n.data.text || '',
          buttons: n.data.buttons || []
        });
      }
      return {
        ...n,
        data: {
          ...n.data,
          components: currentComps.map(c => c.id === compId ? { ...c, ...updates } : c)
        }
      };
    }));
  };

  const handleDeleteComponent = (compId) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => {
      if (n.id !== selectedNodeId) return n;
      const comps = n.data.components || [];
      const currentComps = [...comps];
      if (currentComps.length === 0 && (n.data.text || n.data.message_configured)) {
        currentComps.push({
          id: `comp-text-legacy`,
          type: 'text',
          text: n.data.text || '',
          buttons: n.data.buttons || []
        });
      }
      const filtered = currentComps.filter(c => c.id !== compId);
      return {
        ...n,
        data: {
          ...n.data,
          message_configured: filtered.length > 0,
          components: filtered
        }
      };
    }));
  };

  const handleMoveComponent = (index, direction) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => {
      if (n.id !== selectedNodeId) return n;
      const comps = n.data.components || [];
      const currentComps = [...comps];
      if (currentComps.length === 0 && (n.data.text || n.data.message_configured)) {
        currentComps.push({
          id: `comp-text-legacy`,
          type: 'text',
          text: n.data.text || '',
          buttons: n.data.buttons || []
        });
      }
      if (direction === 'up' && index > 0) {
        const temp = currentComps[index];
        currentComps[index] = currentComps[index - 1];
        currentComps[index - 1] = temp;
      } else if (direction === 'down' && index < currentComps.length - 1) {
        const temp = currentComps[index];
        currentComps[index] = currentComps[index + 1];
        currentComps[index + 1] = temp;
      }
      return {
        ...n,
        data: {
          ...n.data,
          components: currentComps
        }
      };
    }));
  };

  const { zoomIn, zoomOut, fitView, getViewport, setViewport } = useReactFlow();
  const connectingNodeId = useRef(null);
  const connectingHandleId = useRef(null);
  const reactFlowWrapper = useRef(null);
  const { project } = useReactFlow();

  const getSafePosition = (x, y) => {
    const menuW = 360, menuH = 520, pad = 20;
    let sx = x + menuW + pad > window.innerWidth ? window.innerWidth - menuW - pad : x;
    let sy = y + menuH / 2 + pad > window.innerHeight ? window.innerHeight - menuH / 2 - pad : y;
    if (sy - menuH / 2 - pad < 60) sy = menuH / 2 + 60;
    return { x: Math.max(0, sx), y: Math.max(0, sy) };
  };

  useEffect(() => {
    if (!id) return;
    supabase.from('flows').select('*').eq('id', id).eq('workspace_id', workspaceId).single()
      .then(({ data }) => {
        if (!data) return;
        setFlowName(data.name || 'Untitled Flow');
        if (data.flow_data) {
          setNodes(data.flow_data.nodes || initialNodes);
          setEdges(data.flow_data.edges || []);
          setTimeout(() => {
            if (data.flow_data.viewport) {
              setViewport(data.flow_data.viewport);
            } else {
              fitView({ padding: 0.2, maxZoom: 0.3 });
            }
          }, 50);
        }
      });
  }, [id, workspaceId, setNodes, setEdges, setViewport, fitView]);

  const onConnect = useCallback((params) => {
    connectingNodeId.current = null;
    connectingHandleId.current = null;
    setEdges(eds => addEdge({ ...params, type: 'default', animated: false, style: { strokeWidth: 4.5, stroke: '#ffffff' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff' } }, eds));
  }, [setEdges]);

  const onConnectStart = useCallback((_, { nodeId, handleId }) => {
    connectingNodeId.current = nodeId;
    connectingHandleId.current = handleId;
  }, []);

  const onConnectEnd = useCallback((event) => {
    const target = event.target;
    const isHandle = target.classList.contains('react-flow__handle') || target.closest?.('.react-flow__handle');
    if (!isHandle && (connectingNodeId.current || connectingHandleId.current)) {
      const { clientX, clientY } = event instanceof TouchEvent ? event.changedTouches[0] : event;
      setConnectionInfo({ nodeId: connectingNodeId.current || '', handleId: connectingHandleId.current });
      setTimeout(() => {
        const safePos = getSafePosition(clientX, clientY);
        setMenuPosition(safePos);
        setShowStepMenu(true);
      }, 50);
    }
  }, []);

  const addNode = (type, label) => {
    const newNodeId = `${type}-${Date.now()}`;
    let position = { x: 0, y: 0 };
    if (reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      position = project({ x: menuPosition.x - bounds.left, y: menuPosition.y - bounds.top });
    }

    const defaultData = {
      label, actions: [], text: '', buttons: [],
      message_configured: false,
      question_text: null, question_type: null,
      groups: type === 'condition' ? [{ label: 'Group 1' }, { label: 'Otherwise' }] : undefined,
      branches: type === 'split' ? [{ label: 'Branch A', percent: 50 }, { label: 'Branch B', percent: 50 }] : undefined,
    };

    const newNode = { id: newNodeId, type, position, data: defaultData };
    setNodes(nds => nds.concat(newNode));

    const sourceNodeId = connectionInfo?.nodeId || connectingNodeId.current;
    const sourceHandleId = connectionInfo?.handleId || connectingHandleId.current;
    if (sourceNodeId) {
      setEdges(eds => eds.concat({
        id: `e-${sourceNodeId}-${newNodeId}`, source: sourceNodeId, sourceHandle: sourceHandleId, target: newNodeId,
        type: 'default', animated: false, style: { strokeWidth: 4.5, stroke: '#ffffff' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff' }
      }));
    }

    setShowStepMenu(false);
    setConnectionInfo(null);
    connectingNodeId.current = null;
    connectingHandleId.current = null;
    setSelectedNodeId(newNodeId);
  };

  const onNodesChangeWrapped = useCallback((changes) => { onNodesChange(changes); setIsDirty(true); }, [onNodesChange]);
  const onEdgesChangeWrapped = useCallback((changes) => { onEdgesChange(changes); setIsDirty(true); }, [onEdgesChange]);

  const saveFlow = async () => {
    if (!id) return;
    setSaving(true);
    const viewport = getViewport();
    try {
      const { error } = await supabase.from('flows').update({ flow_data: { nodes, edges, viewport }, nodes: nodes.length, updated_at: new Date() }).eq('id', id).eq('workspace_id', workspaceId);
      if (error) throw error;
      setIsDirty(false);
    } catch (err) { alert(`Failed to save: ${err.message}`); } finally { setSaving(false); }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      navigate(`/${workspaceId}/whatsapp/flows`);
    }
  };

  const onLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', ranksep: 120, nodesep: 80 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 320, height: 420 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 160,
          y: nodeWithPosition.y - 210,
        },
      };
    });

    setNodes(layoutedNodes);
    setIsDirty(true);
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800, maxZoom: 0.3 });
    }, 100);
  }, [nodes, edges, setNodes, fitView]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const messageNodes = nodes.filter(n => n.type === 'message');
  const nodesWithNumbering = nodes.map(node => {
    if (node.type === 'message') {
      const index = messageNodes.findIndex(mn => mn.id === node.id);
      return { ...node, data: { ...node.data, nodeNumber: index + 1 } };
    }
    return node;
  });

  const NODE_TYPE_LABELS = {
    start: 'Trigger', message: 'Send Message', action: 'Action', question: 'Question',
    condition: 'Condition', split: 'Split', send_email: 'Send Email', go_to: 'Go To', comment: 'Comment',
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* ── Top Header ── */}
      <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200 shadow-sm flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Flows</span>
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm shadow-green-200">
              <GitBranch className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-none">{flowName}</h1>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Flow Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-100 rounded-full ml-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">DRAFT</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-all border border-transparent hover:border-slate-200">
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          <button onClick={saveFlow} disabled={saving} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${isDirty ? 'bg-white border-slate-200 text-slate-700 hover:border-green-300 hover:text-green-700 shadow-sm' : 'text-slate-400 border-transparent cursor-default'}`}>
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isDirty ? 'Save Changes' : 'All Saved'}</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 transition-all active:scale-95">
            Publish Flow
          </button>
        </div>
      </header>

      {/* ── Canvas Area ── */}
      <main className="flex-1 relative overflow-hidden" ref={reactFlowWrapper}>
        <ReactFlow
          style={{ backgroundColor: '#2e2c2c' }}
          nodes={nodesWithNumbering}
          edges={edges}
          onNodesChange={onNodesChangeWrapped}
          onEdgesChange={onEdgesChangeWrapped}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => { setShowStepMenu(false); setSelectedNodeId(null); }}
          minZoom={0.1}
          defaultEdgeOptions={{
            type: 'default', animated: false,
            style: { strokeWidth: 4.5, stroke: '#ffffff' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff' },
          }}
        >
          <Background color="#444141" gap={24} size={1} />

          {/* Zoom Controls */}
          <div className="absolute bottom-8 right-8 flex items-center bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden z-50">
            <button onClick={() => zoomIn()} className="p-3 text-slate-500 hover:text-green-600 hover:bg-green-50 transition-all border-r border-slate-100">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => fitView({ padding: 0.2 })} className="px-3 py-3 text-slate-500 hover:text-green-600 hover:bg-green-50 transition-all text-xs font-bold border-r border-slate-100">
              FIT
            </button>
            <button onClick={() => zoomOut()} className="p-3 text-slate-500 hover:text-green-600 hover:bg-green-50 transition-all">
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Node FAB */}
          <button
            onClick={() => {
              const bounds = reactFlowWrapper.current?.getBoundingClientRect();
              const pos = bounds ? { x: bounds.width / 2 + bounds.left, y: bounds.height / 2 + bounds.top } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
              const safePos = getSafePosition(pos.x, pos.y);
              setMenuPosition(safePos);
              setShowStepMenu(true);
            }}
            className="absolute bottom-8 left-8 flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl shadow-xl shadow-green-200 font-bold hover:scale-105 active:scale-95 transition-all z-50 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>

          {/* Arrange Flow FAB */}
          <button
            type="button"
            onClick={onLayout}
            className="absolute bottom-8 left-44 flex items-center gap-2.5 px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-2xl shadow-xl font-bold hover:scale-105 active:scale-95 transition-all z-50 text-sm cursor-pointer"
          >
            <Network className="w-4 h-4 text-green-500" />
            Arrange Flow
          </button>
        </ReactFlow>

        {/* Step Picker Menu */}
        {showStepMenu && (
          <>
            <div className="fixed inset-0 z-40 bg-slate-900/5 backdrop-blur-[2px]" onClick={() => { setShowStepMenu(false); connectingNodeId.current = null; }} />
            <div
              className="fixed z-50 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 overflow-hidden border border-slate-100"
              style={{ top: menuPosition.y, left: menuPosition.x, width: 340, transform: 'translate(12px, -50%)' }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-50">
                <div>
                  <p className="text-[10px] font-black tracking-[0.18em] text-green-600 uppercase mb-0.5">Flow Builder</p>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Add New Step</h3>
                </div>
                <button onClick={() => { setShowStepMenu(false); connectingNodeId.current = null; }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="p-3 max-h-[460px] overflow-y-auto">
                {steps.map(({ type, value, icon: Icon, desc, color, bg, border }) => {
                  const isHovered = hoveredStep === type;
                  return (
                    <button key={type} onMouseEnter={() => setHoveredStep(type)} onMouseLeave={() => setHoveredStep(null)}
                      onClick={() => addNode(value, type)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl mb-1 text-left transition-all duration-200"
                      style={{ background: isHovered ? bg : 'transparent', transform: isHovered ? 'translateX(4px)' : 'translateX(0)' }}
                    >
                      <div className="w-10 h-10 rounded-[12px] flex-shrink-0 flex items-center justify-center transition-all duration-200 shadow-sm"
                        style={{ background: isHovered ? 'white' : '#f8fafc', border: `1.5px solid ${isHovered ? border : '#f1f5f9'}` }}>
                        <Icon size={18} color={isHovered ? color : '#94a3b8'} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-black tracking-tight" style={{ color: isHovered ? '#0f172a' : '#334155' }}>{type}</p>
                        <p className="text-[11px] font-medium mt-0.5" style={{ color: isHovered ? '#475569' : '#94a3b8' }}>{desc}</p>
                      </div>
                      <div className="transition-all duration-200" style={{ opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateX(0)' : 'translateX(-8px)' }}>
                        <ChevronRight size={16} color={color} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Right Inspector Panel ── */}
        {selectedNode && (
          <aside className="absolute right-6 top-6 bottom-6 w-80 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                {selectedNode.type === 'message' && <MessageSquare size={16} className="text-white" />}
                {selectedNode.type === 'action' && <Zap size={16} className="text-white" />}
                {selectedNode.type === 'question' && <HelpCircle size={16} className="text-white" />}
                {selectedNode.type === 'condition' && <GitBranch size={16} className="text-white" />}
                {selectedNode.type === 'split' && <Shuffle size={16} className="text-white" />}
                {selectedNode.type === 'send_email' && <Mail size={16} className="text-white" />}
                {selectedNode.type === 'go_to' && <CornerDownRight size={16} className="text-white" />}
                {selectedNode.type === 'comment' && <MessageCircle size={16} className="text-white" />}
                {selectedNode.type === 'start' && <Zap size={16} className="text-white" />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Editing</p>
                <h3 className="text-sm font-black text-white">{NODE_TYPE_LABELS[selectedNode.type] || selectedNode.type}</h3>
              </div>
            </div>
            <button onClick={() => setSelectedNodeId(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Panel Body */}
          <div className="p-4 overflow-y-auto flex-1">
            {selectedNode.type === 'message' && (
              <div className="flex flex-col h-full animate-in fade-in duration-200">
                {/* Note */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Internal Note</label>
                  <textarea placeholder="Add a note for your team..." className="w-full min-h-[52px] p-3 text-xs bg-amber-50 border border-amber-100 rounded-xl outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-300 transition-all placeholder:text-amber-300 italic font-medium resize-none" value={selectedNode.data.note || ''} onChange={e => setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, note: e.target.value } } : n))} />
                </div>

                {(() => {
                  const comps = selectedNode.data.components || [];
                  const displayComps = [...comps];
                  // Migrate legacy text if components is currently empty
                  if (displayComps.length === 0 && (selectedNode.data.text || selectedNode.data.message_configured)) {
                    displayComps.push({
                      id: `comp-text-legacy`,
                      type: 'text',
                      text: selectedNode.data.text || '',
                      buttons: selectedNode.data.buttons || []
                    });
                  }

                  return (
                    <div className="space-y-4">
                      {/* Active Components List */}
                      {displayComps.length > 0 && (
                        <div className="space-y-3.5">
                          {displayComps.map((comp, idx) => (
                            <div key={comp.id || idx} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 relative text-left">
                              {/* Header Actions */}
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  {comp.type === 'text' ? 'Text Component' : comp.type === 'dynamic' ? 'Dynamic Request' : comp.type === 'card' ? 'Card Component' : comp.type === 'media' ? 'Rich Media' : comp.type === 'others' ? 'WhatsApp Action' : comp.type}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveComponent(idx, 'up')}
                                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded transition-colors border-0 bg-transparent cursor-pointer"
                                    title="Move Up"
                                  >
                                    <ArrowUp size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === displayComps.length - 1}
                                    onClick={() => handleMoveComponent(idx, 'down')}
                                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded transition-colors border-0 bg-transparent cursor-pointer"
                                    title="Move Down"
                                  >
                                    <ArrowDown size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComponent(comp.id)}
                                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors border-0 bg-transparent cursor-pointer ml-1"
                                    title="Delete Component"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>

                              {/* Editor Body */}
                              {comp.type === 'text' && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Message Text</label>
                                    <textarea
                                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium leading-relaxed resize-none"
                                      rows={4}
                                      placeholder="Type your message..."
                                      value={comp.text || ''}
                                      onChange={e => handleUpdateComponent(comp.id, { text: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Buttons</label>
                                    <div className="space-y-2">
                                      {(comp.buttons || []).map((btn, btnIdx) => (
                                        <div key={btn.id || btnIdx} className="flex gap-2">
                                          <input
                                            className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-green-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10 transition-all text-center"
                                            value={btn.label}
                                            maxLength={20}
                                            onChange={e => {
                                              const nb = [...(comp.buttons || [])];
                                              nb[btnIdx] = { ...nb[btnIdx], label: e.target.value };
                                              handleUpdateComponent(comp.id, { buttons: nb });
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nb = (comp.buttons || []).filter((_, i) => i !== btnIdx);
                                              handleUpdateComponent(comp.id, { buttons: nb });
                                            }}
                                            className="w-8 h-8 border border-slate-200 text-slate-350 hover:bg-red-50 hover:text-red-500 hover:border-red-200 rounded-xl transition-all flex items-center justify-center bg-white cursor-pointer"
                                          >
                                            <Minus size={12} />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nb = [...(comp.buttons || []), { id: `btn-${Date.now()}`, label: 'New Button' }];
                                          handleUpdateComponent(comp.id, { buttons: nb });
                                        }}
                                        className="w-full py-2 bg-green-50/50 border border-dashed border-slate-800 text-green-600 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-green-50 hover:border-green-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <Plus size={11} /> Add Button
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {comp.type === 'dynamic' && (
                                <div className="space-y-3">
                                  <p className="text-[10px] text-slate-500 leading-normal">Configure HTTP request to dynamically fetch and render message template variables.</p>
                                  {comp.url ? (
                                    <div className="p-2 bg-slate-50 border border-slate-150 rounded-lg text-[10px] font-semibold text-slate-700 truncate font-mono">
                                      <span className="text-blue-600 font-extrabold uppercase mr-1">{comp.method || 'POST'}</span> {comp.url}
                                    </div>
                                  ) : (
                                    <div className="p-2 bg-yellow-50 border border-yellow-100 rounded-lg text-[10px] text-yellow-600 font-medium italic">
                                      Webhook URL is not configured yet.
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowDynamicConfigModal(comp.id)}
                                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-800 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Settings2 size={13} /> Configure Request
                                  </button>
                                </div>
                              )}

                              {comp.type === 'card' && (() => {
                                const cardsList = comp.cards || [];
                                const activeIdx = comp.activeCardIdx || 0;
                                const activeCard = cardsList[activeIdx] || cardsList[0] || { id: 'default', title: '', subtitle: '', image: '', buttons: [] };

                                const handleUpdateCardField = (field, val) => {
                                  const newList = cardsList.map((c, i) => i === activeIdx ? { ...c, [field]: val } : c);
                                  handleUpdateComponent(comp.id, { cards: newList });
                                };

                                const handleAddCard = () => {
                                  if (cardsList.length >= 10) return;
                                  const newCard = { id: `card-${Date.now()}`, title: '', subtitle: '', image: '', buttons: [] };
                                  handleUpdateComponent(comp.id, { cards: [...cardsList, newCard], activeCardIdx: cardsList.length });
                                };

                                const handleDeleteCard = (cIdx, e) => {
                                  e.stopPropagation();
                                  if (cardsList.length <= 1) return;
                                  const newList = cardsList.filter((_, i) => i !== cIdx);
                                  const nextActive = activeIdx >= newList.length ? newList.length - 1 : activeIdx;
                                  handleUpdateComponent(comp.id, { cards: newList, activeCardIdx: Math.max(0, nextActive) });
                                };

                                const handleDragStart = (e, dragIdx) => {
                                  e.dataTransfer.setData("text/plain", dragIdx);
                                };

                                const handleDrop = (e, dropIdx) => {
                                  const dragIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                                  if (isNaN(dragIdx) || dragIdx === dropIdx) return;
                                  const list = [...cardsList];
                                  const dragged = list[dragIdx];
                                  list.splice(dragIdx, 1);
                                  list.splice(dropIdx, 0, dragged);
                                  handleUpdateComponent(comp.id, { cards: list, activeCardIdx: dropIdx });
                                };

                                const handleDragOver = (e) => {
                                  e.preventDefault();
                                };

                                return (
                                  <div className="space-y-4">
                                    {/* Selector Grid of Cards */}
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Cards ({cardsList.length}/10)</label>
                                      <div className="grid grid-cols-5 gap-2 bg-slate-100/40 p-2 rounded-xl border border-slate-200">
                                        {cardsList.map((c, cIdx) => (
                                          <div
                                            key={c.id || cIdx}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, cIdx)}
                                            onDrop={(e) => handleDrop(e, cIdx)}
                                            onDragOver={handleDragOver}
                                            onClick={() => handleUpdateComponent(comp.id, { activeCardIdx: cIdx })}
                                            onMouseEnter={() => handleUpdateComponent(comp.id, { activeCardIdx: cIdx })}
                                            className={`relative aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-all border group ${
                                              cIdx === activeIdx
                                                ? 'border-blue-600 bg-white shadow-sm ring-1 ring-blue-500/10'
                                                : 'border-slate-200 bg-slate-50 hover:bg-white'
                                            }`}
                                          >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cIdx === activeIdx ? "#2563eb" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <rect x="3" y="9" width="18" height="12" rx="2" ry="2" />
                                              <path d="M7 5h10M9 2h6" />
                                            </svg>
                                            {cardsList.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={(e) => handleDeleteCard(cIdx, e)}
                                                className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center border-0 shadow-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-[9px] font-bold"
                                                title="Delete Card"
                                              >
                                                ✕
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                        {cardsList.length < 10 && (
                                          <button
                                            type="button"
                                            onClick={handleAddCard}
                                            className="aspect-square rounded-lg flex items-center justify-center cursor-pointer border border-dashed border-blue-400 bg-blue-50/20 text-blue-600 hover:bg-blue-50 transition-all font-bold text-sm"
                                            title="Add Card"
                                          >
                                            <Plus size={16} />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Active Card Fields */}
                                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-150 shadow-sm text-left">
                                      <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Editing Card #{activeIdx + 1}</p>
                                        {cardsList.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={(e) => handleDeleteCard(activeIdx, e)}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                                            title="Delete current card"
                                          >
                                            ✕ Remove Card
                                          </button>
                                        )}
                                      </div>
                                      
                                      {/* Image Upload Zone */}
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Card Image</label>
                                        {activeCard.image ? (
                                          <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video group">
                                            <img src={activeCard.image} className="w-full h-full object-cover" />
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateCardField('image', '')}
                                              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-lg transition-colors border-0 cursor-pointer"
                                              title="Remove Image"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative cursor-pointer group">
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                  handleUpdateCardField('image', reader.result);
                                                };
                                                reader.readAsDataURL(file);
                                              }}
                                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                                              <ImageIcon size={22} className="mb-1" />
                                              <span className="text-[10px] font-bold uppercase tracking-wider">Upload Card Image</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Card Title */}
                                      <div>
                                        <div className="flex justify-between items-center mb-1">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                                          <span className={`text-[9px] font-bold uppercase ${activeCard.title?.length > 80 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {activeCard.title?.length || 0}/80
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          maxLength={80}
                                          placeholder="Enter card title..."
                                          value={activeCard.title || ''}
                                          onChange={(e) => handleUpdateCardField('title', e.target.value)}
                                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm"
                                        />
                                      </div>

                                      {/* Card Subtitle */}
                                      <div>
                                        <div className="flex justify-between items-center mb-1">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase">Subtitle</label>
                                          <span className={`text-[9px] font-bold uppercase ${activeCard.subtitle?.length > 80 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {activeCard.subtitle?.length || 0}/80
                                          </span>
                                        </div>
                                        <textarea
                                          rows={2}
                                          maxLength={80}
                                          placeholder="Enter card description..."
                                          value={activeCard.subtitle || ''}
                                          onChange={(e) => handleUpdateCardField('subtitle', e.target.value)}
                                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm resize-none"
                                        />
                                      </div>

                                      {/* Card Buttons */}
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Card Buttons</label>
                                        <div className="space-y-2">
                                          {(activeCard.buttons || []).map((btn, btnIdx) => (
                                            <div key={btn.id || btnIdx} className="flex gap-2">
                                              <input
                                                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-blue-600 focus:outline-none focus:border-slate-800 transition-all text-center"
                                                value={btn.label}
                                                maxLength={20}
                                                onChange={e => {
                                                  const nb = [...(activeCard.buttons || [])];
                                                  nb[btnIdx] = { ...nb[btnIdx], label: e.target.value };
                                                  handleUpdateCardField('buttons', nb);
                                                }}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const nb = (activeCard.buttons || []).filter((_, i) => i !== btnIdx);
                                                  handleUpdateCardField('buttons', nb);
                                                }}
                                                className="w-8 h-8 border border-slate-200 text-slate-350 hover:bg-red-50 hover:text-red-500 hover:border-red-200 rounded-xl transition-all flex items-center justify-center bg-white cursor-pointer"
                                              >
                                                <Minus size={12} />
                                              </button>
                                            </div>
                                          ))}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nb = [...(activeCard.buttons || []), { id: `btn-${Date.now()}`, label: 'New Button' }];
                                              handleUpdateCardField('buttons', nb);
                                            }}
                                            className="w-full py-2 bg-blue-50/50 border border-dashed border-slate-800 text-blue-600 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                          >
                                            <Plus size={11} /> Add Button
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {comp.type === 'media' && (() => {
                                const mediaType = comp.mediaType || '';
                                const mediaUrl = comp.mediaUrl || '';
                                const mediaName = comp.mediaName || '';
                                const mediaSize = comp.mediaSize || '';
                                const loc = comp.location || { latitude: '', longitude: '', name: '', address: '' };

                                const mediaTypes = [
                                  { id: 'image', label: 'Image', icon: ImageIcon },
                                  { id: 'photo', label: 'Photo', icon: Camera },
                                  { id: 'video', label: 'Video', icon: Video },
                                  { id: 'audio', label: 'Audio', icon: Music },
                                  { id: 'sticker', label: 'Sticker', icon: Smile },
                                  { id: 'file', label: 'File', icon: FileText },
                                  { id: 'location', label: 'Location', icon: MapPin },
                                ];

                                const handleSelectType = (typeId) => {
                                  handleUpdateComponent(comp.id, {
                                    mediaType: typeId,
                                    mediaUrl: '',
                                    mediaName: '',
                                    mediaSize: '',
                                    location: { latitude: '', longitude: '', name: '', address: '' }
                                  });
                                  setActiveMediaSelectCompId(null);
                                };

                                const handleUpload = async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    const base64Url = reader.result;
                                    const formattedSize = formatBytes(file.size);

                                    handleUpdateComponent(comp.id, {
                                      mediaUrl: base64Url,
                                      mediaName: file.name,
                                      mediaSize: formattedSize
                                    });

                                    try {
                                      const res = await authFetch(`${appConfig.API_BASE}/content/media`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                          name: file.name,
                                          type: mediaType || 'image',
                                          url: base64Url,
                                          size: formattedSize,
                                          workspace_id: workspaceId
                                        })
                                      });
                                      if (res.ok) {
                                        const saved = await res.json();
                                        fetchMediaAssets();
                                        if (saved && saved.url) {
                                          handleUpdateComponent(comp.id, {
                                            mediaUrl: saved.url
                                          });
                                        }
                                      }
                                    } catch (err) {
                                      console.error("Failed to save media to content library", err);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                };

                                const filteredAssets = mediaAssets.filter(asset => {
                                  if (mediaType === 'photo') {
                                    return asset.type === 'photo' || asset.type === 'image';
                                  }
                                  return asset.type === mediaType;
                                });

                                return (
                                  <div className="space-y-3 relative group">
                                    {/* Hover Selector Row / Type Switcher */}
                                    <div className={`p-1 bg-slate-100 rounded-xl border border-slate-200 flex justify-between gap-1 transition-all duration-300 ${
                                      mediaType ? 'opacity-0 h-0 overflow-hidden group-hover:opacity-100 group-hover:h-auto group-hover:p-1 group-hover:mb-2' : 'opacity-100 mb-2'
                                    }`}>
                                      {mediaTypes.map((t) => {
                                        const IconComp = t.icon;
                                        const isActive = mediaType === t.id;
                                        return (
                                          <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => handleSelectType(t.id)}
                                            title={t.label}
                                            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-lg transition-all border cursor-pointer ${
                                              isActive
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                : 'bg-white border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                            }`}
                                          >
                                            <IconComp size={15} />
                                            <span className="text-[7.5px] font-extrabold uppercase mt-0.5 tracking-tighter">{t.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Active Preview & Controls */}
                                    {mediaType && (
                                      <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-sm space-y-3 text-left">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            {mediaType === 'image' && <ImageIcon size={11} />}
                                            {mediaType === 'photo' && <Camera size={11} />}
                                            {mediaType === 'video' && <Video size={11} />}
                                            {mediaType === 'audio' && <Music size={11} />}
                                            {mediaType === 'sticker' && <Smile size={11} />}
                                            {mediaType === 'file' && <FileText size={11} />}
                                            {mediaType === 'location' && <MapPin size={11} />}
                                            {mediaType} Configuration
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleSelectType('')}
                                            className="text-[9px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                                          >
                                            Change Type
                                          </button>
                                        </div>

                                        {mediaType === 'location' ? (
                                          /* Location Editor Fields */
                                          <div className="space-y-2">
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Location Name</label>
                                              <input
                                                type="text"
                                                placeholder="E.g., Headquarters"
                                                value={loc.name || ''}
                                                onChange={(e) => {
                                                  handleUpdateComponent(comp.id, {
                                                    location: { ...loc, name: e.target.value }
                                                  });
                                                }}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Address</label>
                                              <input
                                                type="text"
                                                placeholder="E.g., 123 Main St, NY"
                                                value={loc.address || ''}
                                                onChange={(e) => {
                                                  handleUpdateComponent(comp.id, {
                                                    location: { ...loc, address: e.target.value }
                                                  });
                                                }}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm"
                                              />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                              <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Latitude</label>
                                                <input
                                                  type="text"
                                                  placeholder="E.g., 40.7128"
                                                  value={loc.latitude || ''}
                                                  onChange={(e) => {
                                                    handleUpdateComponent(comp.id, {
                                                      location: { ...loc, latitude: e.target.value }
                                                    });
                                                  }}
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Longitude</label>
                                                <input
                                                  type="text"
                                                  placeholder="E.g., -74.0060"
                                                  value={loc.longitude || ''}
                                                  onChange={(e) => {
                                                    handleUpdateComponent(comp.id, {
                                                      location: { ...loc, longitude: e.target.value }
                                                    });
                                                  }}
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          /* File / Media Asset Upload & Selection */
                                          <div className="space-y-3">
                                            {mediaUrl ? (
                                              /* Uploaded/Selected Media Preview */
                                              <div className="relative border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between group/preview">
                                                <div className="flex items-center gap-2.5 overflow-hidden pr-6">
                                                  {(mediaType === 'image' || mediaType === 'photo') && (
                                                    <img src={mediaUrl} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                                                  )}
                                                  {mediaType === 'video' && (
                                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center shrink-0">
                                                      <Video size={14} />
                                                    </div>
                                                  )}
                                                  {mediaType === 'audio' && (
                                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                                      <Music size={14} />
                                                    </div>
                                                  )}
                                                  {mediaType === 'sticker' && (
                                                    <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center shrink-0">
                                                      <Smile size={14} />
                                                    </div>
                                                  )}
                                                  {mediaType === 'file' && (
                                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                                                      <FileText size={14} />
                                                    </div>
                                                  )}
                                                  <div className="text-left overflow-hidden">
                                                    <p className="text-xs font-bold text-slate-700 truncate">{mediaName || 'Uploaded Asset'}</p>
                                                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{mediaSize || 'Size unknown'}</p>
                                                  </div>
                                                </div>

                                                <button
                                                  type="button"
                                                  onClick={() => handleUpdateComponent(comp.id, { mediaUrl: '', mediaName: '', mediaSize: '' })}
                                                  className="absolute top-2.5 right-2.5 p-1 bg-black/60 hover:bg-black text-white rounded-lg transition-colors border-0 cursor-pointer"
                                                  title="Remove Asset"
                                                >
                                                  <Trash2 size={12} />
                                                </button>
                                              </div>
                                            ) : (
                                              /* Empty State: Choice of Upload or Select */
                                              <div className="space-y-2.5">
                                                <div className="grid grid-cols-2 gap-2">
                                                  {/* Upload Trigger Box */}
                                                  <div className="border border-dashed border-slate-800 hover:border-blue-500 rounded-xl p-3 text-center bg-slate-50/20 hover:bg-slate-50 transition-all cursor-pointer relative group/upload">
                                                    <input
                                                      type="file"
                                                      accept={
                                                        mediaType === 'image' || mediaType === 'photo' ? 'image/*' :
                                                        mediaType === 'video' ? 'video/*' :
                                                        mediaType === 'audio' ? 'audio/*' :
                                                        mediaType === 'sticker' ? 'image/webp,image/png' : '*/*'
                                                      }
                                                      capture={mediaType === 'photo' ? 'environment' : undefined}
                                                      onChange={handleUpload}
                                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover/upload:text-blue-600 transition-colors">
                                                      <Upload size={16} className="mb-1" />
                                                      <span className="text-[9px] font-black uppercase tracking-wider">Upload File</span>
                                                    </div>
                                                  </div>

                                                  {/* Library Select Box */}
                                                  <button
                                                    type="button"
                                                    onClick={() => setActiveMediaSelectCompId(activeMediaSelectCompId === comp.id ? null : comp.id)}
                                                    className="border border-dashed border-slate-800 hover:border-blue-500 rounded-xl p-3 text-center bg-slate-50/20 hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center justify-center group/lib animate-none"
                                                  >
                                                    <FolderOpen size={16} className="mb-1 text-slate-400 group-hover/lib:text-blue-600 transition-colors" />
                                                    <span className="text-[9px] font-black text-slate-400 group-hover/lib:text-blue-600 uppercase tracking-wider">Select Library</span>
                                                  </button>
                                                </div>

                                                {/* Inline Library Selection Dropdown */}
                                                {activeMediaSelectCompId === comp.id && (
                                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1">
                                                    <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-100">
                                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Available Library Files</span>
                                                      <button
                                                        type="button"
                                                        onClick={() => setActiveMediaSelectCompId(null)}
                                                        className="text-[8px] font-bold text-slate-400 hover:text-slate-600"
                                                      >
                                                        ✕
                                                      </button>
                                                    </div>
                                                    {filteredAssets.length === 0 ? (
                                                      <p className="text-[9px] text-slate-400 italic text-center py-2">No matching {mediaType} assets in library</p>
                                                    ) : (
                                                      filteredAssets.map(asset => (
                                                        <button
                                                          key={asset.id}
                                                          type="button"
                                                          onClick={() => {
                                                            handleUpdateComponent(comp.id, {
                                                              mediaUrl: asset.url,
                                                              mediaName: asset.name,
                                                              mediaSize: asset.size || '',
                                                            });
                                                            setActiveMediaSelectCompId(null);
                                                          }}
                                                          className="w-full text-left p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-between text-[11px] font-semibold text-slate-700"
                                                        >
                                                          <span className="truncate max-w-[70%]">{asset.name}</span>
                                                          <span className="text-[8.5px] text-slate-400 font-mono">{asset.size}</span>
                                                        </button>
                                                      ))
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {comp.type === 'others' && (() => {
                                const otherType = comp.otherType || '';
                                const typeLabels = {
                                  template: 'WhatsApp Template',
                                  call_permission: 'WhatsApp Call Permission',
                                  single_product: 'WhatsApp Single Product',
                                  multi_product: 'WhatsApp Multiple Products',
                                  catalog: 'WhatsApp Catalog Message',
                                  flow: 'WhatsApp Flow',
                                  contact: 'WhatsApp Contact',
                                  typing: 'Typing Indicator'
                                };

                                const otherTypesList = [
                                  { id: 'template', label: 'WhatsApp Template', icon: MessageCircle },
                                  { id: 'call_permission', label: 'WhatsApp Call Permission', icon: Phone },
                                  { id: 'single_product', label: 'WhatsApp Single Product', icon: ShoppingCart },
                                  { id: 'multi_product', label: 'WhatsApp Multiple Products', icon: List },
                                  { id: 'catalog', label: 'WhatsApp Catalog Message', icon: Sheet },
                                  { id: 'flow', label: 'WhatsApp Flow', icon: Network },
                                  { id: 'contact', label: 'WhatsApp Contact', icon: User },
                                  { id: 'typing', label: 'Typing Indicator', icon: Clock },
                                ];

                                const handleSelectOtherType = (typeId) => {
                                  const baseUpdates = {
                                    otherType: typeId,
                                    templateName: '',
                                    callButtonText: 'Call Support',
                                    callPhoneNumber: '',
                                    productRetailerId: '',
                                    sectionTitle: '',
                                    productIds: '',
                                    catalogHeader: '',
                                    catalogBody: '',
                                    flowId: '',
                                    flowButtonLabel: 'Launch Flow',
                                    contact: { firstName: '', lastName: '', phone: '' },
                                    typingDelay: 2
                                  };
                                  handleUpdateComponent(comp.id, baseUpdates);
                                };

                                return (
                                  <div className="space-y-3 relative group">
                                    {/* Hover Selector Grid / Type Switcher */}
                                    <div className={`p-2 bg-slate-100 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 transition-all duration-300 ${
                                      otherType ? 'opacity-0 h-0 overflow-hidden group-hover:opacity-100 group-hover:h-auto group-hover:p-2 group-hover:mb-2' : 'opacity-100 mb-2'
                                    }`}>
                                      {otherTypesList.map((t) => {
                                        const IconComp = t.icon;
                                        const isActive = otherType === t.id;
                                        return (
                                          <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => handleSelectOtherType(t.id)}
                                            className={`py-2 px-1 flex flex-col items-center justify-center rounded-lg transition-all border text-center cursor-pointer ${
                                              isActive
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                : 'bg-white border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                            }`}
                                          >
                                            <IconComp size={15} />
                                            <span className="text-[8px] font-black uppercase mt-1 tracking-tight leading-none">{t.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Active Fields */}
                                    {otherType && (
                                      <div className="bg-white p-3.5 rounded-xl border border-slate-150 shadow-sm space-y-3.5 text-left">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            {otherType === 'template' && <MessageCircle size={11} />}
                                            {otherType === 'call_permission' && <Phone size={11} />}
                                            {(otherType === 'single_product' || otherType === 'multi_product') && <ShoppingCart size={11} />}
                                            {otherType === 'catalog' && <Sheet size={11} />}
                                            {otherType === 'flow' && <Network size={11} />}
                                            {otherType === 'contact' && <User size={11} />}
                                            {otherType === 'typing' && <Clock size={11} />}
                                            {typeLabels[otherType]} Configuration
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleSelectOtherType('')}
                                            className="text-[9px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                                          >
                                            Change Type
                                          </button>
                                        </div>

                                        {otherType === 'template' && (
                                          /* WhatsApp Template Select */
                                          <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Select Template</label>
                                            <select
                                              value={comp.templateName || ''}
                                              onChange={(e) => handleUpdateComponent(comp.id, { templateName: e.target.value })}
                                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm"
                                            >
                                              <option value="">-- Choose Template --</option>
                                              {templates.map(t => (
                                                <option key={t.id} value={t.name}>{t.name}</option>
                                              ))}
                                            </select>
                                          </div>
                                        )}

                                        {otherType === 'call_permission' && (
                                          /* Call Permission Configuration */
                                          <div className="space-y-2.5">
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Button Text</label>
                                              <input
                                                type="text"
                                                maxLength={20}
                                                value={comp.callButtonText || ''}
                                                onChange={(e) => handleUpdateComponent(comp.id, { callButtonText: e.target.value })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Phone Number (with Country Code)</label>
                                              <input
                                                type="text"
                                                placeholder="E.g., +15555555555"
                                                value={comp.callPhoneNumber || ''}
                                                onChange={(e) => handleUpdateComponent(comp.id, { callPhoneNumber: e.target.value })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {otherType === 'single_product' && (
                                          /* Single Product Configuration */
                                          <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Retailer Product ID (SKU)</label>
                                            <input
                                              type="text"
                                              placeholder="E.g., sku_12345"
                                              value={comp.productRetailerId || ''}
                                              onChange={(e) => handleUpdateComponent(comp.id, { productRetailerId: e.target.value })}
                                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                            />
                                          </div>
                                        )}

                                        {otherType === 'multi_product' && (
                                          /* Multiple Products Configuration */
                                          <div className="space-y-2.5">
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Section Title</label>
                                              <input
                                                type="text"
                                                placeholder="E.g., Featured Products"
                                                value={comp.sectionTitle || ''}
                                                onChange={(e) => handleUpdateComponent(comp.id, { sectionTitle: e.target.value })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Product SKUs (Comma Separated)</label>
                                              <input
                                                type="text"
                                                placeholder="E.g., sku_1, sku_2, sku_3"
                                                value={comp.productIds || ''}
                                                onChange={(e) => handleUpdateComponent(comp.id, { productIds: e.target.value })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {otherType === 'catalog' && (
                                          /* Catalog Message Configuration */
                                          <div className="space-y-2.5">
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Header Title</label>
                                              <input
                                                type="text"
                                                placeholder="E.g., Our Catalog"
                                                value={comp.catalogHeader || ''}
                                                onChange={(e) => handleUpdateComponent(comp.id, { catalogHeader: e.target.value })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Body Text</label>
                                              <textarea
                                                rows={3}
                                                placeholder="E.g., Check out our brand new catalog!"
                                                value={comp.catalogBody || ''}
                                                onChange={(e) => handleUpdateComponent(comp.id, { catalogBody: e.target.value })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm resize-none"
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {otherType === 'flow' && (
                                          /* WhatsApp Flow Configuration */
                                          <div className="space-y-2.5">
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Flow ID</label>
                                              <input
                                                type="text"
                                                placeholder="E.g., 34567890123"
                                                value={comp.flowId || ''}
                                                onChange={(e) => handleUpdateComponent(comp.id, { flowId: e.target.value })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Button Label</label>
                                              <input
                                                type="text"
                                                value={comp.flowButtonLabel || ''}
                                                onChange={(e) => handleUpdateComponent(comp.id, { flowButtonLabel: e.target.value })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {otherType === 'contact' && (
                                          /* WhatsApp Contact Card */
                                          <div className="space-y-2.5">
                                            <div className="grid grid-cols-2 gap-2">
                                              <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">First Name</label>
                                                <input
                                                  type="text"
                                                  value={comp.contact?.firstName || ''}
                                                  onChange={(e) => handleUpdateComponent(comp.id, {
                                                    contact: { ...(comp.contact || {}), firstName: e.target.value }
                                                  })}
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Last Name</label>
                                                <input
                                                  type="text"
                                                  value={comp.contact?.lastName || ''}
                                                  onChange={(e) => handleUpdateComponent(comp.id, {
                                                    contact: { ...(comp.contact || {}), lastName: e.target.value }
                                                  })}
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                                />
                                              </div>
                                            </div>
                                            <div>
                                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Phone Number</label>
                                              <input
                                                type="text"
                                                placeholder="E.g., +15555555555"
                                                value={comp.contact?.phone || ''}
                                                onChange={(e) => handleUpdateComponent(comp.id, {
                                                  contact: { ...(comp.contact || {}), phone: e.target.value }
                                                })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {otherType === 'typing' && (
                                          /* Typing Indicator Configuration */
                                          <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Typing Delay (Seconds)</label>
                                            <input
                                              type="number"
                                              min={1}
                                              max={15}
                                              value={comp.typingDelay || 2}
                                              onChange={(e) => handleUpdateComponent(comp.id, { typingDelay: parseInt(e.target.value) || 2 })}
                                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {comp.type !== 'text' && comp.type !== 'dynamic' && comp.type !== 'card' && comp.type !== 'media' && comp.type !== 'others' && (
                                <div className="py-3 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-slate-100">
                                  {`${comp.type} component`} config details.
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Component Selector Grid */}
                      <div className="border-t border-slate-150 pt-4 mt-4 text-left">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Add Component</label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {[
                            { id: 'text', label: '+ Text', icon: FileText },
                            { id: 'card', label: '+ Card', icon: Square },
                            { id: 'media', label: 'Rich Media', icon: ImageIcon },
                            { id: 'dynamic', label: '+ Dynamic', icon: ExternalLink, pro: true },
                            { id: 'others', label: 'Others', icon: MoreHorizontal, pro: true },
                          ].map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleAddComponent(item.id)}
                              className="group relative flex flex-col items-center justify-center p-3 h-20 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-green-400 hover:shadow-md hover:bg-green-50/30 transition-all active:scale-95 text-left cursor-pointer"
                            >
                              {item.pro && <div className="absolute top-1.5 right-1.5 px-1 py-0.5 bg-green-500 rounded-md"><span className="text-[7px] font-black text-white uppercase tracking-tighter">PRO</span></div>}
                              <div className="text-slate-400 group-hover:text-green-600 group-hover:scale-110 transition-all mb-1.5"><item.icon size={19} strokeWidth={1.8} /></div>
                              <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-800">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Continue */}
                <div className="mt-auto pt-5 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 text-center">Continue to Next Step</p>
                  <button className="w-full py-3.5 border border-dashed border-slate-200 hover:border-green-400 hover:bg-green-50/40 text-green-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group">
                    Select Next Step <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {selectedNode.type === 'action' && (
              <ActionSidebar node={selectedNode} onOpenContentManager={() => {}} workspaceId={workspaceId || ''}
                onEditAction={(idx) => setEditingActionIndex(idx)}
                updateNode={(data) => setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...data } } : n))}
              />
            )}
            {selectedNode.type === 'question' && <QuestionSidebar node={selectedNode} setNodes={setNodes} />}
            {selectedNode.type === 'condition' && <ConditionSidebar node={selectedNode} setNodes={setNodes} />}
            {selectedNode.type === 'split' && <SplitSidebar node={selectedNode} setNodes={setNodes} />}
            {selectedNode.type === 'send_email' && <SendEmailSidebar node={selectedNode} setNodes={setNodes} />}
            {selectedNode.type === 'comment' && <CommentSidebar node={selectedNode} setNodes={setNodes} />}
          </div>
        </aside>
      )}
      </main>

      {/* ── Edit Action Modals ── */}
      {editingActionIndex !== null && selectedNode?.data?.actions && (() => {
        const act = selectedNode.data.actions[editingActionIndex];
        const commonProps = {
          workspaceId: workspaceId || '',
          onClose: () => setEditingActionIndex(null),
          onSave: (updated) => {
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, actions: n.data.actions.map((a, i) => i === editingActionIndex ? updated : a) } } : n));
            setEditingActionIndex(null);
          },
          onDelete: () => {
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, actions: n.data.actions.filter((_, i) => i !== editingActionIndex) } } : n));
            setEditingActionIndex(null);
          },
        };
        if (act?.type === 'subscribe_sequence' || act?.type === 'unsubscribe_sequence')
          return <SequenceActionModal action={act} {...commonProps} />;
        return <SetVariableModal action={act} {...commonProps} />;
      })()}

      {/* ── Dynamic Content Configuration Modal ── */}
      <DynamicConfigModal
        isOpen={showDynamicConfigModal !== null}
        onClose={() => setShowDynamicConfigModal(null)}
        component={(selectedNode?.data?.components || []).find(c => c.id === showDynamicConfigModal)}
        onSave={(updatedConfig) => {
          if (updatedConfig === null) {
            const filtered = (selectedNode.data.components || []).filter(c => c.id !== showDynamicConfigModal);
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, components: filtered, message_configured: filtered.length > 0 } } : n));
          } else {
            const updatedComponents = (selectedNode.data.components || []).map(c => 
              c.id === showDynamicConfigModal ? { ...c, ...updatedConfig } : c
            );
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, components: updatedComponents } } : n));
          }
        }}
        workspaceId={workspaceId}
        authFetch={authFetch}
        fields={fields}
        onVariableCreated={(newVar) => setFields(f => [...f, newVar])}
      />

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white rounded-3xl shadow-2xl w-[400px] p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>Unsaved Changes</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1">You have unsaved edits.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowUnsavedWarning(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                <p className="text-sm font-medium text-slate-600 mb-8 leading-relaxed">
                    If you leave now, all your recent changes will be lost. Do you want to save before leaving?
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate(`/${workspaceId}/whatsapp/flows`)} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">
                        Leave anyway
                    </button>
                    <button onClick={async () => {
                        await saveFlow();
                        navigate(`/${workspaceId}/whatsapp/flows`);
                    }} className="flex-1 py-3.5 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all">
                        Save & Leave
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent />
    </ReactFlowProvider>
  );
}
