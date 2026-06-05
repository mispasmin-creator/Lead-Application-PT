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

function FormField({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="group">
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1.5 animate-slideDown">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

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
      const t = setTimeout(() => setToasts(p => p.slice(1)), 4000);
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
    setUploading(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);
    const tick = setInterval(() => setUploadProgress(p => Math.min(p + 10, 90)), 200);
    try {
      const url = await uploadFileToDrive(file, syncConfig);
      setAttachFileUrl(url);
      clearInterval(tick);
      setUploadProgress(100);
      addToast('success', `"${file.name}" uploaded successfully`);
    } catch (err: any) {
      clearInterval(tick);
      addToast('error', err.message || 'File upload failed');
      setUploadedFileName('');
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
      addToast('success', `Lead ${leadNo || 'created'} successfully`);
      setLeadNo('');
      setClientName(''); setPhone(''); setKitchen(''); setWardrobe('');
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

  const disabled = submitting || uploading;

  // Premium input styling
  const inputCls = (hasError?: boolean) =>
    `w-full h-11 px-4 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-rose-200 bg-rose-50/30 focus:ring-rose-200 focus:border-rose-300'
        : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-emerald-100 focus:border-emerald-400 hover:border-gray-300'
    } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 placeholder:text-gray-400`;

  const selectCls = (hasError?: boolean) =>
    `w-full h-11 px-4 rounded-xl border text-sm bg-gray-50/50 transition-all duration-200 focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-rose-200 focus:ring-rose-200 focus:border-rose-300'
        : 'border-gray-200 focus:ring-emerald-100 focus:border-emerald-400 hover:border-gray-300'
    } disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat pr-10`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 animate-fadeIn">
      {/* Premium Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-3 w-full max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transform transition-all duration-300 animate-slideInRight ${
              t.type === 'success' 
                ? 'bg-emerald-50/95 border-emerald-200/80' 
                : 'bg-rose-50/95 border-rose-200/80'
            }`}
          >
            {t.type === 'success'
              ? <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /></div>
              : <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5"><AlertCircle className="w-3.5 h-3.5 text-rose-500" /></div>
            }
            <p className="flex-1 text-sm font-medium text-gray-800">{t.text}</p>
            <button
              onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer rounded-full p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Elegant Header Section */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wide mb-3">
          <Briefcase className="w-3.5 h-3.5" />
          NEW OPPORTUNITY
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Create New Lead
        </h1>
        <p className="text-gray-500 mt-2 text-sm">Fill in the details below to add a new lead to your pipeline</p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          {/* Lead Information Section */}
          <section className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <span className="text-sm font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Lead Information</h3>
              <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Lead Number">
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={leadNo}
                    placeholder="e.g., LD-2409"
                    onChange={e => setLeadNo(e.target.value)}
                    className={`${inputCls()} pl-11`}
                    disabled={disabled}
                  />
                </div>
              </FormField>

              <FormField label="Client Name" required error={errors.clientName}>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={clientName}
                    placeholder="Full name"
                    onChange={e => { setClientName(e.target.value); if (errors.clientName) setErrors(p => ({ ...p, clientName: '' })); }}
                    className={`${inputCls(!!errors.clientName)} pl-11`}
                    disabled={disabled}
                  />
                </div>
              </FormField>

              <FormField label="Phone Number" required error={errors.phone}>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    placeholder="+91 98765 43210"
                    onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }}
                    className={`${inputCls(!!errors.phone)} pl-11`}
                    disabled={disabled}
                  />
                </div>
              </FormField>

              <FormField label="GPS Location">
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={gpsLocation}
                    placeholder="28.6139, 77.2090"
                    onChange={e => setGpsLocation(e.target.value)}
                    className={`${inputCls()} pl-11`}
                    disabled={disabled}
                  />
                </div>
              </FormField>
            </div>
          </section>

          {/* Work Details Section */}
          <section className="relative pt-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <span className="text-sm font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Work Details</h3>
              <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Kitchen Work">
                <select value={kitchen} onChange={e => setKitchen(e.target.value)} className={selectCls()} disabled={disabled}>
                  <option value="">-- Select Type --</option>
                  <option value="L-Shaped Modular Kitchen">L-Shaped Modular</option>
                  <option value="U-Shaped Modular Kitchen">U-Shaped Modular</option>
                  <option value="Parallel Kitchen Setup">Parallel Kitchen</option>
                  <option value="Straight Kitchen (Standard)">Straight Kitchen</option>
                  <option value="Island Luxury Layout">Island Luxury</option>
                  <option value="No Kitchen Work Involved">None</option>
                </select>
              </FormField>

              <FormField label="Wardrobe Unit">
                <select value={wardrobe} onChange={e => setWardrobe(e.target.value)} className={selectCls()} disabled={disabled}>
                  <option value="">-- Select Type --</option>
                  <option value="2-Door Sliding Wardrobe">2-Door Sliding</option>
                  <option value="3-Door Sliding Wardrobe">3-Door Sliding</option>
                  <option value="Hinged Modular Wardrobe">Hinged Modular</option>
                  <option value="Walk-in Wardrobe Closet">Walk-in Closet</option>
                  <option value="No Wardrobe Layout">None</option>
                </select>
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Other Scope">
                  <input
                    type="text"
                    value={otherWork}
                    placeholder="e.g., TV Unit, False Ceiling, Custom Furniture"
                    onChange={e => setOtherWork(e.target.value)}
                    className={inputCls()}
                    disabled={disabled}
                  />
                </FormField>
              </div>
            </div>
          </section>

          {/* Attribution Section */}
          <section className="relative pt-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <span className="text-sm font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Attribution</h3>
              <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Lead Source">
                <select value={leadSource} onChange={e => setLeadSource(e.target.value)} className={selectCls()} disabled={disabled}>
                  <option value="">-- Select Source --</option>
                  <option value="Instagram Ad">Instagram Ad</option>
                  <option value="Facebook Campaign">Facebook Campaign</option>
                  <option value="Google Organic">Google Organic</option>
                  <option value="Store Walk-in">Store Walk-in</option>
                  <option value="Designer Referral">Designer Referral</option>
                  <option value="Reference Client">Reference Client</option>
                </select>
              </FormField>

              <FormField label="Sales Person">
                <select value={salesPerson} onChange={e => setSalesPerson(e.target.value)} className={selectCls()} disabled={disabled}>
                  <option value="">-- Assign --</option>
                  <option value="Aman Gupta">Aman Gupta</option>
                  <option value="Kriti Sen">Kriti Sen</option>
                  <option value="Sonal Verma">Sonal Verma</option>
                  <option value="Rajdeep Das">Rajdeep Das</option>
                </select>
              </FormField>
            </div>
          </section>

          {/* File Attachment Section */}
          <section className="relative pt-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Attachment</h3>
              <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 transition-all duration-300 ${
                dragActive
                  ? 'border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-100/50 scale-[1.01]'
                  : attachFileUrl
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-dashed border-gray-300 bg-gray-50/40 hover:bg-gray-50 hover:border-gray-400'
              } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <input
                type="file"
                id="file-upload"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
                disabled={uploading || disabled}
                accept=".pdf,.jpg,.jpeg,.png,.dwg,.zip,.rar"
              />

              {uploading ? (
                <div className="p-8 text-center space-y-4">
                  <div className="relative w-14 h-14 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                    <Loader2 className="w-14 h-14 animate-spin text-emerald-600 absolute inset-0" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Uploading to Drive...</p>
                    <p className="text-xs text-gray-500 font-mono">{uploadedFileName}</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium text-emerald-600">{uploadProgress}%</p>
                </div>
              ) : attachFileUrl ? (
                <div className="p-6 text-center space-y-3">
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    File Securely Uploaded
                  </div>
                  <p className="text-sm text-gray-700 font-medium break-all">{uploadedFileName}</p>
                  <button
                    type="button"
                    onClick={() => { setAttachFileUrl(''); setUploadedFileName(''); }}
                    className="inline-flex items-center gap-2 text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors cursor-pointer bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="p-10 text-center cursor-pointer group">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 group-hover:bg-emerald-100 transition-colors duration-300 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-7 h-7 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Drag & drop your file here, or{' '}
                    <span className="text-emerald-600 font-semibold hover:underline">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">PDF, images, DWG, ZIP — up to 10 MB</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Form Actions */}
        <div className="bg-gray-50/80 border-t border-gray-100 px-6 sm:px-8 py-5 flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-200 hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving Lead...</span></>
              : <><CheckCircle className="w-4 h-4" /><span>Save Lead</span></>
            }
          </button>
          <button
            type="button"
            onClick={() => {
              setLeadNo(''); setClientName(''); setPhone(''); setKitchen(''); setWardrobe('');
              setOtherWork(''); setLeadSource(''); setSalesPerson('');
              setAttachFileUrl(''); setGpsLocation(''); setUploadedFileName('');
              setErrors({});
            }}
            className="h-12 px-6 text-gray-500 hover:text-gray-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
}

// Add these keyframe animations to your global CSS or Tailwind config
// For completeness, include style tag or note. But since Tailwind might not have these, we add them via className.
// In a real project, add to global CSS:
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.4s ease-out; }
.animate-slideInRight { animation: slideInRight 0.3s ease-out; }
.animate-slideDown { animation: slideDown 0.2s ease-out; }
*/