import React, { useState, useMemo, useCallback, createContext, useContext } from 'react';
import ReactDOM from 'react-dom';
import {
  Search, Filter, Download, Printer, FileText, FileSpreadsheet,
  ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw, X, Eye,
  Edit3, CheckCircle2, Trash2, Upload, Loader2, ExternalLink,
  AlertCircle, Clock, CheckSquare, MapPin,
  ChevronLeft, ChevronRight, Columns, MoreVertical,
  AlertTriangle, LayoutGrid, Calendar, History, Undo
} from 'lucide-react';
import { Lead, ActiveStepId, SyncConfig } from '../types';
import { updateStep, deleteLead, uploadFileToDrive, revertStep } from '../utils/storage';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WorkflowBoardProps {
  leads: Lead[];
  onRefresh: () => Promise<void>;
  syncConfig: SyncConfig;
  activeTab?: ActiveStepId | 'all' | 'history';
  setActiveTab?: (tab: ActiveStepId | 'all' | 'history') => void;
  onOptimisticUpdate?: (leadNo: string, updatedFields: Partial<Lead>) => void;
}

type SortDir   = 'asc' | 'desc' | null;
type ModalMode = 'view' | 'edit';
type LeadStatus = 'completed' | 'in-progress' | 'pending' | 'delayed';
interface SortState { key: keyof Lead | null; dir: SortDir }

const STEP_NAMES: Record<number, string> = {
  1: '2D Design', 2: 'RFQ Ready', 3: 'Quotation', 4: 'Request 3D', 5: '3D Design',
};

const ALL_COLUMNS: { key: keyof Lead; label: string; step?: number; width: string }[] = [
  { key: 'leadNo',       label: 'Lead No.',      width: 'min-w-[88px]'  },
  { key: 'timestamp',    label: 'Date',           width: 'min-w-[96px]'  },
  { key: 'clientName',   label: 'Client Name',    width: 'min-w-[140px]' },
  { key: 'phone',        label: 'Phone',          width: 'min-w-[120px]' },
  { key: 'gpsLocation',  label: 'GPS Location',   width: 'min-w-[130px]' },
  { key: 'leadSource',   label: 'Lead Source',    width: 'min-w-[130px]' },
  { key: 'salesPerson',  label: 'Sales Person',   width: 'min-w-[120px]' },
  { key: 'kitchen',      label: 'Kitchen Type',   width: 'min-w-[140px]' },
  { key: 'wardrobe',     label: 'Wardrobe Type',  width: 'min-w-[130px]' },
  { key: 'otherWork',    label: 'Other Scope',    width: 'min-w-[130px]' },
  { key: 'attachFile',   label: 'Attachment',     width: 'min-w-[110px]' },
  { key: 'planned1',     label: 'Planned 1', step: 1, width: 'min-w-[90px]' },
  { key: 'actual1',      label: 'Actual 1',  step: 1, width: 'min-w-[90px]' },
  { key: 'delay1',       label: 'Delay 1',   step: 1, width: 'min-w-[70px]' },
  { key: 'designStatus', label: 'Design Status', step: 1, width: 'min-w-[120px]' },
  { key: 'remarks1',     label: 'Remarks 1', step: 1, width: 'min-w-[140px]' },
  { key: 'planned2',        label: 'Planned 2', step: 2, width: 'min-w-[90px]' },
  { key: 'actual2',         label: 'Actual 2',  step: 2, width: 'min-w-[90px]' },
  { key: 'delay2',          label: 'Delay 2',   step: 2, width: 'min-w-[70px]' },
  { key: 'clientStatus1',   label: 'Client Status 1', step: 2, width: 'min-w-[130px]' },
  { key: 'clientResponse1', label: 'Response 1',      step: 2, width: 'min-w-[130px]' },
  { key: 'remarks2',        label: 'Remarks 2', step: 2, width: 'min-w-[140px]' },
  { key: 'planned3',  label: 'Planned 3', step: 3, width: 'min-w-[90px]' },
  { key: 'actual3',   label: 'Actual 3',  step: 3, width: 'min-w-[90px]' },
  { key: 'delay3',    label: 'Delay 3',   step: 3, width: 'min-w-[70px]' },
  { key: 'quotAmount',label: 'Quot. Amt', step: 3, width: 'min-w-[100px]' },
  { key: 'planned4',        label: 'Planned 4', step: 4, width: 'min-w-[90px]' },
  { key: 'actual4',         label: 'Actual 4',  step: 4, width: 'min-w-[90px]' },
  { key: 'delay4',          label: 'Delay 4',   step: 4, width: 'min-w-[70px]' },
  { key: 'clientStatus2',   label: 'Client Status 2', step: 4, width: 'min-w-[130px]' },
  { key: 'clientResponse2', label: 'Response 2',      step: 4, width: 'min-w-[130px]' },
  { key: 'remarks3',        label: 'Remarks 3', step: 4, width: 'min-w-[140px]' },
  { key: 'planned5',     label: 'Planned 5', step: 5, width: 'min-w-[90px]' },
  { key: 'actual5',      label: 'Actual 5',  step: 5, width: 'min-w-[90px]' },
  { key: 'delay5',       label: 'Delay 5',   step: 5, width: 'min-w-[70px]' },
  { key: 'threeDStatus', label: '3D Status', step: 5, width: 'min-w-[120px]' },
  { key: 'remarks4',     label: 'Remarks 4', step: 5, width: 'min-w-[140px]' },
];

const DEFAULT_VISIBLE = new Set<keyof Lead>([
  'leadNo', 'clientName', 'phone', 'gpsLocation',
  'kitchen', 'wardrobe', 'otherWork',
  'leadSource', 'salesPerson', 'attachFile',
]);

const STEP_COLORS: Record<number, string> = {
  1: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
  2: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700',
  3: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  4: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700',
  5: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700',
};

const STEP_ACCENT: Record<number, string> = { 1: '#a855f7', 2: '#06b6d4', 3: '#f59e0b', 4: '#f43f5e', 5: '#6366f1' };

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
  completed:    { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700', label: 'Completed',   icon: <CheckCircle2 className="w-3 h-3" /> },
  'in-progress':{ cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',            label: 'In Progress', icon: <Clock className="w-3 h-3" /> },
  pending:      { cls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/30 dark:text-slate-400 dark:border-slate-600',            label: 'Pending',     icon: <AlertCircle className="w-3 h-3" /> },
  delayed:      { cls: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700',                   label: 'Delayed',     icon: <AlertTriangle className="w-3 h-3" /> },
};

const StatusBadge = ({ lead }: { lead: Lead }) => {
  const s = getLeadStatus(lead);
  const c = STATUS_CONFIG[s];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${c.cls}`}>
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
              !!lead[`planned${i}` as keyof Lead] ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
        ))}
      </div>
      <span className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>{done}/5</span>
    </div>
  );
};

const CellValue = ({ col, lead }: { col: typeof ALL_COLUMNS[number]; lead: Lead }) => {
  const raw = lead[col.key];
  if (!raw) return <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>—</span>;
  const val = String(raw);

  if (col.key.startsWith('planned') || col.key.startsWith('actual') || col.key === 'timestamp') {
    const isActual = col.key.startsWith('actual');
    return <span className={`text-xs font-mono ${isActual ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}
      style={!isActual ? { color: 'var(--text-muted)' } : {}}>{fmtDate(val) || val}</span>;
  }
  if (col.key.startsWith('delay')) {
    const isZero = val === '0 days';
    return <span className={`text-xs font-semibold ${isZero ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{val}</span>;
  }
  if ((col.key === 'designCopy' || col.key === 'quotCopy' || col.key === 'threeDDesignCopy' || col.key === 'attachFile') && val.startsWith('http')) {
    return (
      <a href={val} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium underline underline-offset-2">
        <ExternalLink className="w-3 h-3" /> View
      </a>
    );
  }
  if (col.key === 'quotAmount') {
    return <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>₹{Number(val).toLocaleString()}</span>;
  }
  return <span className="text-xs truncate block max-w-[180px]" style={{ color: 'var(--text)' }} title={val}>{val}</span>;
};

const ActionModalContext = createContext<{
  mode: ModalMode;
  get: (k: keyof Lead) => string;
  set: (k: keyof Lead, v: string) => void;
  uploading: keyof Lead | null;
  uploadFile: (k: keyof Lead, file: File) => Promise<void>;
} | null>(null);

const InputField = ({ k, label, type = 'text', opts }: { k: keyof Lead; label: string; type?: 'text'|'textarea'|'select'; opts?: string[] }) => {
  const ctx = useContext(ActionModalContext);
  if (!ctx) return null;
  const { mode, get, set } = ctx;
  const val = get(k);
  const inputCls = 'w-full h-10 px-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 transition-all';

  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-subtle)' }}>{label}</label>
      {mode === 'view' ? (
        <p className="text-sm min-h-[20px] py-1" style={{ color: 'var(--text)' }}>{val || <span className="italic text-xs" style={{ color: 'var(--text-subtle)' }}>Not set</span>}</p>
      ) : type === 'textarea' ? (
        <textarea value={val} onChange={e => set(k, e.target.value)} rows={3}
          className="w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 resize-none transition-all"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' }} />
      ) : type === 'select' && opts ? (
        <select value={val} onChange={e => set(k, e.target.value)}
          className={`${inputCls} appearance-none cursor-pointer`}
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="text" value={val} onChange={e => set(k, e.target.value)}
          className={inputCls}
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' }} />
      )}
    </div>
  );
};

const FileRow = ({ k, label }: { k: keyof Lead; label: string }) => {
  const ctx = useContext(ActionModalContext);
  if (!ctx) return null;
  const { mode, get, uploading, uploadFile } = ctx;
  const url = get(k);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
            {url.startsWith('http') ? 'Stored in Drive' : 'No file attached'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {url.startsWith('http') && (
          <a href={url} target="_blank" rel="noreferrer"
            className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            <Eye className="w-3.5 h-3.5" /> View
          </a>
        )}
        {mode === 'edit' && (
          <label className={`relative cursor-pointer h-8 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${uploading === k ? 'opacity-60' : ''}`}
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            {uploading === k ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full" disabled={uploading !== null}
              onChange={e => { if (e.target.files?.[0]) uploadFile(k, e.target.files[0]); }} />
          </label>
        )}
      </div>
    </div>
  );
};

// ─── Action Modal ──────────────────────────────────────────────────────────────

interface ModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (data: Partial<Lead>) => Promise<void>;
  onDelete: () => Promise<void>;
  onMarkComplete: (stepId: ActiveStepId) => Promise<void>;
  onRevert: (leadNo: string, currentStepNumber: number) => Promise<void>;
  syncConfig: SyncConfig;
  activeTab: ActiveStepId | 'all' | 'history';
}

function ActionModal({ lead, onClose, onSave, onDelete, onMarkComplete, onRevert, syncConfig, activeTab }: ModalProps) {
  const [mode,       setMode]       = useState<ModalMode>('edit');
  const [editData,   setEditData]   = useState<Partial<Lead>>({});
  const [section,    setSection]    = useState<'details' | 'steps' | 'files'>('details');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [uploading,  setUploading]  = useState<keyof Lead | null>(null);
  const [err,        setErr]        = useState<string | null>(null);
  const [reverting,  setReverting]  = useState(false);

  const get = (k: keyof Lead) => mode === 'edit' ? String(editData[k] ?? lead[k] ?? '') : String(lead[k] ?? '');
  const set = (k: keyof Lead, v: string) => setEditData(p => ({ ...p, [k]: v }));

  const uploadFile = async (k: keyof Lead, file: File) => {
    setUploading(k); setErr(null);
    try {
      const url = await uploadFileToDrive(file, syncConfig);
      setEditData(p => ({ ...p, [k]: url }));
    } catch (ex: any) { setErr(ex.message); }
    finally { setUploading(null); }
  };

  const handleSave = async () => {
    setSaving(true); setErr(null);
    try { await onSave(editData); onClose(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setSaving(false); }
  };

  const revertTargetStep = useMemo<number | null>(() => {
    if (activeTab !== 'all' && activeTab !== 'history') {
      if (activeTab > 1) {
        return activeTab - 1;
      }
      return null;
    }
    if (activeTab === 'history') {
      return 5;
    }
    let foundIncomplete = false;
    let currentStep = 1;
    for (let i = 1; i <= 5; i++) {
      if (lead[`planned${i}` as keyof Lead] && !lead[`actual${i}` as keyof Lead]) {
        currentStep = i;
        foundIncomplete = true;
        break;
      }
    }
    if (!foundIncomplete && lead.actual5) {
      return 5;
    }
    if (currentStep > 1) {
      return currentStep - 1;
    }
    return null;
  }, [lead, activeTab]);

  const handleRevert = async () => {
    if (revertTargetStep === null) return;
    setReverting(true); setErr(null);
    try {
      await onRevert(lead.leadNo, revertTargetStep + 1);
      onClose();
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setReverting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true); setErr(null);
    try { await onDelete(); }
    catch (ex: any) { setErr(ex.message); setDeleting(false); }
  };

  const modalNode = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div className="rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden modal-content border"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          maxHeight: '90vh',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded-lg font-semibold"
                style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>{lead.leadNo}</span>
              {activeTab === 'all' || activeTab === 'history' ? (
                <StatusBadge lead={lead} />
              ) : (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  !!lead[`actual${activeTab}` as keyof Lead]
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
                    : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                }`}>
                  {!!lead[`actual${activeTab}` as keyof Lead] ? 'Step Completed' : 'Step Pending'}
                </span>
              )}
            </div>
            <h2 className="font-bold text-xl leading-tight truncate" style={{ color: 'var(--text)' }}>{lead.clientName}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
              {lead.phone} · {lead.salesPerson || 'Unassigned'} · {fmtDate(lead.timestamp)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              style={{ color: 'var(--text-subtle)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {(activeTab === 'all' || activeTab === 'history') && (
          <div className="px-6 py-3 border-b shrink-0 flex items-center gap-4"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>Overall Progress</span>
            <ProgressBar lead={lead} />
          </div>
        )}

        {/* Tabs */}
        {(activeTab === 'all' || activeTab === 'history') && (
          <div className="px-6 py-2.5 border-b shrink-0 flex gap-1"
            style={{ borderColor: 'var(--border)' }}>
            {(['details', 'steps', 'files'] as const).map(t => (
              <button key={t} onClick={() => setSection(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                  section === t
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={section !== t ? { color: 'var(--text-muted)' } : {}}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {err && (
          <div className="mx-6 mt-3 px-3 py-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 dark:text-rose-400 flex-1">{err}</p>
            <button onClick={() => setErr(null)} className="text-rose-400 hover:text-rose-700 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab !== 'all' && activeTab !== 'history' ? (
            <div className="space-y-5">
              {/* Step info banner */}
              <div className="rounded-xl border p-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ background: !!lead[`actual${activeTab}` as keyof Lead] ? '#10b981' : !!lead[`planned${activeTab}` as keyof Lead] ? '#f59e0b' : STEP_ACCENT[activeTab] }}>
                      {activeTab}
                    </div>
                    <span className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                      {STEP_NAMES[activeTab]}
                    </span>
                  </div>
                  {/* Mark complete button */}
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  {[
                    { label: 'Planned Date', val: fmtDate(String(lead[`planned${activeTab}` as keyof Lead] || '')) || '—', cls: '' },
                    { label: 'Actual Date',  val: fmtDate(String(lead[`actual${activeTab}` as keyof Lead] || '')) || '—',  cls: !!lead[`actual${activeTab}` as keyof Lead] ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : '' },
                    { label: 'Delay Time',   val: String(lead[`delay${activeTab}` as keyof Lead] || '') || '—',            cls: lead[`delay${activeTab}` as keyof Lead] && lead[`delay${activeTab}` as keyof Lead] !== '0 days' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400' },
                  ].map(({ label, val, cls }) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-subtle)' }}>{label}</p>
                      <p className={`font-mono ${cls}`} style={!cls ? { color: 'var(--text-muted)' } : {}}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step specific fields */}
              <div className="space-y-4">
                {activeTab === 1 && (
                  <>
                    <InputField k="designStatus" label="Design Status" type="select"
                      opts={['Draft Ready','Sent for Initial Review','Revision Needed','Approved by Client','Layout Frozen']} />
                    <InputField k="remarks1" label="Remarks" type="textarea" />
                    <div className="pt-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-subtle)' }}>2D Design Copy</label>
                      <FileRow k="designCopy" label="2D Design Copy" />
                    </div>
                  </>
                )}

                {activeTab === 2 && (
                  <>
                    <InputField k="clientStatus1" label="Client Status" type="select"
                      opts={['Done / prepare Quotation','Awaiting response','Hold on budget reasons']} />
                    <InputField k="clientResponse1" label="Client Response" />
                    <InputField k="remarks2" label="Remarks" type="textarea" />
                  </>
                )}

                {activeTab === 3 && (
                  <>
                    <InputField k="quotAmount" label="Quotation Amount (₹)" />
                    <div className="pt-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-subtle)' }}>Quotation Copy</label>
                      <FileRow k="quotCopy" label="Quotation Copy" />
                    </div>
                  </>
                )}

                {activeTab === 4 && (
                  <>
                    <InputField k="clientStatus2" label="Client Status" type="select"
                      opts={['Approved for 3D Render','Token Paid - Design Inbound','Hold - revision in 2D first']} />
                    <InputField k="clientResponse2" label="Client Response" />
                    <InputField k="remarks3" label="Remarks" type="textarea" />
                  </>
                )}

                {activeTab === 5 && (
                  <>
                    <InputField k="threeDStatus" label="3D Status" type="select"
                      opts={['Approved & Sign-off Completed','3D render sent for feedback','Rendering in Queue','Alternative options requested']} />
                    <InputField k="remarks4" label="Comments" type="textarea" />
                    <div className="pt-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-subtle)' }}>3D Render Copy</label>
                      <FileRow k="threeDDesignCopy" label="3D Render Copy" />
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
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
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-subtle)' }} />
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{lead.gpsLocation}</span>
                    </div>
                  )}
                </>
              )}

              {section === 'steps' && (
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => {
                    const planned = String(lead[`planned${i}` as keyof Lead] || '');
                    const actual  = String(lead[`actual${i}` as keyof Lead]  || '');
                    const delay   = String(lead[`delay${i}` as keyof Lead]   || '');
                    const done    = !!actual;
                    const pend    = !!planned && !done;
                    return (
                      <div key={i} className={`rounded-2xl border p-5 transition-all ${
                        done ? 'border-emerald-200 dark:border-emerald-700' :
                        pend ? 'border-amber-200 dark:border-amber-700' : ''
                      }`}
                        style={!done && !pend ? { background: 'var(--bg-elevated)', borderColor: 'var(--border)' } :
                          done ? { background: 'var(--bg-card)', borderColor: '' } :
                          { background: 'var(--bg-card)', borderColor: '' }}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
                              style={{ background: done ? '#10b981' : pend ? '#f59e0b' : STEP_ACCENT[i] }}>
                              {i}
                            </div>
                            <span className={`text-base font-semibold ${
                              done ? 'text-emerald-700 dark:text-emerald-400' :
                              pend ? 'text-amber-700 dark:text-amber-400' : ''
                            }`} style={!done && !pend ? { color: 'var(--text-muted)' } : {}}>
                              {STEP_NAMES[i]}
                            </span>
                            {done && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                            {pend && <Clock className="w-4 h-4 text-amber-500" />}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs mb-4">
                          {[
                            { label: 'Planned', val: fmtDate(planned)||'—', cls: '' },
                            { label: 'Actual',  val: fmtDate(actual)||'—',  cls: done ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : '' },
                            { label: 'Delay',   val: delay||'—',            cls: delay && delay !== '0 days' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400' },
                          ].map(({ label, val, cls }) => (
                            <div key={label}>
                              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-subtle)' }}>{label}</p>
                              <p className={`font-mono ${cls}`} style={!cls ? { color: 'var(--text-muted)' } : {}}>{val}</p>
                            </div>
                          ))}
                        </div>
                        {(done || pend) && (
                          <div className="pt-4 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
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
            </>
          )}

          {/* Delete zone */}
          <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)}
                className="h-9 px-4 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-200 dark:border-rose-700 transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Delete Record
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs text-rose-700 dark:text-rose-400 font-medium flex-1">
                  Permanently delete this lead? This action cannot be undone.
                </span>
                <button onClick={handleDelete} disabled={deleting}
                  className="h-8 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer">
                  {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                  {deleting ? 'Deleting…' : 'Confirm'}
                </button>
                <button onClick={() => setConfirmDel(false)}
                  className="h-8 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
          <div>
            {revertTargetStep !== null && (
              <button onClick={handleRevert} disabled={saving || deleting || reverting}
                className="h-10 px-4 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-200 dark:border-rose-700 transition-colors cursor-pointer disabled:opacity-50">
                {reverting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo className="w-3.5 h-3.5" />}
                Revert to {STEP_NAMES[revertTargetStep]}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={saving || reverting}
              className="h-10 px-5 rounded-xl text-sm font-semibold transition-all cursor-pointer border hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || uploading !== null || reverting}
              className="h-10 px-5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
              {saving ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    <ActionModalContext.Provider value={{ mode, get, set, uploading, uploadFile }}>
      {modalNode}
    </ActionModalContext.Provider>,
    document.body
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function WorkflowBoard({ leads, onRefresh, syncConfig, activeTab: extTab, setActiveTab: extSetTab, onOptimisticUpdate }: WorkflowBoardProps) {
  const [internalTab,  setInternalTab]  = useState<ActiveStepId | 'all' | 'history'>('all');
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
  const [showExport,   setShowExport]   = useState(false);
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
    if (activeTab === 'history') {
      list = list.filter(l => !!l.actual5);
    } else if (activeTab !== 'all') {
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

  const stats = useMemo(() => ({
    total:     filtered.length,
    completed: filtered.filter(l => getLeadStatus(l) === 'completed').length,
    pending:   filtered.filter(l => getLeadStatus(l) === 'pending').length,
    delayed:   filtered.filter(l => getLeadStatus(l) === 'delayed').length,
    today:     filtered.filter(l => l.timestamp.startsWith(new Date().toISOString().split('T')[0])).length,
  }), [filtered]);

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
    if (activeTab !== 'all' && activeTab !== 'history') {
      stepId = activeTab;
    } else {
      let foundIncomplete = false;
      for (let i = 1; i <= 5; i++) {
        if (modal[`planned${i}` as keyof Lead] && !modal[`actual${i}` as keyof Lead]) {
          stepId = i as ActiveStepId;
          foundIncomplete = true;
          break;
        }
      }
      if (!foundIncomplete) {
        stepId = 5;
      }
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

  const handleRevertLead = async (leadNo: string, currentStepNumber: number) => {
    const prevStep = currentStepNumber - 1;
    const updatedFields: Partial<Lead> = {
      [`actual${prevStep}` as keyof Lead]: "",
      [`delay${prevStep}` as keyof Lead]: "",
      [`planned${currentStepNumber}` as keyof Lead]: "",
    };
    if (onOptimisticUpdate) {
      onOptimisticUpdate(leadNo, updatedFields);
    }
    setModal(null);
    notify('success', `Lead step reverted successfully`);

    revertStep(leadNo, currentStepNumber, syncConfig)
      .then(() => onRefresh())
      .catch((err) => {
        console.error("Failed to sync revert to Google Sheet:", err);
        notify('error', `Revert sync failed: ${err.message}`);
      });
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

  const tabCount = (id: ActiveStepId | 'all' | 'history') => {
    if (id === 'all') return leads.length;
    if (id === 'history') return leads.filter(l => !!l.actual5).length;
    return leads.filter(l => l[`planned${id}` as keyof Lead] && !l[`actual${id}` as keyof Lead]).length;
  };

  const selectStyle = {
    background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)'
  };

  return (
    <div className="space-y-5 animate-fade-in pb-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-sm animate-slideInRight ${
          toast.type === 'success' ? 'border-emerald-200 dark:border-emerald-700' : 'border-rose-200 dark:border-rose-700'
        }`} style={{ background: 'var(--bg-card)' }}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          }
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{toast.text}</p>
          <button onClick={() => setToast(null)} className="cursor-pointer transition-colors" style={{ color: 'var(--text-subtle)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <LayoutGrid className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>WorkFlow</h1>
          </div>
          <p className="text-sm ml-12" style={{ color: 'var(--text-muted)' }}>Track and manage all leads across workflow steps</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="h-10 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer border hover:shadow-sm"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: <LayoutGrid className="w-4 h-4 text-slate-500" />,       iconBg: 'bg-slate-100',   label: 'Total Leads', value: stats.total,     color: 'var(--text)',  bar: '#64748b' },
          { icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,   iconBg: 'bg-emerald-100', label: 'Completed',   value: stats.completed, color: '#059669',      bar: '#10b981' },
          { icon: <Clock className="w-4 h-4 text-amber-600" />,             iconBg: 'bg-amber-100',   label: 'Pending',     value: stats.pending,   color: '#d97706',      bar: '#f59e0b' },
          { icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,      iconBg: 'bg-rose-100',    label: 'Delayed',     value: stats.delayed,   color: '#e11d48',      bar: '#f43f5e' },
          { icon: <Calendar className="w-4 h-4 text-indigo-600" />,         iconBg: 'bg-indigo-100',  label: 'Added Today', value: stats.today,     color: '#4f46e5',      bar: '#6366f1' },
        ].map(s => (
          <div key={s.label}
            className="rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition-all group relative overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: s.bar }} />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>{s.label}</p>
              <p className="text-2xl font-bold leading-tight mt-0.5" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Step tabs — centered, uniform emerald theme */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {/* Section label */}
        <div className="px-5 py-2.5 border-b flex items-center justify-center gap-2"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>Workflow Steps</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
        {/* Tab row */}
        <div className="flex overflow-x-auto justify-center">
          {[
            { id: 'all' as const, name: 'All Leads', shortName: 'All', step: null },
            ...([1,2,3,4,5] as ActiveStepId[]).map(k => ({
              id: k as any, name: STEP_NAMES[k], shortName: `S${k}`, step: k,
            })),
            { id: 'history' as const, name: 'History', shortName: 'Hist', step: 'H' },
          ].map(({ id, name, shortName, step }) => {
            const isActive = activeTab === id;
            const count = tabCount(id as ActiveStepId | 'all' | 'history');
            return (
              <button key={id} onClick={() => setActiveTab(id as ActiveStepId | 'all' | 'history')}
                className="relative flex flex-col items-center gap-1 px-6 py-3 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
                style={isActive
                  ? { color: '#059669' }
                  : { color: 'var(--text-muted)' }
                }
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = '#059669'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
              >
                {/* Step circle or grid icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                    : 'text-gray-400'
                }`}
                  style={!isActive ? { background: 'var(--bg-elevated)' } : {}}>
                  {step === null
                    ? <LayoutGrid className="w-3.5 h-3.5" />
                    : step === 'H'
                      ? <History className="w-3.5 h-3.5" />
                      : <span className="text-xs font-bold">{step}</span>
                  }
                </div>
                {/* Label */}
                <span className="hidden sm:inline text-[11px] font-semibold">{name}</span>
                <span className="sm:hidden text-[11px] font-semibold">{shortName}</span>
                {/* Count badge */}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : ''
                }`}
                  style={!isActive ? { background: 'var(--bg-elevated)', color: 'var(--text-subtle)' } : {}}>
                  {count}
                </span>
                {/* Active underline */}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by client, lead no, phone…"
              className="w-full h-9 pl-9 pr-8 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: 'var(--text-subtle)' }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Filter toggle */}
            <button onClick={() => setShowFilters(v => !v)}
              className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showFilters || (empFilter || statusFilter || deptFilter)
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : ''
              }`}
              style={!showFilters && !(empFilter || statusFilter || deptFilter) ? { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' } : {}}>
              <Filter className="w-3.5 h-3.5" /> Filters
              {(empFilter || statusFilter || deptFilter) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>

            {/* Column picker */}
            <div className="relative">
              <button onClick={() => setShowColMenu(v => !v)}
                className="h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <Columns className="w-3.5 h-3.5" /> Columns
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>{activeCols.length}</span>
              </button>
              {showColMenu && (
                <div className="absolute right-0 top-full mt-2 z-30 rounded-2xl shadow-xl p-4 w-80 max-h-96 overflow-y-auto animate-fade-in border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Toggle Columns</span>
                    <button onClick={() => setShowColMenu(false)} className="cursor-pointer" style={{ color: 'var(--text-subtle)' }}><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {ALL_COLUMNS.map(c => (
                      <label key={c.key} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input type="checkbox" checked={visibleCols.has(c.key)} className="w-3.5 h-3.5 accent-emerald-600 rounded"
                          onChange={() => setVisibleCols(prev => { const n = new Set(prev); n.has(c.key) ? n.delete(c.key) : n.add(c.key); return n; })} />
                        <span className="text-xs truncate" style={{ color: 'var(--text)' }}>{c.label}</span>
                        {c.step && <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${STEP_COLORS[c.step]}`}>S{c.step}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6" style={{ background: 'var(--border)' }} />

            {/* Single Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExport(v => !v)}
                title="Export data"
                className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
              {showExport && (
                <div
                  className="absolute right-0 top-full mt-2 z-30 rounded-xl shadow-xl border animate-fade-in overflow-hidden"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', minWidth: '140px' }}
                >
                  <button onClick={() => { handleExcel(); setShowExport(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-emerald-50"
                    style={{ color: 'var(--text)' }}>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel (.xlsx)
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <button onClick={() => { handleCSV(); setShowExport(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-emerald-50"
                    style={{ color: 'var(--text)' }}>
                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> CSV (.csv)
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <button onClick={() => { handlePDF(); setShowExport(false); }} disabled={exporting}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-emerald-50 disabled:opacity-50"
                    style={{ color: 'var(--text)' }}>
                    <Printer className="w-3.5 h-3.5 text-emerald-600" /> PDF Report
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <button onClick={() => { window.print(); setShowExport(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-emerald-50"
                    style={{ color: 'var(--text)' }}>
                    <Printer className="w-3.5 h-3.5 text-emerald-600" /> Print
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 px-4 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            {[
              { value: empFilter,    onChange: setEmpFilter,    label: 'All Sales Persons', options: allEmployees.map(e => ({ value: e, label: e })) },
              { value: statusFilter, onChange: setStatusFilter, label: 'All Statuses', options: [
                { value: 'completed', label: 'Completed' }, { value: 'in-progress', label: 'In Progress' },
                { value: 'pending', label: 'Pending' }, { value: 'delayed', label: 'Delayed' },
              ]},
              { value: deptFilter, onChange: setDeptFilter, label: 'All Work Types', options: allDepts.map(d => ({ value: d, label: d })) },
            ].map(({ value, onChange, label, options }) => (
              <select key={label} value={value} onChange={e => onChange(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-300 cursor-pointer"
                style={selectStyle}>
                <option value="">{label}</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
            {(empFilter || statusFilter || deptFilter) && (
              <button onClick={() => { setEmpFilter(''); setStatusFilter(''); setDeptFilter(''); }}
                className="h-9 px-3 text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-rose-100">
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" style={{ minWidth: `${Math.max(1000, activeCols.length * 130 + 280)}px` }}>
            {activeCols.some(c => c.step) && (
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <th colSpan={2} />
                  {activeCols.map(c => (
                    !c.step ? <th key={c.key} /> :
                    <th key={c.key} className="px-4 py-2 border-x" style={{ borderColor: 'var(--border)' }}>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STEP_COLORS[c.step]}`}>S{c.step}</span>
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
            )}
            <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-elevated)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[100px]" style={{ color: 'var(--text-subtle)' }}>Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[110px]" style={{ color: 'var(--text-subtle)' }}>Progress</th>
                {activeCols.map(c => (
                  <th key={c.key} onClick={() => toggleSort(c.key)}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors select-none hover:bg-gray-100 dark:hover:bg-gray-700 ${c.width}`}
                    style={{ color: 'var(--text-subtle)' }}>
                    <div className="flex items-center gap-1">
                      {c.label}
                      {sort.key === c.key
                        ? sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-500" /> : <ChevronDown className="w-3 h-3 text-emerald-500" />
                        : <ChevronsUpDown className="w-3 h-3" style={{ color: 'var(--text-subtle)' }} />}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center w-[90px] sticky right-0 z-10"
                  style={{ color: 'var(--text-subtle)', background: 'var(--bg-elevated)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={activeCols.length + 3} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                        <Search className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No leads found</p>
                      <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : paged.map((lead, idx) => (
                <tr key={lead.leadNo}
                  className="border-b transition-colors cursor-pointer"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-elevated)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-elevated)')}
                >
                  <td className="px-4 py-2.5"><StatusBadge lead={lead} /></td>
                  <td className="px-4 py-2.5"><ProgressBar lead={lead} /></td>
                  {activeCols.map(c => (
                    <td key={c.key} className="px-4 py-2.5 max-w-[200px]">
                      <CellValue col={c} lead={lead} />
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-center sticky right-0 z-5" style={{ background: 'inherit' }}>
                    <button onClick={() => setModal(lead)}
                      className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto transition-all shadow-sm cursor-pointer">
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-t"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
            <span>
              <strong style={{ color: 'var(--text)' }}>{paged.length === 0 ? 0 : (page-1)*pageSize+1}–{Math.min(page*pageSize, filtered.length)}</strong>
              {' '}of{' '}
              <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong>
              {' '}leads
            </span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-7 px-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-300 cursor-pointer"
              style={selectStyle}>
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            {[
              { label: '«', onClick: () => setPage(1), disabled: page === 1 },
              { label: <ChevronLeft className="w-3.5 h-3.5" />, onClick: () => setPage(p => Math.max(1, p-1)), disabled: page === 1 },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                className="h-8 w-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 cursor-pointer text-xs font-bold"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                {btn.label}
              </button>
            ))}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                    p === page ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : ''
                  }`}
                  style={p !== page ? { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' } : {}}>
                  {p}
                </button>
              );
            })}
            {[
              { label: <ChevronRight className="w-3.5 h-3.5" />, onClick: () => setPage(p => Math.min(totalPages, p+1)), disabled: page === totalPages },
              { label: '»', onClick: () => setPage(totalPages), disabled: page === totalPages },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                className="h-8 w-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 cursor-pointer text-xs font-bold"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                {btn.label}
              </button>
            ))}
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
          onRevert={handleRevertLead}
          syncConfig={syncConfig}
          activeTab={activeTab}
        />
      )}
    </div>
  );
}
