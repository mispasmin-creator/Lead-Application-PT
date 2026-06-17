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

// Grayscale step accents
const STEP_ACCENT: Record<number, string> = { 1: '#6b7280', 2: '#4b5563', 3: '#374151', 4: '#1f2937', 5: '#111827' };

const StepBadge = ({ step }: { step: number }) => (
  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600">
    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STEP_ACCENT[step] }} />
    S{step}
  </span>
);

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
  completed:    { cls: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Completed',   icon: <CheckCircle2 className="w-3 h-3" /> },
  'in-progress':{ cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'In Progress', icon: <Clock className="w-3 h-3" /> },
  pending:      { cls: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Pending',     icon: <AlertCircle className="w-3 h-3" /> },
  delayed:      { cls: 'bg-red-50 text-red-700 border-red-200', label: 'Delayed',     icon: <AlertTriangle className="w-3 h-3" /> },
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
              !!lead[`actual${i}` as keyof Lead] ? 'bg-gray-900' :
              !!lead[`planned${i}` as keyof Lead] ? 'bg-gray-400' : 'bg-gray-200'
            }`} />
        ))}
      </div>
      <span className="text-xs font-mono text-gray-400">{done}/5</span>
    </div>
  );
};

const CellValue = ({ col, lead }: { col: typeof ALL_COLUMNS[number]; lead: Lead }) => {
  const raw = lead[col.key];
  if (!raw) return <span className="text-xs text-gray-400">—</span>;
  const val = String(raw);

  if (col.key.startsWith('planned') || col.key.startsWith('actual') || col.key === 'timestamp') {
    const isActual = col.key.startsWith('actual');
    return <span className={`text-xs font-mono ${isActual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>{fmtDate(val) || val}</span>;
  }
  if (col.key.startsWith('delay')) {
    const isZero = val === '0 days';
    return <span className={`text-xs font-semibold ${isZero ? 'text-gray-600' : 'text-red-600'}`}>{val}</span>;
  }
  if ((col.key === 'designCopy' || col.key === 'quotCopy' || col.key === 'threeDDesignCopy' || col.key === 'attachFile') && val.startsWith('http')) {
    return (
      <a href={val} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 font-medium underline underline-offset-2">
        <ExternalLink className="w-3 h-3" /> View
      </a>
    );
  }
  if (col.key === 'quotAmount') {
    return <span className="text-xs font-semibold text-gray-900">₹{Number(val).toLocaleString()}</span>;
  }
  return <span className="text-xs truncate block max-w-[180px] text-gray-900" title={val}>{val}</span>;
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
  const inputCls = 'w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white text-gray-900';

  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-gray-500">{label}</label>
      {mode === 'view' ? (
        <p className="text-sm min-h-[20px] py-1 text-gray-900">{val || <span className="italic text-xs text-gray-400">Not set</span>}</p>
      ) : type === 'textarea' ? (
        <textarea value={val} onChange={e => set(k, e.target.value)} rows={3}
          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 resize-none transition-all bg-white text-gray-900" />
      ) : type === 'select' && opts ? (
        <select value={val} onChange={e => set(k, e.target.value)}
          className={`${inputCls} appearance-none cursor-pointer`}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="text" value={val} onChange={e => set(k, e.target.value)}
          className={inputCls} />
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
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs mt-0.5 text-gray-500">
            {url.startsWith('http') ? 'Stored in Drive' : 'No file attached'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {url.startsWith('http') && (
          <a href={url} target="_blank" rel="noreferrer"
            className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">
            <Eye className="w-3.5 h-3.5" /> View
          </a>
        )}
        {mode === 'edit' && (
          <label className={`relative cursor-pointer h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium flex items-center gap-1.5 transition-colors bg-white text-gray-700 hover:bg-gray-50 ${uploading === k ? 'opacity-60' : ''}`}>
            {uploading === k ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" /> : <Upload className="w-3.5 h-3.5" />}
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
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div className="rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border border-gray-200 bg-white"
        style={{
          maxHeight: '90vh',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 shrink-0 bg-gray-50/50">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded-lg font-semibold bg-gray-100 text-gray-600">{lead.leadNo}</span>
              {activeTab === 'all' || activeTab === 'history' ? (
                <StatusBadge lead={lead} />
              ) : (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  !!lead[`actual${activeTab}` as keyof Lead]
                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {!!lead[`actual${activeTab}` as keyof Lead] ? 'Step Completed' : 'Step Pending'}
                </span>
              )}
            </div>
            <h2 className="font-bold text-xl leading-tight truncate text-gray-900">{lead.clientName}</h2>
            <p className="text-xs mt-0.5 text-gray-500">
              {lead.phone} · {lead.salesPerson || 'Unassigned'} · {fmtDate(lead.timestamp)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {(activeTab === 'all' || activeTab === 'history') && (
          <div className="px-6 py-3 border-b border-gray-200 shrink-0 flex items-center gap-4 bg-gray-50/50">
            <span className="text-xs font-medium shrink-0 text-gray-500">Overall Progress</span>
            <ProgressBar lead={lead} />
          </div>
        )}

        {/* Tabs */}
        {(activeTab === 'all' || activeTab === 'history') && (
          <div className="px-6 py-2.5 border-b border-gray-200 shrink-0 flex gap-1 bg-gray-50/50">
            {(['details', 'steps', 'files'] as const).map(t => (
              <button key={t} onClick={() => setSection(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                  section === t
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {err && (
          <div className="mx-6 mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700 flex-1">{err}</p>
            <button onClick={() => setErr(null)} className="text-red-400 hover:text-red-700 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab !== 'all' && activeTab !== 'history' ? (
            <div className="space-y-5">
              {/* Step info banner */}
              <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm bg-gray-700">
                      {activeTab}
                    </div>
                    <span className="text-base font-semibold text-gray-900">
                      {STEP_NAMES[activeTab]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  {[
                    { label: 'Planned Date', val: fmtDate(String(lead[`planned${activeTab}` as keyof Lead] || '')) || '—', cls: '' },
                    { label: 'Actual Date',  val: fmtDate(String(lead[`actual${activeTab}` as keyof Lead] || '')) || '—',  cls: !!lead[`actual${activeTab}` as keyof Lead] ? 'text-gray-900 font-semibold' : '' },
                    { label: 'Delay Time',   val: String(lead[`delay${activeTab}` as keyof Lead] || '') || '—',            cls: lead[`delay${activeTab}` as keyof Lead] && lead[`delay${activeTab}` as keyof Lead] !== '0 days' ? 'text-red-600 font-semibold' : 'text-gray-600' },
                  ].map(({ label, val, cls }) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-gray-500">{label}</p>
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
                      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-gray-500">2D Design Copy</label>
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
                      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-gray-500">Quotation Copy</label>
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
                      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-gray-500">3D Render Copy</label>
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
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span className="text-xs font-mono text-gray-600">{lead.gpsLocation}</span>
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
                        done ? 'border-gray-300 bg-gray-50' :
                        pend ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm bg-gray-700">
                              {i}
                            </div>
                            <span className={`text-base font-semibold ${
                              done ? 'text-gray-900' :
                              pend ? 'text-amber-700' : 'text-gray-400'
                            }`}>
                              {STEP_NAMES[i]}
                            </span>
                            {done && <CheckCircle2 className="w-4 h-4 text-gray-700" />}
                            {pend && <Clock className="w-4 h-4 text-amber-500" />}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs mb-4">
                          {[
                            { label: 'Planned', val: fmtDate(planned)||'—', cls: '' },
                            { label: 'Actual',  val: fmtDate(actual)||'—',  cls: done ? 'text-gray-900 font-semibold' : '' },
                            { label: 'Delay',   val: delay||'—',            cls: delay && delay !== '0 days' ? 'text-red-600 font-semibold' : 'text-gray-600' },
                          ].map(({ label, val, cls }) => (
                            <div key={label}>
                              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-gray-500">{label}</p>
                              <p className={`font-mono ${cls}`} style={!cls ? { color: 'var(--text-muted)' } : {}}>{val}</p>
                            </div>
                          ))}
                        </div>
                        {(done || pend) && (
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
            </>
          )}

          {/* Delete zone */}
          <div className="pt-3 border-t border-gray-200">
            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)}
                className="h-9 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-red-200 transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Delete Record
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3.5 bg-red-50 rounded-xl border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs text-red-700 font-medium flex-1">
                  Permanently delete this lead? This action cannot be undone.
                </span>
                <button onClick={handleDelete} disabled={deleting}
                  className="h-8 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer">
                  {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                  {deleting ? 'Deleting…' : 'Confirm'}
                </button>
                <button onClick={() => setConfirmDel(false)}
                  className="h-8 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50/50">
          <div>
            {revertTargetStep !== null && (
              <button onClick={handleRevert} disabled={saving || deleting || reverting}
                className="h-10 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-red-200 transition-colors cursor-pointer disabled:opacity-50">
                {reverting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo className="w-3.5 h-3.5" />}
                Revert to {STEP_NAMES[revertTargetStep]}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={saving || reverting}
              className="h-10 px-5 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || uploading !== null || reverting}
              className="h-10 px-5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md">
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
        headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 8 },
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

  return (
    <div className="space-y-5 animate-fade-in pb-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-sm animate-slideInRight ${
          toast.type === 'success' ? 'border-gray-200 bg-white' : 'border-red-200 bg-white'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          }
          <p className="text-sm font-medium text-gray-900">{toast.text}</p>
          <button onClick={() => setToast(null)} className="cursor-pointer transition-colors text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">WorkFlow</h1>
          </div>
          <p className="text-sm ml-12 text-gray-500">Track and manage all leads across workflow steps</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="h-10 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm">
          <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: <LayoutGrid className="w-4 h-4 text-gray-500" />,        iconBg: 'bg-gray-100',    label: 'Total Leads', value: stats.total,     color: 'text-gray-900' },
          { icon: <CheckCircle2 className="w-4 h-4 text-gray-700" />,  iconBg: 'bg-gray-100', label: 'Completed',   value: stats.completed, color: 'text-gray-700' },
          { icon: <Clock className="w-4 h-4 text-amber-600" />,              iconBg: 'bg-amber-50',     label: 'Pending',     value: stats.pending,   color: 'text-amber-700' },
          { icon: <AlertTriangle className="w-4 h-4 text-red-600" />,        iconBg: 'bg-red-50',       label: 'Delayed',     value: stats.delayed,   color: 'text-red-700' },
          { icon: <Calendar className="w-4 h-4 text-gray-600" />,         iconBg: 'bg-gray-100',   label: 'Added Today', value: stats.today,     color: 'text-gray-700' },
        ].map(s => (
          <div key={s.label}
            className="rounded-2xl border border-gray-200 p-4 flex items-center gap-3 hover:shadow-md transition-all group relative overflow-hidden bg-white">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold leading-tight mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Step tabs */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="px-5 py-2.5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Workflow Steps</span>
          <span className="text-[11px] text-gray-400">{leads.length} total leads</span>
        </div>
        <div className="flex overflow-x-auto">
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
                className={`relative flex flex-col items-center gap-1.5 px-5 py-3.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border-r border-gray-100 last:border-r-0 ${
                  isActive ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step === null
                    ? <LayoutGrid className="w-3.5 h-3.5" />
                    : step === 'H'
                      ? <History className="w-3.5 h-3.5" />
                      : <span className="text-xs font-bold">{step}</span>
                  }
                </div>
                <span className="hidden sm:inline text-[11px] font-semibold leading-tight text-center">{name}</span>
                <span className="sm:hidden text-[11px] font-semibold">{shortName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isActive ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                  {count}
                </span>
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center px-4 py-3.5 border-b border-gray-200">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by client, lead no, phone…"
              className="w-full h-9 pl-9 pr-8 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white text-gray-900 placeholder:text-gray-400" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600">
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
                  ? 'bg-gray-100 text-gray-700 border-gray-300'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}>
              <Filter className="w-3.5 h-3.5" /> Filters
              {(empFilter || statusFilter || deptFilter) && <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />}
            </button>

            {/* Column picker */}
            <div className="relative">
              <button onClick={() => setShowColMenu(v => !v)}
                className="h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-gray-200 transition-all cursor-pointer bg-white text-gray-500 hover:bg-gray-50">
                <Columns className="w-3.5 h-3.5" /> Columns
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">{activeCols.length}</span>
              </button>
              {showColMenu && (
                <div className="absolute right-0 top-full mt-2 z-30 rounded-2xl shadow-xl p-4 w-80 max-h-96 overflow-y-auto animate-fade-in border border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Toggle Columns</span>
                    <button onClick={() => setShowColMenu(false)} className="cursor-pointer text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {ALL_COLUMNS.map(c => (
                      <label key={c.key} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg transition-colors hover:bg-gray-50">
                        <input type="checkbox" checked={visibleCols.has(c.key)} className="w-3.5 h-3.5 accent-gray-700 rounded"
                          onChange={() => setVisibleCols(prev => { const n = new Set(prev); n.has(c.key) ? n.delete(c.key) : n.add(c.key); return n; })} />
                        <span className="text-xs truncate text-gray-900">{c.label}</span>
                        {c.step && <span className="ml-auto"><StepBadge step={c.step} /></span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200" />

            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExport(v => !v)}
                title="Export data"
                className="h-9 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
              {showExport && (
                <div
                  className="absolute right-0 top-full mt-2 z-30 rounded-xl shadow-xl border border-gray-200 animate-fade-in overflow-hidden bg-white"
                  style={{ minWidth: '140px' }}
                >
                  <button onClick={() => { handleExcel(); setShowExport(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-gray-50 text-gray-700">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-gray-600" /> Excel (.xlsx)
                  </button>
                  <div className="h-px bg-gray-200" />
                  <button onClick={() => { handleCSV(); setShowExport(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-gray-50 text-gray-700">
                    <FileText className="w-3.5 h-3.5 text-gray-600" /> CSV (.csv)
                  </button>
                  <div className="h-px bg-gray-200" />
                  <button onClick={() => { handlePDF(); setShowExport(false); }} disabled={exporting}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-gray-50 disabled:opacity-50 text-gray-700">
                    <Printer className="w-3.5 h-3.5 text-gray-600" /> PDF Report
                  </button>
                  <div className="h-px bg-gray-200" />
                  <button onClick={() => { window.print(); setShowExport(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-gray-50 text-gray-700">
                    <Printer className="w-3.5 h-3.5 text-gray-600" /> Print
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            {[
              { value: empFilter,    onChange: setEmpFilter,    label: 'All Sales Persons', options: allEmployees.map(e => ({ value: e, label: e })) },
              { value: statusFilter, onChange: setStatusFilter, label: 'All Statuses', options: [
                { value: 'completed', label: 'Completed' }, { value: 'in-progress', label: 'In Progress' },
                { value: 'pending', label: 'Pending' }, { value: 'delayed', label: 'Delayed' },
              ]},
              { value: deptFilter, onChange: setDeptFilter, label: 'All Work Types', options: allDepts.map(d => ({ value: d, label: d })) },
            ].map(({ value, onChange, label, options }) => (
              <select key={label} value={value} onChange={e => onChange(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer bg-white text-gray-700">
                <option value="">{label}</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
            {(empFilter || statusFilter || deptFilter) && (
              <button onClick={() => { setEmpFilter(''); setStatusFilter(''); setDeptFilter(''); }}
                className="h-9 px-3 text-xs font-semibold text-red-600 bg-red-50 rounded-xl border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-red-100">
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" style={{ minWidth: `${Math.max(1000, activeCols.length * 130 + 280)}px` }}>
            {activeCols.some(c => c.step) && (
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th colSpan={2} />
                  {activeCols.map(c => (
                    !c.step ? <th key={c.key} /> :
                    <th key={c.key} className="px-4 py-2 border-x border-gray-200 text-center">
                      <StepBadge step={c.step} />
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
            )}
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-center w-[112px] text-gray-500 whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-center w-[120px] text-gray-500 whitespace-nowrap">Progress</th>
                {activeCols.map(c => (
                  <th key={c.key} onClick={() => toggleSort(c.key)}
                    className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors select-none hover:bg-gray-100 ${c.width} text-gray-500 whitespace-nowrap`}>
                    <div className="flex items-center gap-1">
                      {c.label}
                      {sort.key === c.key
                        ? sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-gray-700" /> : <ChevronDown className="w-3 h-3 text-gray-700" />
                        : <ChevronsUpDown className="w-3 h-3 text-gray-400" />}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-center w-[90px] sticky right-0 z-10 bg-gray-50 text-gray-500 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={activeCols.length + 3} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
                        <Search className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No leads found</p>
                      <p className="text-xs text-gray-400">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : paged.map((lead, idx) => (
                <tr key={lead.leadNo}
                  className={`border-b border-gray-100 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'white' : 'rgba(249,250,251,0.3)')}
                >
                  <td className="px-4 py-3"><div className="flex justify-center"><StatusBadge lead={lead} /></div></td>
                  <td className="px-4 py-3"><div className="flex justify-center"><ProgressBar lead={lead} /></div></td>
                  {activeCols.map(c => (
                    <td key={c.key} className="px-4 py-3 max-w-[200px]">
                      <CellValue col={c} lead={lead} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center sticky right-0 z-5" style={{ background: 'inherit' }}>
                    <button onClick={() => setModal(lead)}
                      className="h-7 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto transition-all shadow-sm cursor-pointer">
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3 text-xs flex-wrap text-gray-500">
            <span>
              <strong className="text-gray-900">{paged.length === 0 ? 0 : (page-1)*pageSize+1}–{Math.min(page*pageSize, filtered.length)}</strong>
              {' '}of{' '}
              <strong className="text-gray-900">{filtered.length}</strong>
              {' '}leads
            </span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-7 px-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer bg-white text-gray-700">
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            {[
              { label: '«', onClick: () => setPage(1), disabled: page === 1 },
              { label: <ChevronLeft className="w-3.5 h-3.5" />, onClick: () => setPage(p => Math.max(1, p-1)), disabled: page === 1 },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 transition-all disabled:opacity-40 cursor-pointer text-xs font-bold bg-white text-gray-700 hover:bg-gray-50">
                {btn.label}
              </button>
            ))}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                    p === page ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {p}
                </button>
              );
            })}
            {[
              { label: <ChevronRight className="w-3.5 h-3.5" />, onClick: () => setPage(p => Math.min(totalPages, p+1)), disabled: page === totalPages },
              { label: '»', onClick: () => setPage(totalPages), disabled: page === totalPages },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 transition-all disabled:opacity-40 cursor-pointer text-xs font-bold bg-white text-gray-700 hover:bg-gray-50">
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