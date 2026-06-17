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
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
        {label}
        {required && <span className="text-red-400 text-sm leading-none">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ num, label, desc }: { num: number; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0 shadow-sm text-sm font-bold leading-none">
        {num}
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900 leading-tight">{label}</h3>
        <p className="text-xs mt-0.5 text-gray-500 leading-tight">{desc}</p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function LeadForm({ onSuccess, syncConfig }: LeadFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadedFileName, setUploadedFileName] = React.useState('');
  const [dragActive, setDragActive] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [leadNo, setLeadNo] = React.useState('');
  const [clientName, setClientName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [kitchen, setKitchen] = React.useState('');
  const [wardrobe, setWardrobe] = React.useState('');
  const [otherWork, setOtherWork] = React.useState('');
  const [leadSource, setLeadSource] = React.useState('');
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
    'w-full h-11 px-4 rounded-xl border border-gray-200 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-400 bg-white text-gray-900';

  const inputStyle = (hasError?: boolean) => ({
    borderColor: hasError ? '#ef4444' : '#e5e7eb',
  });

  return (
    <div className="animate-fade-in pb-10">

      {/* Toast notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-3 w-full max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-sm animate-slideInRight ${
              t.type === 'success' ? 'border-gray-200 bg-white' : 'border-red-200 bg-white'
            }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              t.type === 'success' ? 'bg-gray-100' : 'bg-red-100'
            }`}>
              {t.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-gray-700" />
                : <AlertCircle className="w-4 h-4 text-red-500" />}
            </div>
            <p className="flex-1 text-sm font-medium text-gray-900">{t.text}</p>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
              className="cursor-pointer p-0.5 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 bg-gray-100 text-gray-700 border border-gray-200">
            <Briefcase className="w-3.5 h-3.5" />
            NEW OPPORTUNITY
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create New Lead</h1>
          <p className="text-sm mt-1 text-gray-500">Fill in the details to add a lead to your pipeline</p>
        </div>
      </div>

      {/* Form layout */}
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">

            {/* Section 1 */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <SectionHeader num={1} label="Lead Information" desc="Basic contact and identification details" />
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Lead Number" hint="Auto-generated if left blank">
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={leadNo} placeholder="e.g., LD-2409"
                        onChange={e => setLeadNo(e.target.value)}
                        className={`${inputBase} pl-10`} disabled={disabled} />
                    </div>
                  </FormField>

                  <FormField label="Client Name" required error={errors.clientName}>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={clientName} placeholder="Full name"
                        onChange={e => { setClientName(e.target.value); if (errors.clientName) setErrors(p => ({ ...p, clientName: '' })); }}
                        className={`${inputBase} pl-10`} style={inputStyle(!!errors.clientName)} disabled={disabled} />
                    </div>
                  </FormField>

                  <FormField label="Phone Number" required error={errors.phone}>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="tel" value={phone} placeholder="+91 98765 43210"
                        onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }}
                        className={`${inputBase} pl-10`} style={inputStyle(!!errors.phone)} disabled={disabled} />
                    </div>
                  </FormField>

                  <FormField label="GPS Location" hint="Latitude, Longitude — optional">
                    <div className="relative">
                      <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={gpsLocation} placeholder="28.6139, 77.2090"
                        onChange={e => setGpsLocation(e.target.value)}
                        className={`${inputBase} pl-10`} disabled={disabled} />
                    </div>
                  </FormField>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <SectionHeader num={2} label="Work Details" desc="Scope of work — kitchen, wardrobe, and other" />
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Kitchen Type">
                    <div className="relative">
                      <select value={kitchen} onChange={e => setKitchen(e.target.value)}
                        className={`${inputBase} appearance-none pr-9`} disabled={disabled}>
                        <option value="">— Select Type —</option>
                        <option value="L-Shaped Modular Kitchen">L-Shaped Modular</option>
                        <option value="U-Shaped Modular Kitchen">U-Shaped Modular</option>
                        <option value="Parallel Kitchen Setup">Parallel Kitchen</option>
                        <option value="Straight Kitchen (Standard)">Straight Kitchen</option>
                        <option value="Island Luxury Layout">Island Luxury</option>
                        <option value="No Kitchen Work Involved">None</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </FormField>

                  <FormField label="Wardrobe Type">
                    <div className="relative">
                      <select value={wardrobe} onChange={e => setWardrobe(e.target.value)}
                        className={`${inputBase} appearance-none pr-9`} disabled={disabled}>
                        <option value="">— Select Type —</option>
                        <option value="2-Door Sliding Wardrobe">2-Door Sliding</option>
                        <option value="3-Door Sliding Wardrobe">3-Door Sliding</option>
                        <option value="Hinged Modular Wardrobe">Hinged Modular</option>
                        <option value="Walk-in Wardrobe Closet">Walk-in Closet</option>
                        <option value="No Wardrobe Layout">None</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Other Scope" hint="TV unit, false ceiling, custom furniture, etc.">
                      <input type="text" value={otherWork} placeholder="Describe any additional work…"
                        onChange={e => setOtherWork(e.target.value)}
                        className={inputBase} disabled={disabled} />
                    </FormField>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <SectionHeader num={3} label="Attribution" desc="Where did this lead come from and who owns it?" />
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Lead Source">
                    <div className="relative">
                      <select value={leadSource} onChange={e => setLeadSource(e.target.value)}
                        className={`${inputBase} appearance-none pr-9`} disabled={disabled}>
                        <option value="">— Select Source —</option>
                        <option value="Instagram Ad">Instagram Ad</option>
                        <option value="Facebook Campaign">Facebook Campaign</option>
                        <option value="Google Organic">Google Organic</option>
                        <option value="Store Walk-in">Store Walk-in</option>
                        <option value="Designer Referral">Designer Referral</option>
                        <option value="Reference Client">Reference Client</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </FormField>

                  <FormField label="Assigned Sales Person">
                    <div className="relative">
                      <select value={salesPerson} onChange={e => setSalesPerson(e.target.value)}
                        className={`${inputBase} appearance-none pr-9`} disabled={disabled}>
                        <option value="">— Assign to —</option>
                        <option value="Aman Gupta">Aman Gupta</option>
                        <option value="Kriti Sen">Kriti Sen</option>
                        <option value="Sonal Verma">Sonal Verma</option>
                        <option value="Rajdeep Das">Rajdeep Das</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </FormField>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <SectionHeader num={4} label="Attachment" desc="Upload a floor plan, image, or any relevant document" />
              </div>
              <div className="px-6 py-5">
                <div
                  onDragEnter={handleDrag} onDragOver={handleDrag}
                  onDragLeave={handleDrag} onDrop={handleDrop}
                  className={`relative rounded-2xl border-2 transition-all duration-300 ${
                    dragActive
                      ? 'border-gray-900 bg-gray-50 scale-[1.01]'
                      : attachFileUrl
                        ? 'border-gray-300'
                        : 'border-dashed border-gray-300'
                  } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <input type="file" id="file-upload" className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
                    disabled={uploading || disabled}
                    accept=".pdf,.jpg,.jpeg,.png,.dwg,.zip,.rar" />

                  {uploading ? (
                    <div className="p-8 text-center space-y-4">
                      <Loader2 className="w-10 h-10 animate-spin text-gray-700 mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Uploading to Drive…</p>
                        <p className="text-xs font-mono mt-1 text-gray-500">{uploadedFileName}</p>
                      </div>
                      <div className="w-full rounded-full h-2 overflow-hidden bg-gray-200">
                        <div className="bg-gray-900 h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs font-bold text-gray-700">{uploadProgress}%</p>
                    </div>
                  ) : attachFileUrl ? (
                    <div className="p-6 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <CheckCircle className="w-3.5 h-3.5 text-gray-700 shrink-0" />
                          <span className="text-xs font-bold text-gray-700">Uploaded successfully</span>
                        </div>
                        <p className="text-sm font-medium truncate text-gray-900">{uploadedFileName}</p>
                      </div>
                      <button type="button" onClick={() => { setAttachFileUrl(''); setUploadedFileName(''); }}
                        className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer shrink-0">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="p-10 text-center cursor-pointer group">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors group-hover:bg-gray-100 bg-gray-50">
                        <Upload className="w-6 h-6 text-gray-700 transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        Drag & drop or <span className="text-gray-900 font-bold">click to browse</span>
                      </p>
                      <p className="text-xs mt-1.5 text-gray-400">
                        PDF, images, DWG, ZIP — up to 10 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white shadow-sm">
              <p className="text-xs text-gray-500">
                <span className="text-red-400">*</span> Required fields must be completed before saving
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={resetForm} disabled={disabled}
                  className="h-10 px-5 text-sm font-semibold rounded-xl border border-gray-200 transition-all cursor-pointer hover:bg-gray-50 hover:shadow-sm disabled:opacity-40 bg-white text-gray-700">
                  Reset
                </button>
                <button type="submit" disabled={disabled}
                  className="h-10 px-7 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5 hover:shadow-md">
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