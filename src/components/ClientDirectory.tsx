import React from 'react';
import ReactDOM from 'react-dom';
import {
  Users, Search, Trash2, Phone, AlertTriangle, MapPin,
  TrendingUp, CheckCircle2, Clock, User, Briefcase, Calendar
} from 'lucide-react';
import { Lead, SyncConfig } from '../types';

interface ClientDirectoryProps {
  leads: Lead[];
  onDelete: (leadNo: string) => Promise<void>;
  syncConfig: SyncConfig;
}

function getProgress(lead: Lead) {
  let done = 0;
  for (let i = 1; i <= 5; i++) { if (lead[`actual${i}` as keyof Lead]) done++; }
  return done;
}

function getStatusStyle(done: number) {
  if (done === 5) return { cls: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Complete', icon: <CheckCircle2 className="w-3 h-3" /> };
  if (done > 0)  return { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Active', icon: <TrendingUp className="w-3 h-3" /> };
  return { cls: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Pending', icon: <Clock className="w-3 h-3" /> };
}

const STEP_COLORS = ['from-gray-600', 'from-gray-600', 'from-gray-600', 'from-gray-600', 'from-gray-600'];

export default function ClientDirectory({ leads, onDelete, syncConfig }: ClientDirectoryProps) {
  const [search, setSearch] = React.useState('');
  const [deletingLead, setDeletingLead] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const filtered = React.useMemo(() =>
    leads.filter(l =>
      l.clientName.toLowerCase().includes(search.toLowerCase()) ||
      l.leadNo.toLowerCase().includes(search.toLowerCase()) ||
      l.salesPerson?.toLowerCase().includes(search.toLowerCase())
    ), [leads, search]);

  const confirmDelete = (leadNo: string) => {
    setDeletingLead(leadNo); setModalOpen(true); setErrorText(null);
  };

  const executeDelete = async () => {
    if (!deletingLead) return;
    setLoading(true);
    try {
      await onDelete(deletingLead);
      setModalOpen(false); setDeletingLead(null);
    } catch (err: any) {
      setErrorText(err.message || 'Delete failed. Check your connection.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Clients</h1>
          <p className="text-sm mt-1 text-gray-500">
            {leads.length} total client{leads.length !== 1 ? 's' : ''} in your system
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search clients…" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Clients',   value: leads.length,                                                      color: 'text-gray-900' },
          { label: 'Completed',       value: leads.filter(l => getProgress(l) === 5).length,                    color: 'text-emerald-600' },
          { label: 'Active',          value: leads.filter(l => getProgress(l) > 0 && getProgress(l) < 5).length, color: 'text-amber-600' },
          { label: 'Pending',         value: leads.filter(l => getProgress(l) === 0).length,                    color: 'text-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 p-14 text-center bg-white shadow-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gray-50">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">No clients found</p>
          <p className="text-xs mt-1 text-gray-400">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(lead => {
            const done = getProgress(lead);
            const status = getStatusStyle(done);
            return (
              <div key={lead.leadNo}
                className="rounded-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group bg-white shadow-sm">

                {/* Gradient top bar */}
                <div className={`h-1 bg-gradient-to-r ${STEP_COLORS[Math.min(done, 4)]} to-gray-700 transition-all`}
                  style={{ width: `${done === 0 ? 5 : (done / 5) * 100}%` }} />

                <div className="p-4 flex-1 flex flex-col">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-[10px] px-2.5 py-1 rounded-lg font-bold bg-gray-100 text-gray-600">
                      {lead.leadNo}
                    </span>
                    <button onClick={() => confirmDelete(lead.leadNo)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-600"
                      title="Delete client">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Name & status */}
                  <h3 className="font-bold text-base leading-snug mb-1.5 line-clamp-1 text-gray-900">
                    {lead.clientName}
                  </h3>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full w-fit mb-3 border ${status.cls}`}>
                    {status.icon} {status.label}
                  </span>

                  {/* Contact */}
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`}
                      className="flex items-center gap-2 text-sm mb-1.5 transition-colors hover:text-gray-900 text-gray-600">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span>{lead.phone}</span>
                    </a>
                  )}

                  {lead.gpsLocation && (
                    <div className="flex items-center gap-2 text-xs mb-2 truncate text-gray-500">
                      <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                      <span className="truncate">{lead.gpsLocation}</span>
                    </div>
                  )}

                  {/* Scope */}
                  <div className="text-xs space-y-1 mt-auto mb-3 text-gray-600">
                    {lead.kitchen && (
                      <p className="flex items-start gap-1.5">
                        <span className="font-bold text-gray-700 shrink-0">Kitchen:</span>
                        <span className="truncate">{lead.kitchen.substring(0,28)}{lead.kitchen.length > 28 ? '…' : ''}</span>
                      </p>
                    )}
                    {lead.wardrobe && (
                      <p className="flex items-start gap-1.5">
                        <span className="font-bold text-gray-700 shrink-0">Wardrobe:</span>
                        <span className="truncate">{lead.wardrobe.substring(0,26)}{lead.wardrobe.length > 26 ? '…' : ''}</span>
                      </p>
                    )}
                    {!lead.kitchen && !lead.wardrobe && (
                      <p className="text-gray-400 italic">No scope defined</p>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        {lead.salesPerson || 'Unassigned'}
                      </span>
                      <span className="text-xs font-bold text-gray-600">{done}/5 steps</span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(idx => (
                        <div key={idx}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                            !!lead[`actual${idx}` as keyof Lead] ? 'bg-gray-900' :
                            !!lead[`planned${idx}` as keyof Lead] ? 'bg-gray-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] font-mono text-gray-400">
                        {lead.timestamp?.split(' ')[0] || 'No date'}
                      </p>
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] text-gray-400">{lead.leadSource || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      {modalOpen && ReactDOM.createPortal(
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
        >
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 shadow-2xl overflow-hidden bg-white">

            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50/50">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">Delete Client Record</h3>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete lead <strong className="font-mono text-red-600 px-1.5 py-0.5 rounded bg-red-50">{deletingLead}</strong>?
              </p>
              <p className="text-xs text-gray-400">
                {syncConfig.mode === 'live'
                  ? 'This will permanently remove the row from your Google Sheet.'
                  : 'This will remove the record from local storage.'}
              </p>

              {errorText && (
                <p className="px-3 py-2.5 rounded-xl text-xs font-medium text-red-700 bg-red-50 border border-red-200">
                  {errorText}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  disabled={loading} 
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  disabled={loading} 
                  onClick={executeDelete}
                  className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm hover:shadow-md"
                >
                  {loading ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}