import React, { useState, useMemo, useCallback } from 'react';
import {
  Search, Filter, Download, Printer, FileText, FileSpreadsheet,
  ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw, X, Eye,
  Edit3, CheckCircle2, Trash2, Upload, Loader2, ExternalLink,
  AlertCircle, Clock, CheckSquare, MapPin,
  ChevronLeft, ChevronRight, Columns, MoreVertical,
  AlertTriangle, LayoutGrid, Calendar
} from 'lucide-react';
import { Lead, ActiveStepId, SyncConfig } from '../types';
import { updateStep, deleteLead, uploadFileToDrive } from '../utils/storage';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WorkflowBoardProps {
  leads: Lead[];
  onRefresh: () => Promise<void>;
  syncConfig: SyncConfig;
  activeTab?: ActiveStepId | 'all';
  setActiveTab?: (tab: ActiveStepId | 'all') => void;
}

type SortDir   = 'asc' | 'desc' | null;
type ModalMode = 'view' | 'edit';
type LeadStatus = 'completed' | 'in-progress' | 'pending' | 'delayed';
interface SortState { key: keyof Lead | null; dir: SortDir }

const STEP_NAMES: Record<number, string> = {
  1: '2D Design', 2: 'RFQ Ready', 3: 'Quotation', 4: 'Request 3D', 5: '3D Design',
};

const ALL_COLUMNS: { key: keyof Lead; label: string; step?: number; width: string }[] = [
  { key: 'leadNo',       label: 'Lead No.',    width: 'min-w-[88px]'  },
  { key: 'timestamp',    label: 'Date',         width: 'min-w-[96px]'  },
  { key: 'clientName',   label: 'Client',       width: 'min-w-[130px]' },
  { key: 'phone',        label: 'Phone',        width: 'min-w-[110px]' },
  { key: 'leadSource',   label: 'Source',       width: 'min-w-[110px]' },
  { key: 'salesPerson',  label: 'Sales Person', width: 'min-w-[110px]' },
  { key: 'kitchen',      label: 'Kitchen',      width: 'min-w-[130px]' },
  { key: 'wardrobe',     label: 'Wardrobe',     width: 'min-w-[120px]' },
  { key: 'otherWork',    label: 'Other Work',   width: 'min-w-[110px]' },
  { key: 'planned1',     label: 'Planned 1', step: 1, width: 'min-w-[90px]' },
  { key: 'actual1',      label: 'Actual 1',  step: 1, width: 'min-w-[90px]' },
  { key: 'delay1',       label: 'Delay 1',   step: 1, width: 'min-w-[70px]' },
  { key: 'designStatus', label: 'Design Status', step: 1, width: 'min-w-[120px]' },
  { key: 'remarks1',     label: 'Remarks 1', step: 1, width: 'min-w-[140px]' },
  { key: 'planned2',       label: 'Planned 2', step: 2, width: 'min-w-[90px]' },
  { key: 'actual2',        label: 'Actual 2',  step: 2, width: 'min-w-[90px]' },
  { key: 'delay2',         label: 'Delay 2',   step: 2, width: 'min-w-[70px]' },
  { key: 'clientStatus1',  label: 'Client Status 1', step: 2, width: 'min-w-[130px]' },
  { key: 'clientResponse1',label: 'Response 1',      step: 2, width: 'min-w-[130px]' },
  { key: 'remarks2',       label: 'Remarks 2', step: 2, width: 'min-w-[140px]' },
  { key: 'planned3',  label: 'Planned 3', step: 3, width: 'min-w-[90px]' },
  { key: 'actual3',   label: 'Actual 3',  step: 3, width: 'min-w-[90px]' },
  { key: 'delay3',    label: 'Delay 3',   step: 3, width: 'min-w-[70px]' },
  { key: 'quotAmount',label: 'Quot. Amt', step: 3, width: 'min-w-[100px]' },
  { key: 'planned4',       label: 'Planned 4', step: 4, width: 'min-w-[90px]' },
  { key: 'actual4',        label: 'Actual 4',  step: 4, width: 'min-w-[90px]' },
  { key: 'delay4',         label: 'Delay 4',   step: 4, width: 'min-w-[70px]' },
  { key: 'clientStatus2',  label: 'Client Status 2', step: 4, width: 'min-w-[130px]' },
  { key: 'clientResponse2',label: 'Response 2',      step: 4, width: 'min-w-[130px]' },
  { key: 'remarks3',       label: 'Remarks 3', step: 4, width: 'min-w-[140px]' },
  { key: 'planned5',     label: 'Planned 5', step: 5, width: 'min-w-[90px]' },
  { key: 'actual5',      label: 'Actual 5',  step: 5, width: 'min-w-[90px]' },
  { key: 'delay5',       label: 'Delay 5',   step: 5, width: 'min-w-[70px]' },
  { key: 'threeDStatus', label: '3D Status', step: 5, width: 'min-w-[120px]' },
  { key: 'remarks4',     label: 'Remarks 4', step: 5, width: 'min-w-[140px]' },
];

const DEFAULT_VISIBLE = new Set<keyof Lead>([
  'leadNo','timestamp','clientName','phone','salesPerson','leadSource',
  'kitchen','wardrobe','designStatus','actual1','actual2','actual3','actual4','actual5',
]);

const STEP_COLORS: Record<number, string> = {
  1: 'bg-purple-100 text-purple-700 border-purple-200',
  2: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  3: 'bg-amber-100 text-amber-700 border-amber-200',
  4: 'bg-rose-100 text-rose-700 border-rose-200',
  5: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const getCompletedSteps = (l: Lead) =>
  [1,2,3,4,5].filter(i => !!l[`actual${i}` as keyof Lead]).length;

const getLeadStatus = (l: Lead): LeadStatus => {
  const done = getCompletedSteps(l);
  if (done === 5) return 'completed';
  const age = (Date.now() - new Date(l.timestamp).getTime()) / 86_400_000;
  if (age > 7 && done < 2) return 'delayed';
  if (done > 0) return 'in-progress';
  return 'pending';
};

const fmtDate = (s: string) => (s ? s.split(' ')[0] : '');

const STATUS_CONFIG: Record<LeadStatus, { cls: string; label: string; icon: React.ReactNode }> = {
  completed:    { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Completed',   icon: <CheckCircle2 className="w-3 h-3" /> },
  'in-progress':{ cls: 'bg-amber-100 text-amber-800 border-amber-200', label: 'In Progress', icon: <Clock className="w-3 h-3" /> },
  pending:      { cls: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Pending',     icon: <AlertCircle className="w-3 h-3" /> },
  delayed:      { cls: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Delayed',     icon: <AlertTriangle className="w-3 h-3" /> },
};

const StatusBadge = ({ lead }: { lead: Lead }) => {
  const s = getLeadStatus(lead);
  const c = STATUS_CONFIG[s];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
};

const ProgressBar = ({ lead }: { lead: Lead }) => {
  const done = getCompletedSteps(lead);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <div key={i} title={`Step ${i}: ${STEP_NAMES[i]}`}
            className={`w-5 h-1.5 rounded-full transition-all ${
              !!lead[`actual${i}` as keyof Lead] ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
              !!lead[`planned${i}` as keyof Lead] ? 'bg-amber-400' : 'bg-gray-200'
            }`} />
        ))}
      </div>
      <span className="text-xs font-mono text-gray-500">{done}/5</span>
    </div>
  );
};

const CellValue = ({ col, lead }: { col: typeof ALL_COLUMNS[number]; lead: Lead }) => {
  const raw = lead[col.key];
  if (!raw) return <span className="text-gray-300 text-xs">—</span>;
  const val = String(raw);

  if (col.key.startsWith('planned') || col.key.startsWith('actual') || col.key === 'timestamp') {
    const isActual = col.key.startsWith('actual');
    return <span className={`text-xs font-mono ${isActual ? 'text-emerald-700 font-semibold' : 'text-gray-600'}`}>{fmtDate(val) || val}</span>;
  }
  if (col.key.startsWith('delay')) {
    const isZero = val === '0 days';
    return <span className={`text-xs font-semibold ${isZero ? 'text-emerald-600' : 'text-rose-600'}`}>{val}</span>;
  }
  if ((col.key === 'designCopy' || col.key === 'quotCopy' || col.key === 'threeDDesignCopy' || col.key === 'attachFile') && val.startsWith('http')) {
    return (
      <a href={val} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 text-xs font-medium underline underline-offset-2">
        <ExternalLink className="w-3 h-3" /> View
      </a>
    );
  }
  if (col.key === 'quotAmount') {
    return <span className="text-xs font-semibold text-gray-900">₹{Number(val).toLocaleString()}</span>;
  }
  return <span className="text-xs text-gray-700 truncate block max-w-[180px]" title={val}>{val}</span>;
};

// ─── Premium Action Modal ─────────────────────────────────────────────────────────────

interface ModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (data: Partial<Lead>) => Promise<void>;
  onDelete: () => Promise<void>;
  onMarkComplete: (stepId: ActiveStepId) => Promise<void>;
  syncConfig: SyncConfig;
}

function ActionModal({ lead, onClose, onSave, onDelete, onMarkComplete, syncConfig }: ModalProps) {
  const [mode,       setMode]       = useState<ModalMode>('view');
  const [editData,   setEditData]   = useState<Partial<Lead>>({});
  const [section,    setSection]    = useState<'details' | 'steps' | 'files'>('details');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [uploading,  setUploading]  = useState<keyof Lead | null>(null);
  const [err,        setErr]        = useState<string | null>(null);

  const get = (k: keyof Lead) => mode === 'edit' ? String(editData[k] ?? lead[k] ?? '') : String(lead[k] ?? '');
  const set = (k: keyof Lead, v: string) => setEditData(p => ({ ...p, [k]: v }));

  const inputCls = 'w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-gray-50/40';
  const selectCls = `${inputCls} bg-white`;

  const InputField = ({ k, label, type = 'text', opts }: { k: keyof Lead; label: string; type?: 'text'|'textarea'|'select'; opts?: string[] }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
      {mode === 'view' ? (
        <p className="text-sm text-gray-800 min-h-[20px] py-1">{get(k) || <span className="text-gray-300 text-xs italic">Not set</span>}</p>
      ) : type === 'textarea' ? (
        <textarea value={get(k)} onChange={e => set(k, e.target.value)} rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 resize-none transition-all bg-gray-50/40" />
      ) : type === 'select' && opts ? (
        <select value={get(k)} onChange={e => set(k, e.target.value)} className={selectCls}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="text" value={get(k)} onChange={e => set(k, e.target.value)} className={inputCls} />
      )}
    </div>
  );

  const uploadFile = async (k: keyof Lead, file: File) => {
    setUploading(k); setErr(null);
    try {
      const url = await uploadFileToDrive(file, syncConfig);
      setEditData(p => ({ ...p, [k]: url }));
    } catch (ex: any) { setErr(ex.message); }
    finally { setUploading(null); }
  };

  const FileRow = ({ k, label }: { k: keyof Lead; label: string }) => {
    const url = String(editData[k] ?? lead[k] ?? '');
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{url.startsWith('http') ? 'File stored in Drive' : 'No file attached'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {url.startsWith('http') && (
            <a href={url} target="_blank" rel="noreferrer"
              className="h-8 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
              <Eye className="w-3.5 h-3.5" /> View
            </a>
          )}
          {mode === 'edit' && (
            <label className={`relative cursor-pointer h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors ${uploading === k ? 'opacity-60' : ''}`}>
              {uploading === k ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /> : <Upload className="w-3.5 h-3.5" />}
              Upload
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full" disabled={uploading !== null}
                onChange={e => { if (e.target.files?.[0]) uploadFile(k, e.target.files[0]); }} />
            </label>
          )}
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    setSaving(true); setErr(null);
    try { await onSave(editData); setMode('view'); setEditData({}); }
    catch (ex: any) { setErr(ex.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true); setErr(null);
    try { await onDelete(); }
    catch (ex: any) { setErr(ex.message); setDeleting(false); }
  };

  const TABS = [
    { id: 'details' as const, label: 'Details' },
    { id: 'steps'   as const, label: 'Workflow' },
    { id: 'files'   as const, label: 'Files' },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-full font-semibold text-gray-600">{lead.leadNo}</span>
              <StatusBadge lead={lead} />
            </div>
            <h2 className="font-bold text-gray-900 text-xl leading-tight truncate">{lead.clientName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{lead.phone} · {lead.salesPerson || 'Unassigned'} · {fmtDate(lead.timestamp)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mode === 'view' ? (
              <button onClick={() => { setMode('edit'); setEditData({}); }}
                className="h-9 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <>
                <button onClick={() => { setMode('view'); setEditData({}); setErr(null); }} disabled={saving}
                  className="h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || uploading !== null}
                  className="h-9 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0 flex items-center gap-4">
          <span className="text-xs text-gray-500 shrink-0 font-medium">Overall Progress</span>
          <ProgressBar lead={lead} />
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 border-b border-gray-100 shrink-0 flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setSection(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                section === t.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {err && (
          <div className="mx-6 mt-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 flex-1">{err}</p>
            <button onClick={() => setErr(null)} className="text-rose-400 hover:text-rose-700 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {section === 'details' && (
            <>
              <div className="grid grid-cols-2 gap-5">
                <InputField k="clientName"  label="Client Name" />
                <InputField k="phone"       label="Phone" />
                <InputField k="leadSource"  label="Lead Source" type="select"
                  opts={['Instagram Ad','Facebook Campaign','Google Organic','Store Walk-in','Designer Referral','Reference Client']} />
                <InputField k="salesPerson" label="Sales Person" type="select"
                  opts={['Aman Gupta','Kriti Sen','Sonal Verma','Rajdeep Das']} />
              </div>
              <InputField k="kitchen"   label="Kitchen Work" type="select"
                opts={['L-Shaped Modular Kitchen','U-Shaped Modular Kitchen','Parallel Kitchen Setup','Straight Kitchen (Standard)','Island Luxury Layout','No Kitchen Work Involved']} />
              <InputField k="wardrobe"  label="Wardrobe Unit" type="select"
                opts={['2-Door Sliding Wardrobe','3-Door Sliding Wardrobe','Hinged Modular Wardrobe','Walk-in Wardrobe Closet','No Wardrobe Layout']} />
              <InputField k="otherWork" label="Other Scope" type="textarea" />
              {lead.gpsLocation && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 font-mono">{lead.gpsLocation}</span>
                </div>
              )}
            </>
          )}

          {section === 'steps' && (
            <div className="space-y-5">
              {[1,2,3,4,5].map(i => {
                const planned = String(lead[`planned${i}` as keyof Lead] || '');
                const actual  = String(lead[`actual${i}` as keyof Lead]  || '');
                const delay   = String(lead[`delay${i}` as keyof Lead]   || '');
                const done    = !!actual;
                const pending = !!planned && !done;
                return (
                  <div key={i} className={`rounded-2xl border p-5 transition-all ${
                    done ? 'bg-emerald-50/30 border-emerald-200' :
                    pending ? 'bg-amber-50/30 border-amber-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                          done ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : pending ? 'bg-amber-500' : 'bg-gray-400'
                        }`}>{i}</div>
                        <span className={`text-base font-semibold ${done ? 'text-emerald-800' : pending ? 'text-amber-800' : 'text-gray-500'}`}>{STEP_NAMES[i]}</span>
                        {done    && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {pending && <Clock        className="w-4 h-4 text-amber-500" />}
                      </div>
                      {pending && (
                        <button onClick={() => onMarkComplete(i as ActiveStepId)}
                          className="h-8 px-4 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                          <CheckSquare className="w-3.5 h-3.5" /> Mark Complete
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs mb-4">
                      <div>
                        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide mb-1">Planned</p>
                        <p className="font-mono text-gray-700">{fmtDate(planned)||'—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide mb-1">Actual</p>
                        <p className={`font-mono ${done ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>{fmtDate(actual)||'—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide mb-1">Delay</p>
                        <p className={`font-semibold ${delay && delay !== '0 days' ? 'text-rose-600' : 'text-emerald-600'}`}>{delay||'—'}</p>
                      </div>
                    </div>
                    {(done || pending) && (
                      <div className="pt-4 border-t border-gray-200 space-y-4">
                        {i === 1 && (<>
                          <InputField k="designStatus" label="Design Status" type="select"
                            opts={['Draft Ready','Sent for Initial Review','Revision Needed','Approved by Client','Layout Frozen']} />
                          <InputField k="remarks1" label="Remarks" type="textarea" />
                        </>)}
                        {i === 2 && (<>
                          <InputField k="clientStatus1"   label="Client Status" type="select" opts={['Done / prepare Quotation','Awaiting response','Hold on budget reasons']} />
                          <InputField k="clientResponse1" label="Client Response" />
                          <InputField k="remarks2"        label="Remarks" type="textarea" />
                        </>)}
                        {i === 3 && <InputField k="quotAmount" label="Quotation Amount (₹)" />}
                        {i === 4 && (<>
                          <InputField k="clientStatus2"   label="Client Status" type="select" opts={['Approved for 3D Render','Token Paid - Design Inbound','Hold - revision in 2D first']} />
                          <InputField k="clientResponse2" label="Client Response" />
                          <InputField k="remarks3"        label="Remarks" type="textarea" />
                        </>)}
                        {i === 5 && (<>
                          <InputField k="threeDStatus" label="3D Status" type="select"
                            opts={['Approved & Sign-off Completed','3D render sent for feedback','Rendering in Queue','Alternative options requested']} />
                          <InputField k="remarks4" label="Comments" type="textarea" />
                        </>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {section === 'files' && (
            <div className="space-y-3">
              <FileRow k="attachFile"       label="Lead Attachment"  />
              <FileRow k="designCopy"       label="2D Design Copy"   />
              <FileRow k="quotCopy"         label="Quotation Copy"   />
              <FileRow k="threeDDesignCopy" label="3D Render Copy"   />
            </div>
          )}

          {/* Delete Zone */}
          <div className="pt-3 border-t border-gray-100">
            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)}
                className="h-9 px-4 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-200 transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Delete Record
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs text-rose-700 font-medium flex-1">Permanently delete this lead? This action cannot be undone.</span>
                <button onClick={handleDelete} disabled={deleting}
                  className="h-8 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer">
                  {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                  {deleting ? 'Deleting…' : 'Confirm'}
                </button>
                <button onClick={() => setConfirmDel(false)} className="h-8 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function WorkflowBoard({ leads, onRefresh, syncConfig, activeTab: extTab, setActiveTab: extSetTab }: WorkflowBoardProps) {
  const [internalTab,  setInternalTab]  = useState<ActiveStepId | 'all'>('all');
  const activeTab    = extTab    !== undefined ? extTab    : internalTab;
  const setActiveTab = extSetTab !== undefined ? extSetTab : setInternalTab;

  const [search,       setSearch]       = useState('');
  const [empFilter,    setEmpFilter]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter,   setDeptFilter]   = useState('');
  const [sort,         setSort]         = useState<SortState>({ key: null, dir: null });
  const [page,         setPage]         = useState(1);
  const [pageSize,     setPageSize]     = useState(20);
  const [visibleCols,  setVisibleCols]  = useState<Set<keyof Lead>>(new Set(DEFAULT_VISIBLE));
  const [showColMenu,  setShowColMenu]  = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);
  const [modal,        setModal]        = useState<Lead | null>(null);
  const [refreshing,   setRefreshing]   = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [toast,        setToast]        = useState<{ type: 'success'|'error'; text: string } | null>(null);

  const notify = (type: 'success'|'error', text: string) => {
    setToast({ type, text }); setTimeout(() => setToast(null), 4000);
  };

  const allEmployees = useMemo(() => [...new Set(leads.map(l => l.salesPerson).filter(Boolean))], [leads]);
  const allDepts     = useMemo(() => [...new Set(leads.map(l => l.kitchen ? 'Kitchen' : l.wardrobe ? 'Wardrobe' : 'Custom'))], [leads]);

  const filtered = useMemo(() => {
    let list = [...leads];
    if (activeTab !== 'all') {
      list = list.filter(l => l[`planned${activeTab}` as keyof Lead] && !l[`actual${activeTab}` as keyof Lead]);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.clientName.toLowerCase().includes(q) || l.leadNo.toLowerCase().includes(q) ||
        l.phone?.includes(q) || l.salesPerson?.toLowerCase().includes(q) ||
        l.kitchen?.toLowerCase().includes(q) || l.wardrobe?.toLowerCase().includes(q) ||
        l.leadSource?.toLowerCase().includes(q) || l.otherWork?.toLowerCase().includes(q)
      );
    }
    if (empFilter)    list = list.filter(l => l.salesPerson === empFilter);
    if (statusFilter) list = list.filter(l => getLeadStatus(l) === statusFilter);
    if (deptFilter)   list = list.filter(l =>
      deptFilter === 'Kitchen' ? !!l.kitchen : deptFilter === 'Wardrobe' ? !!l.wardrobe : !l.kitchen && !l.wardrobe
    );
    if (sort.key && sort.dir) {
      list.sort((a, b) => {
        const av = String(a[sort.key!] || '');
        const bv = String(b[sort.key!] || '');
        return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [leads, activeTab, search, empFilter, statusFilter, deptFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => { setPage(1); }, [search, empFilter, statusFilter, deptFilter, activeTab]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total    : filtered.length,
      completed: filtered.filter(l => getLeadStatus(l) === 'completed').length,
      pending  : filtered.filter(l => getLeadStatus(l) === 'pending').length,
      delayed  : filtered.filter(l => getLeadStatus(l) === 'delayed').length,
      today    : filtered.filter(l => l.timestamp.startsWith(today)).length,
    };
  }, [filtered]);

  const activeCols = useMemo(() => ALL_COLUMNS.filter(c => visibleCols.has(c.key)), [visibleCols]);

  const toggleSort = useCallback((key: keyof Lead) => {
    setSort(prev =>
      prev.key !== key ? { key, dir: 'asc' }
      : prev.dir === 'asc' ? { key, dir: 'desc' }
      : { key: null, dir: null }
    );
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await onRefresh(); notify('success', 'Dashboard refreshed'); }
    catch { notify('error', 'Refresh failed'); }
    finally { setRefreshing(false); }
  };

  const handleSaveLead = async (data: Partial<Lead>) => {
    if (!modal) return;
    let stepId: ActiveStepId = 1;
    for (let i = 1; i <= 5; i++) {
      if (modal[`planned${i}` as keyof Lead] && !modal[`actual${i}` as keyof Lead]) { stepId = i as ActiveStepId; break; }
    }
    await updateStep(modal.leadNo, stepId, data, syncConfig);
    await onRefresh();
    notify('success', `Lead ${modal.leadNo} updated`);
  };

  const handleDeleteLead = async () => {
    if (!modal) return;
    await deleteLead(modal.leadNo, syncConfig);
    await onRefresh();
    setModal(null);
    notify('success', `Lead ${modal.leadNo} deleted`);
  };

  const handleMarkComplete = async (stepId: ActiveStepId) => {
    if (!modal) return;
    await updateStep(modal.leadNo, stepId, {}, syncConfig);
    await onRefresh();
    notify('success', `Step ${stepId} marked complete`);
  };

  const exportRows = useMemo(() => filtered.map(l => ({
    'Lead No': l.leadNo, 'Date': fmtDate(l.timestamp), 'Client': l.clientName,
    'Phone': l.phone, 'Source': l.leadSource||'—', 'Sales Person': l.salesPerson||'—',
    'Status': getLeadStatus(l), 'Progress': `${getCompletedSteps(l)}/5`,
    'Planned 1': fmtDate(l.planned1), 'Actual 1': fmtDate(l.actual1),
    'Planned 2': fmtDate(l.planned2), 'Actual 2': fmtDate(l.actual2),
    'Planned 3': fmtDate(l.planned3), 'Actual 3': fmtDate(l.actual3), 'Quot. Amount': l.quotAmount||'—',
    'Planned 4': fmtDate(l.planned4), 'Actual 4': fmtDate(l.actual4),
    'Planned 5': fmtDate(l.planned5), 'Actual 5': fmtDate(l.actual5),
  })), [filtered]);

  const handleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Workflow');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `workflow-${Date.now()}.xlsx`);
  };

  const handleCSV = () => {
    if (!exportRows.length) return;
    const heads = Object.keys(exportRows[0]);
    const csv = [heads.join(','), ...exportRows.map(r => heads.map(h => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(','))].join('\n');
    saveAs(new Blob([csv], { type: 'text/csv' }), `workflow-${Date.now()}.csv`);
  };

  const handlePDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(14); doc.text('LeadFlow — Workflow Report', 14, 16);
      doc.setFontSize(9); doc.setTextColor(100);
      doc.text(`Records: ${filtered.length}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 24);
      autoTable(doc, {
        startY: 30,
        head: [['Lead No', 'Date', 'Client', 'Source', 'Sales Person', 'Status', 'Progress']],
        body: filtered.map(l => [l.leadNo, fmtDate(l.timestamp), l.clientName, l.leadSource||'—', l.salesPerson||'—', getLeadStatus(l), `${getCompletedSteps(l)}/5`]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
        theme: 'striped',
        margin: { left: 14, right: 14 },
      });
      doc.save(`workflow-${Date.now()}.pdf`);
    } finally { setExporting(false); }
  };

  const tabCount = (id: ActiveStepId | 'all') =>
    id === 'all' ? leads.length
    : leads.filter(l => l[`planned${id}` as keyof Lead] && !l[`actual${id}` as keyof Lead]).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-10">

      {/* Premium Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl bg-white/95 backdrop-blur-sm animate-slideInRight ${
          toast.type === 'success' ? 'border-emerald-200' : 'border-rose-200'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          }
          <p className="text-sm font-medium text-gray-800 flex-1">{toast.text}</p>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Pipeline Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage all leads across workflow steps</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="h-10 px-5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { icon: <LayoutGrid className="w-4 h-4" />, label: 'Total',     value: stats.total,     cls: 'text-gray-700' },
          { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Completed', value: stats.completed, cls: 'text-emerald-700' },
          { icon: <Clock className="w-4 h-4" />, label: 'Pending',   value: stats.pending,   cls: 'text-amber-700' },
          { icon: <AlertTriangle className="w-4 h-4" />, label: 'Delayed',   value: stats.delayed,   cls: 'text-rose-700'   },
          { icon: <Calendar className="w-4 h-4" />, label: 'Today',     value: stats.today,     cls: 'text-blue-700'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
              {s.icon} <span>{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Step Tabs (Premium) */}
      <div className="flex gap-2 flex-wrap">
        {([['all', 'All Leads', <LayoutGrid key="all" className="w-3.5 h-3.5" />]] as [string, string, React.ReactNode][]).concat(
          Object.entries(STEP_NAMES).map(([k, v], idx) => [k, v, <span key={k} className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-purple-500' : idx === 1 ? 'bg-cyan-500' : idx === 2 ? 'bg-amber-500' : idx === 3 ? 'bg-rose-500' : 'bg-indigo-500'}`} />])
        ).map(([id, name, icon]) => {
          const numId   = id === 'all' ? 'all' : (Number(id) as ActiveStepId);
          const isActive = activeTab === numId;
          const count   = tabCount(numId as ActiveStepId | 'all');
          return (
            <button key={id} onClick={() => setActiveTab(numId as ActiveStepId | 'all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-md shadow-emerald-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
              {icon}
              {id !== 'all' ? `S${id}: ` : ''}{name}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client, lead no, phone…"
              className="w-full h-10 pl-9 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-gray-50/40" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button onClick={() => setShowFilters(v => !v)}
            className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showFilters || (empFilter || statusFilter || deptFilter) ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            <Filter className="w-3.5 h-3.5" /> Filters
            {(empFilter || statusFilter || deptFilter) && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
          </button>

          {/* Column Picker */}
          <div className="relative">
            <button onClick={() => setShowColMenu(v => !v)}
              className="h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">
              <Columns className="w-3.5 h-3.5" /> Columns ({activeCols.length})
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-full mt-2 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 w-80 max-h-96 overflow-y-auto animate-fadeIn">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Toggle Columns</span>
                  <button onClick={() => setShowColMenu(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_COLUMNS.map(c => (
                    <label key={c.key} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={visibleCols.has(c.key)} className="w-3.5 h-3.5 accent-emerald-600 rounded"
                        onChange={() => setVisibleCols(prev => { const n = new Set(prev); n.has(c.key) ? n.delete(c.key) : n.add(c.key); return n; })} />
                      <span className="text-xs text-gray-700 truncate">{c.label}</span>
                      {c.step && <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${STEP_COLORS[c.step]}`}>S{c.step}</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <button onClick={handleExcel} title="Export Excel"
              className="h-10 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
              <FileSpreadsheet className="w-3.5 h-3.5" /><span className="hidden sm:inline">Excel</span>
            </button>
            <button onClick={handleCSV} title="Export CSV"
              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
              <FileText className="w-3.5 h-3.5" /><span className="hidden sm:inline">CSV</span>
            </button>
            <button onClick={handlePDF} disabled={exporting} title="Export PDF"
              className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm cursor-pointer">
              <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={() => window.print()} title="Print"
              className="h-10 px-4 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100">
              <option value="">All Sales Persons</option>
              {allEmployees.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100">
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="delayed">Delayed</option>
            </select>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100">
              <option value="">All Work Types</option>
              {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {(empFilter || statusFilter || deptFilter) && (
              <button onClick={() => { setEmpFilter(''); setStatusFilter(''); setDeptFilter(''); }}
                className="h-9 px-4 text-xs font-semibold text-rose-700 bg-rose-50 rounded-xl hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" style={{ minWidth: `${Math.max(1000, activeCols.length * 130 + 280)}px` }}>
            {/* Step group header (optional) */}
            {activeCols.some(c => c.step) && (
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th colSpan={2} className="bg-gray-50/80" />
                  {activeCols.map(c => {
                    if (!c.step) return <th key={c.key} className="bg-gray-50/80" />;
                    return (
                      <th key={c.key} className={`px-4 py-2 border-x border-gray-100`}>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STEP_COLORS[c.step]}`}>S{c.step}</span>
                      </th>
                    );
                  })}
                  <th className="bg-gray-50/80 w-[90px]" />
                </tr>
              </thead>
            )}

            {/* Main header */}
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[100px]">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[110px]">Progress</th>
                {activeCols.map(c => (
                  <th key={c.key} onClick={() => toggleSort(c.key)}
                    className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors select-none ${c.width}`}>
                    <div className="flex items-center gap-1">
                      {c.label}
                      {sort.key === c.key
                        ? sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
                        : <ChevronsUpDown className="w-3 h-3 text-gray-300" />}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center w-[90px] sticky right-0 bg-gray-50/90 z-10">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={activeCols.length + 3} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Search className="w-10 h-10 stroke-1" />
                      <p className="text-sm font-medium">No leads found</p>
                      <p className="text-xs">Try adjusting your filters or search term</p>
                    </div>
                  </td>
                </tr>
              ) : paged.map(lead => (
                <tr key={lead.leadNo} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-4 py-3"><StatusBadge lead={lead} /></td>
                  <td className="px-4 py-3"><ProgressBar lead={lead} /></td>
                  {activeCols.map(c => (
                    <td key={c.key} className="px-4 py-3 max-w-[200px]">
                      <CellValue col={c} lead={lead} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center sticky right-0 bg-white/90 backdrop-blur-sm z-5">
                    <button onClick={() => setModal(lead)}
                      className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 mx-auto transition-all shadow-sm cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <span>
              Showing <strong className="text-gray-800">{paged.length === 0 ? 0 : (page-1)*pageSize+1}–{Math.min(page*pageSize, filtered.length)}</strong> of <strong className="text-gray-800">{filtered.length}</strong> leads
            </span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-200">
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs font-bold cursor-pointer shadow-sm">«</button>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer shadow-sm">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm ${
                    p === page ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer shadow-sm">
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs font-bold cursor-pointer shadow-sm">»</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <ActionModal
          lead={modal}
          onClose={() => setModal(null)}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
          onMarkComplete={handleMarkComplete}
          syncConfig={syncConfig}
        />
      )}
    </div>
  );
}

// Add these animations to your global CSS or Tailwind config (already included in LeadForm)
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-slideInRight { animation: slideInRight 0.25s ease-out; }
.animate-scaleIn { animation: scaleIn 0.2s ease-out; }
*/