
import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
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
  Table2 as Sheet,
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
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${appConfig.API_URL}/api/sheets/list`, {
          headers: { 'Authorization': `Bearer ${session?.access_token}`, 'x-workspace-id': workspaceId }
        });
        const data = await res.json();
        setSpreadsheets(data.files || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [workspaceId]);

  useEffect(() => {
    if (!cfg.spreadsheetId || !workspaceId) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${appConfig.API_URL}/api/sheets/${cfg.spreadsheetId}/details`, {
          headers: { 'Authorization': `Bearer ${session?.access_token}`, 'x-workspace-id': workspaceId }
        });
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
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${appConfig.API_URL}/api/sheets/headers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'x-workspace-id': workspaceId },
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
  const [sequenceId, setSequenceId] = useState(action.sequenceId || '');
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`${appConfig.API_URL}/api/sequences?workspace_id=${workspaceId}`)
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

  const { zoomIn, zoomOut, fitView } = useReactFlow();
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
        }
      });
  }, [id, workspaceId, setNodes, setEdges]);

  const onConnect = useCallback((params) => {
    connectingNodeId.current = null;
    connectingHandleId.current = null;
    setEdges(eds => addEdge({ ...params, type: 'smoothstep', animated: true, style: { strokeWidth: 3, stroke: '#16a34a' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#16a34a' } }, eds));
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
        type: 'smoothstep', animated: true, style: { strokeWidth: 3, stroke: '#16a34a' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#16a34a' }
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
    try {
      const { error } = await supabase.from('flows').update({ flow_data: { nodes, edges }, nodes: nodes.length, updated_at: new Date() }).eq('id', id).eq('workspace_id', workspaceId);
      if (error) throw error;
      setIsDirty(false);
    } catch (err) { alert(`Failed to save: ${err.message}`); } finally { setSaving(false); }
  };

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
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* ── Top Header ── */}
      <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200 shadow-sm flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/${workspaceId}/flows`)} className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors group">
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
          fitView
          defaultEdgeOptions={{
            type: 'smoothstep', animated: true,
            style: { strokeWidth: 3, stroke: '#16a34a' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#16a34a' },
          }}
        >
          <Background color="#e2e8f0" gap={24} size={1} />

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
            className="absolute bottom-8 left-8 flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl shadow-xl shadow-green-200 font-bold hover:scale-105 active:scale-95 transition-all z-50 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Step
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
      </main>

      {/* ── Right Inspector Panel ── */}
      {selectedNode && (
        <aside className="fixed right-6 top-20 bottom-6 w-80 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 flex flex-col overflow-hidden">
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

                {!selectedNode.data.message_configured ? (
                  <div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
                      <p className="text-xs font-medium text-green-700 text-center leading-relaxed">Choose a message type to configure this node.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'text', label: '+ Text', icon: FileText },
                        { id: 'card', label: '+ Card', icon: Square },
                        { id: 'media', label: 'Rich Media', icon: ImageIcon },
                        { id: 'foreach', label: '+ For Each', icon: Repeat, pro: true },
                        { id: 'dynamic', label: '+ Dynamic', icon: ExternalLink, pro: true },
                        { id: 'ecommerce', label: 'Ecommerce', icon: ShoppingCart, pro: true },
                        { id: 'debug', label: '+ Debug', icon: Bug, pro: true },
                        { id: 'others', label: 'Others', icon: MoreHorizontal, pro: true },
                      ].map(item => (
                        <button key={item.id}
                          onClick={() => { if (item.id === 'text') setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, message_configured: true } } : n)); }}
                          className="group relative flex flex-col items-center justify-center p-3 h-20 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-green-400 hover:shadow-md hover:bg-green-50/30 transition-all active:scale-95">
                          {item.pro && <div className="absolute top-1.5 right-1.5 px-1 py-0.5 bg-green-500 rounded-md"><span className="text-[7px] font-black text-white uppercase tracking-tighter">PRO</span></div>}
                          <div className="text-slate-400 group-hover:text-green-600 group-hover:scale-110 transition-all mb-1.5"><item.icon size={19} strokeWidth={1.8} /></div>
                          <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-800">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Message Text</label>
                      <textarea className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium leading-relaxed resize-none" rows={5} placeholder="Type your message..." value={selectedNode.data.text || ''} onChange={e => setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, text: e.target.value } } : n))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Buttons</label>
                      <div className="space-y-2">
                        {(selectedNode.data.buttons || []).map((btn, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-green-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10 transition-all text-center" value={btn.label} maxLength={20}
                              onChange={e => { const nb = [...(selectedNode.data.buttons || [])]; nb[idx] = { ...nb[idx], label: e.target.value }; setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, buttons: nb } } : n)); }} />
                            <button onClick={() => { const nb = (selectedNode.data.buttons || []).filter((_, i) => i !== idx); setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, buttons: nb } } : n)); }} className="w-10 h-10 border border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200 rounded-xl transition-all flex items-center justify-center">
                              <Minus size={14} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => { const nb = [...(selectedNode.data.buttons || []), { id: `btn-${Date.now()}`, label: 'New Button' }]; setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, buttons: nb } } : n)); }} className="w-full py-3 bg-green-50 border border-dashed border-green-200 text-green-600 rounded-xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-green-100 hover:border-green-400 transition-all flex items-center justify-center gap-2">
                          <Plus size={13} /> Add Button
                        </button>
                      </div>
                    </div>
                    <button onClick={() => setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, message_configured: false } } : n))} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wide flex items-center gap-1 transition-colors">
                      <ArrowLeft size={10} /> Back to selections
                    </button>
                  </div>
                )}

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
