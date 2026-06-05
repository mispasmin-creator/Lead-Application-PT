import React from 'react';
import {
  User, Phone, MapPin, Upload,
  Loader2, CheckCircle, AlertCircle, Trash2, X, Hash, Briefcase, FileText, Navigation
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

function FormField({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1.5 animate-slideDown">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function SectionStep({ num, label }: { num: string | React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
        {typeof num === 'string' ? <span className="text-sm font-bold">{num}</span> : num}
      </div>
      <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{label}</h3>
      <div className="hidden sm:block h-px flex-1 opacity-30" style={{ background: 'var(--border)' }} />
    </div>
  );
}

export default function LeadForm({ onSuccess, syncConfig }: LeadFormProps) {
  const [submitting,        setSubmitting]        = React.useState(false);
  const [uploading,         setUploading]         = React.useState(false);
  const [toasts,            setToasts]            = React.useState<Toast[]>([]);
  const [uploadProgress,    setUploadProgress]    = React.useState(0);
  const [uploadedFileName,  setUploadedFileName]  = React.useState('');
  const [dragActive,        setDragActive]        = React.useState(false);
  const [errors,            setErrors]            = React.useState<Record<string, string>>({});

  const [leadNo,      setLeadNo]      = React.useState('');
  const [clientName,  setClientName]  = React.useState('');
  const [phone,       setPhone]       = React.useState('');
  const [kitchen,     setKitchen]     = React.useState('');
  const [wardrobe,    setWardrobe]    = React.useState('');
  const [otherWork,   setOtherWork]   = React.useState('');
  const [leadSource,  setLeadSource]  = React.useState('');
  const [salesPerson, setSalesPerson] = React.useState('');
  const [attachFileUrl, setAttachFileUrl] = React.useState('');
  const [gpsLocation, setGpsLocation] = React.useState('');

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
      planned1: '', actual1: '', delay1: '', designCopy: '', designStatus: 'Created', remarks1: '',
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

  const inputCls = (hasError?: boolean) =>
    `w-full h-11 px-4 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-900/10 focus:ring-rose-200 focus:border-rose-400'
        : 'focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 hover:border-slate-300 dark:hover:border-slate-500'
    } disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-slate-400 dark:placeholder:text-slate-500`;

  const selectCls = (hasError?: boolean) =>
    `w-full h-11 px-4 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-200 focus:border-rose-400'
        : 'focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 hover:border-slate-300 dark:hover:border-slate-500'
    } disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer`;

  const fieldStyle = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border)',
    color: 'var(--text)',
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Toast notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-3 w-full max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md animate-slideInRight ${
              t.type === 'success'
                ? 'border-emerald-200 dark:border-emerald-700'
                : 'border-rose-200 dark:border-rose-700'
            }`}
            style={{ background: 'var(--bg-card)' }}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              t.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'
            }`}>
              {t.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                : <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              }
            </div>
            <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{t.text}</p>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
              className="cursor-pointer p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{ color: 'var(--text-subtle)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-7">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-3 bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
          <Briefcase className="w-3.5 h-3.5" />
          NEW OPPORTUNITY
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Create New Lead</h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>Fill in the details below to add a new lead to your pipeline</p>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit}
        className="rounded-2xl border overflow-hidden shadow-lg"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

        <div className="p-6 sm:p-8 space-y-8">

          {/* Section 1: Lead Information */}
          <section>
            <SectionStep num="1" label="Lead Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Lead Number">
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                  <input type="text" value={leadNo} placeholder="e.g., LD-2409"
                    onChange={e => setLeadNo(e.target.value)}
                    className={`${inputCls()} pl-11`} style={fieldStyle} disabled={disabled} />
                </div>
              </FormField>

              <FormField label="Client Name" required error={errors.clientName}>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                  <input type="text" value={clientName} placeholder="Full name"
                    onChange={e => { setClientName(e.target.value); if (errors.clientName) setErrors(p => ({ ...p, clientName: '' })); }}
                    className={`${inputCls(!!errors.clientName)} pl-11`} style={errors.clientName ? {} : fieldStyle} disabled={disabled} />
                </div>
              </FormField>

              <FormField label="Phone Number" required error={errors.phone}>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                  <input type="tel" value={phone} placeholder="+91 98765 43210"
                    onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }}
                    className={`${inputCls(!!errors.phone)} pl-11`} style={errors.phone ? {} : fieldStyle} disabled={disabled} />
                </div>
              </FormField>

              <FormField label="GPS Location">
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                  <input type="text" value={gpsLocation} placeholder="28.6139, 77.2090"
                    onChange={e => setGpsLocation(e.target.value)}
                    className={`${inputCls()} pl-11`} style={fieldStyle} disabled={disabled} />
                </div>
              </FormField>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px" style={{ background: 'var(--border)' }} />

          {/* Section 2: Work Details */}
          <section>
            <SectionStep num="2" label="Work Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Kitchen Work">
                <div className="relative">
                  <select value={kitchen} onChange={e => setKitchen(e.target.value)}
                    className={`${selectCls()} pr-10`} style={fieldStyle} disabled={disabled}>
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

              <FormField label="Wardrobe Unit">
                <div className="relative">
                  <select value={wardrobe} onChange={e => setWardrobe(e.target.value)}
                    className={`${selectCls()} pr-10`} style={fieldStyle} disabled={disabled}>
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

              <div className="md:col-span-2">
                <FormField label="Other Scope">
                  <input type="text" value={otherWork} placeholder="e.g., TV Unit, False Ceiling, Custom Furniture"
                    onChange={e => setOtherWork(e.target.value)}
                    className={inputCls()} style={fieldStyle} disabled={disabled} />
                </FormField>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px" style={{ background: 'var(--border)' }} />

          {/* Section 3: Attribution */}
          <section>
            <SectionStep num="3" label="Attribution" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Lead Source">
                <div className="relative">
                  <select value={leadSource} onChange={e => setLeadSource(e.target.value)}
                    className={`${selectCls()} pr-10`} style={fieldStyle} disabled={disabled}>
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

              <FormField label="Sales Person">
                <div className="relative">
                  <select value={salesPerson} onChange={e => setSalesPerson(e.target.value)}
                    className={`${selectCls()} pr-10`} style={fieldStyle} disabled={disabled}>
                    <option value="">— Assign —</option>
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
          </section>

          {/* Divider */}
          <div className="h-px" style={{ background: 'var(--border)' }} />

          {/* Section 4: File attachment */}
          <section>
            <SectionStep num={<FileText className="w-4 h-4" />} label="Attachment" />
            <div
              onDragEnter={handleDrag} onDragOver={handleDrag}
              onDragLeave={handleDrag} onDrop={handleDrop}
              className={`relative rounded-2xl border-2 transition-all duration-300 ${
                dragActive
                  ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20 scale-[1.01]'
                  : attachFileUrl
                    ? 'border-emerald-300 dark:border-emerald-700'
                    : 'border-dashed hover:border-slate-400 dark:hover:border-slate-500'
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
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{uploadProgress}%</p>
                </div>
              ) : attachFileUrl ? (
                <div className="p-6 text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" /> File Uploaded
                  </div>
                  <p className="text-sm font-medium break-all" style={{ color: 'var(--text)' }}>{uploadedFileName}</p>
                  <button type="button" onClick={() => { setAttachFileUrl(''); setUploadedFileName(''); }}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-semibold cursor-pointer hover:text-rose-600 transition-colors bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg">
                    <Trash2 className="w-3 h-3" /> Remove File
                  </button>
                </div>
              ) : (
                <div className="p-10 text-center cursor-pointer group">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30"
                    style={{ background: 'var(--bg-elevated)' }}>
                    <Upload className="w-6 h-6 transition-colors" style={{ color: 'var(--text-subtle)' }} />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Drag & drop here, or <span className="text-emerald-600 dark:text-emerald-400 font-semibold">browse</span>
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-subtle)' }}>PDF, images, DWG, ZIP — up to 10 MB</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Form footer */}
        <div className="border-t px-6 sm:px-8 py-5 flex flex-col sm:flex-row justify-end gap-3"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
          <button type="button" onClick={resetForm} disabled={disabled}
            className="h-11 px-6 text-sm font-medium rounded-xl transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
            style={{ color: 'var(--text-muted)' }}>
            Reset Form
          </button>
          <button type="submit" disabled={disabled}
            className="h-11 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5">
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving Lead…</span></>
              : <><CheckCircle className="w-4 h-4" /><span>Save Lead</span></>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
