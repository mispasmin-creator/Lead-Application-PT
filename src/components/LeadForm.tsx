import React from 'react';
import {
  User, Phone, MapPin, Upload,
  Loader2, CheckCircle, AlertCircle, Trash2, X, Hash, Briefcase, FileText, Navigation,
  ChevronRight, CheckCircle2, Circle,
} from 'lucide-react';
import { Lead, SyncConfig } from '../types';
import { uploadFileToDrive } from '../utils/storage';

interface LeadFormProps {
  onSuccess: (lead: Lead) => void;
  syncConfig: SyncConfig;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  text: string;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FormField({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
        {label}
        {required && <span className="text-rose-400 text-sm leading-none">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>{hint}</p>
      )}
      {error && (
        <p className="text-xs text-rose-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ num, label, desc }: { num: number; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 pb-5 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200 text-sm font-bold">
        {num}
      </div>
      <div>
        <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>{label}</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function LeadForm({ onSuccess, syncConfig }: LeadFormProps) {
  const [submitting,        setSubmitting]        = React.useState(false);
  const [uploading,         setUploading]         = React.useState(false);
  const [toasts,            setToasts]            = React.useState<Toast[]>([]);
  const [uploadProgress,    setUploadProgress]    = React.useState(0);
  const [uploadedFileName,  setUploadedFileName]  = React.useState('');
  const [dragActive,        setDragActive]        = React.useState(false);
  const [errors,            setErrors]            = React.useState<Record<string, string>>({});

  const [leadNo,        setLeadNo]        = React.useState('');
  const [clientName,    setClientName]    = React.useState('');
  const [phone,         setPhone]         = React.useState('');
  const [kitchen,       setKitchen]       = React.useState('');
  const [wardrobe,      setWardrobe]      = React.useState('');
  const [otherWork,     setOtherWork]     = React.useState('');
  const [leadSource,    setLeadSource]    = React.useState('');
  const [salesPerson,   setSalesPerson]   = React.useState('');
  const [attachFileUrl, setAttachFileUrl] = React.useState('');
  const [gpsLocation,   setGpsLocation]   = React.useState('');

  React.useEffect(() => {
    if (toasts.length > 0) {
      const t = setTimeout(() => setToasts(p => p.slice(1)), 4500);
      return () => clearTimeout(t);
    }
  }, [toasts]);

  const addToast = (type: 'success' | 'error', text: string) =>
    setToasts(p => [...p, { id: Date.now(), type, text }]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!clientName.trim()) e.clientName = 'Client name is required';
    else if (clientName.trim().length < 2) e.clientName = 'Name must be at least 2 characters';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[0-9+\-\s()]{10,15}$/.test(phone.trim())) e.phone = 'Enter a valid phone number (10–15 digits)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { addToast('error', 'File must be under 10 MB'); return; }
    setUploading(true); setUploadProgress(0); setUploadedFileName(file.name);
    const tick = setInterval(() => setUploadProgress(p => Math.min(p + 10, 90)), 200);
    try {
      const url = await uploadFileToDrive(file, syncConfig);
      setAttachFileUrl(url);
      clearInterval(tick); setUploadProgress(100);
      addToast('success', `"${file.name}" uploaded successfully`);
    } catch (err: any) {
      clearInterval(tick); addToast('error', err.message || 'File upload failed'); setUploadedFileName('');
    } finally {
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) await processFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLead: Lead = {
      timestamp: nowStr, leadNo, clientName: clientName.trim(), phone: phone.trim(),
      kitchen, wardrobe, otherWork, leadSource, salesPerson,
      attachFile: attachFileUrl, gpsLocation,
      planned1: nowStr, actual1: '', delay1: '', designCopy: '', designStatus: 'Created', remarks1: '',
      planned2: '', actual2: '', delay2: '', clientResponse1: '', clientStatus1: '', remarks2: '',
      planned3: '', actual3: '', delay3: '', quotAmount: '', quotCopy: '',
      planned4: '', actual4: '', delay4: '', clientResponse2: '', clientStatus2: '', remarks3: '',
      planned5: '', actual5: '', delay5: '', threeDDesignCopy: '', threeDStatus: '', remarks4: '',
    };
    try {
      await onSuccess(newLead);
      addToast('success', `Lead ${leadNo || 'created'} saved successfully`);
      setLeadNo(''); setClientName(''); setPhone(''); setKitchen(''); setWardrobe('');
      setOtherWork(''); setLeadSource(''); setSalesPerson('');
      setAttachFileUrl(''); setGpsLocation(''); setUploadedFileName('');
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save lead');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setLeadNo(''); setClientName(''); setPhone(''); setKitchen(''); setWardrobe('');
    setOtherWork(''); setLeadSource(''); setSalesPerson('');
    setAttachFileUrl(''); setGpsLocation(''); setUploadedFileName('');
    setErrors({});
  };

  const disabled = submitting || uploading;

  const inputBase =
    'w-full h-11 px-4 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-emerald-400 focus:ring-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed placeholder:opacity-40';

  const inputStyle = (hasError?: boolean) => ({
    background: 'var(--bg-elevated)',
    borderColor: hasError ? '#f43f5e' : 'var(--border)',
    color: 'var(--text)',
  });

  const fieldStyle = { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' };

  // Progress summary for left panel
  const sections = [
    { label: 'Lead Info',    done: !!(clientName && phone) },
    { label: 'Work Details', done: !!(kitchen || wardrobe || otherWork) },
    { label: 'Attribution',  done: !!(leadSource || salesPerson) },
    { label: 'Attachment',   done: !!attachFileUrl },
  ];
  const completedCount = sections.filter(s => s.done).length;

  return (
    <div className="animate-fade-in pb-10">

      {/* Toast notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-3 w-full max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md animate-slideInRight ${
              t.type === 'success' ? 'border-emerald-200' : 'border-rose-200'
            }`}
            style={{ background: 'var(--bg-card)' }}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              t.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'
            }`}>
              {t.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                : <AlertCircle className="w-4 h-4 text-rose-500" />}
            </div>
            <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{t.text}</p>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
              className="cursor-pointer p-0.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-subtle)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest mb-3 bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Briefcase className="w-3.5 h-3.5" />
            NEW OPPORTUNITY
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Create New Lead</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Fill in the details to add a lead to your pipeline</p>
        </div>
        {/* Completion pill */}
        <div className="shrink-0 flex flex-col items-end gap-1 mt-1">
          <div className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{completedCount}/4 sections</div>
          <div className="flex gap-1">
            {sections.map((s, i) => (
              <div key={i} className={`w-8 h-1.5 rounded-full transition-all ${s.done ? 'bg-emerald-500' : ''}`}
                style={!s.done ? { background: 'var(--border)' } : {}} />
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">

        {/* ─ Left panel: sticky progress sidebar ─ */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {/* Panel header */}
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>Form Progress</p>
            </div>
            {/* Section list */}
            <div className="p-3 space-y-1">
              {sections.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                  style={{ background: s.done ? 'rgba(16,185,129,0.06)' : 'transparent' }}>
                  {s.done
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <Circle className="w-4 h-4 shrink-0" style={{ color: 'var(--text-subtle)' }} />
                  }
                  <span className="text-sm font-semibold" style={{ color: s.done ? '#059669' : 'var(--text-muted)' }}>
                    {i + 1}. {s.label}
                  </span>
                  {s.done && <ChevronRight className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                </div>
              ))}
            </div>
            {/* Summary preview */}
            {(clientName || phone) && (
              <div className="mx-3 mb-3 p-3 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}>Preview</p>
                {clientName && <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{clientName}</p>}
                {phone && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{phone}</p>}
                {leadSource && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>via {leadSource}</p>}
                {salesPerson && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>→ {salesPerson}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ─ Right panel: the actual form ─ */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">

            {/* ── Section 1: Lead Information ── */}
            <div className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <SectionHeader num={1} label="Lead Information" desc="Basic contact and identification details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Lead Number" hint="Auto-generated if left blank">
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                      <input type="text" value={leadNo} placeholder="e.g., LD-2409"
                        onChange={e => setLeadNo(e.target.value)}
                        className={`${inputBase} pl-10`} style={fieldStyle} disabled={disabled} />
                    </div>
                  </FormField>

                  <FormField label="Client Name" required error={errors.clientName}>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                      <input type="text" value={clientName} placeholder="Full name"
                        onChange={e => { setClientName(e.target.value); if (errors.clientName) setErrors(p => ({ ...p, clientName: '' })); }}
                        className={`${inputBase} pl-10`} style={inputStyle(!!errors.clientName)} disabled={disabled} />
                    </div>
                  </FormField>

                  <FormField label="Phone Number" required error={errors.phone}>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                      <input type="tel" value={phone} placeholder="+91 98765 43210"
                        onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }}
                        className={`${inputBase} pl-10`} style={inputStyle(!!errors.phone)} disabled={disabled} />
                    </div>
                  </FormField>

                  <FormField label="GPS Location" hint="Latitude, Longitude — optional">
                    <div className="relative">
                      <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                      <input type="text" value={gpsLocation} placeholder="28.6139, 77.2090"
                        onChange={e => setGpsLocation(e.target.value)}
                        className={`${inputBase} pl-10`} style={fieldStyle} disabled={disabled} />
                    </div>
                  </FormField>
                </div>
              </div>
            </div>

            {/* ── Section 2: Work Details ── */}
            <div className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <SectionHeader num={2} label="Work Details" desc="Scope of work — kitchen, wardrobe, and other" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Kitchen Type">
                    <div className="relative">
                      <select value={kitchen} onChange={e => setKitchen(e.target.value)}
                        className={`${inputBase} appearance-none pr-9`} style={fieldStyle} disabled={disabled}>
                        <option value="">— Select Type —</option>
                        <option value="L-Shaped Modular Kitchen">L-Shaped Modular</option>
                        <option value="U-Shaped Modular Kitchen">U-Shaped Modular</option>
                        <option value="Parallel Kitchen Setup">Parallel Kitchen</option>
                        <option value="Straight Kitchen (Standard)">Straight Kitchen</option>
                        <option value="Island Luxury Layout">Island Luxury</option>
                        <option value="No Kitchen Work Involved">None</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4" style={{ color: 'var(--text-subtle)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </FormField>

                  <FormField label="Wardrobe Type">
                    <div className="relative">
                      <select value={wardrobe} onChange={e => setWardrobe(e.target.value)}
                        className={`${inputBase} appearance-none pr-9`} style={fieldStyle} disabled={disabled}>
                        <option value="">— Select Type —</option>
                        <option value="2-Door Sliding Wardrobe">2-Door Sliding</option>
                        <option value="3-Door Sliding Wardrobe">3-Door Sliding</option>
                        <option value="Hinged Modular Wardrobe">Hinged Modular</option>
                        <option value="Walk-in Wardrobe Closet">Walk-in Closet</option>
                        <option value="No Wardrobe Layout">None</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4" style={{ color: 'var(--text-subtle)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Other Scope" hint="TV unit, false ceiling, custom furniture, etc.">
                      <input type="text" value={otherWork} placeholder="Describe any additional work…"
                        onChange={e => setOtherWork(e.target.value)}
                        className={inputBase} style={fieldStyle} disabled={disabled} />
                    </FormField>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 3: Attribution ── */}
            <div className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <SectionHeader num={3} label="Attribution" desc="Where did this lead come from and who owns it?" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Lead Source">
                    <div className="relative">
                      <select value={leadSource} onChange={e => setLeadSource(e.target.value)}
                        className={`${inputBase} appearance-none pr-9`} style={fieldStyle} disabled={disabled}>
                        <option value="">— Select Source —</option>
                        <option value="Instagram Ad">Instagram Ad</option>
                        <option value="Facebook Campaign">Facebook Campaign</option>
                        <option value="Google Organic">Google Organic</option>
                        <option value="Store Walk-in">Store Walk-in</option>
                        <option value="Designer Referral">Designer Referral</option>
                        <option value="Reference Client">Reference Client</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4" style={{ color: 'var(--text-subtle)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </FormField>

                  <FormField label="Assigned Sales Person">
                    <div className="relative">
                      <select value={salesPerson} onChange={e => setSalesPerson(e.target.value)}
                        className={`${inputBase} appearance-none pr-9`} style={fieldStyle} disabled={disabled}>
                        <option value="">— Assign to —</option>
                        <option value="Aman Gupta">Aman Gupta</option>
                        <option value="Kriti Sen">Kriti Sen</option>
                        <option value="Sonal Verma">Sonal Verma</option>
                        <option value="Rajdeep Das">Rajdeep Das</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4" style={{ color: 'var(--text-subtle)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </FormField>
                </div>
              </div>
            </div>

            {/* ── Section 4: Attachment ── */}
            <div className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="px-6 py-5" style={{ background: 'var(--bg-elevated)' }}>
                <SectionHeader num={4} label="Attachment" desc="Upload a floor plan, image, or any relevant document" />
                <div
                  onDragEnter={handleDrag} onDragOver={handleDrag}
                  onDragLeave={handleDrag} onDrop={handleDrop}
                  className={`relative rounded-2xl border-2 transition-all duration-300 ${
                    dragActive
                      ? 'border-emerald-400 bg-emerald-50/60 scale-[1.01]'
                      : attachFileUrl
                        ? 'border-emerald-300'
                        : 'border-dashed'
                  } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
                  style={!dragActive && !attachFileUrl ? { borderColor: 'var(--border)' } : {}}>
                  <input type="file" id="file-upload" className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
                    disabled={uploading || disabled}
                    accept=".pdf,.jpg,.jpeg,.png,.dwg,.zip,.rar" />

                  {uploading ? (
                    <div className="p-8 text-center space-y-4">
                      <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Uploading to Drive…</p>
                        <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{uploadedFileName}</p>
                      </div>
                      <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs font-bold text-emerald-600">{uploadProgress}%</p>
                    </div>
                  ) : attachFileUrl ? (
                    <div className="p-6 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold text-emerald-600">Uploaded successfully</span>
                        </div>
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{uploadedFileName}</p>
                      </div>
                      <button type="button" onClick={() => { setAttachFileUrl(''); setUploadedFileName(''); }}
                        className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-50 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer shrink-0">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="p-10 text-center cursor-pointer group">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors group-hover:bg-emerald-50"
                        style={{ background: 'var(--bg-elevated)' }}>
                        <Upload className="w-6 h-6 text-emerald-500 transition-colors" />
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        Drag & drop or <span className="text-emerald-600 font-bold">click to browse</span>
                      </p>
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-subtle)' }}>
                        PDF, images, DWG, ZIP — up to 10 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Form Actions ── */}
            <div className="rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                <span className="text-rose-400">*</span> Required fields must be completed before saving
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={resetForm} disabled={disabled}
                  className="h-10 px-5 text-sm font-semibold rounded-xl border transition-all cursor-pointer hover:shadow-sm disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
                  Reset
                </button>
                <button type="submit" disabled={disabled}
                  className="h-10 px-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-200 hover:-translate-y-0.5 hover:shadow-md">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
                    : <><CheckCircle className="w-4 h-4" /><span>Save Lead</span></>
                  }
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
