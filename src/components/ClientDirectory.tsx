import React from 'react';
import ReactDOM from 'react-dom';
import {
  Users, Search, Trash2, Phone, AlertTriangle, MapPin,
  TrendingUp, CheckCircle2, Clock,
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
  if (done === 5) return { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Complete', icon: <CheckCircle2 className="w-3 h-3" /> };
  if (done > 0)  return { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         label: 'Active',   icon: <TrendingUp className="w-3 h-3" /> };
  return                 { cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',         label: 'Pending',  icon: <Clock className="w-3 h-3" /> };
}

const STEP_COLORS = ['from-purple-500', 'from-cyan-500', 'from-amber-500', 'from-rose-500', 'from-emerald-500'];

export default function ClientDirectory({ leads, onDelete, syncConfig }: ClientDirectoryProps) {
  const [search,       setSearch]       = React.useState('');
  const [deletingLead, setDeletingLead] = React.useState<string | null>(null);
  const [modalOpen,    setModalOpen]    = React.useState(false);
  const [errorText,    setErrorText]    = React.useState<string | null>(null);
  const [loading,      setLoading]      = React.useState(false);

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
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Clients</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {leads.length} total client{leads.length !== 1 ? 's' : ''} in your system
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
          <input type="text" placeholder="Search clients…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }} />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border p-14 text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--bg-elevated)' }}>
            <Users className="w-8 h-8" style={{ color: 'var(--text-subtle)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No clients found</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(lead => {
            const done = getProgress(lead);
            const status = getStatusStyle(done);
            return (
              <div key={lead.leadNo}
                className="rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

                {/* Gradient top bar */}
                <div className={`h-1.5 bg-gradient-to-r ${STEP_COLORS[Math.min(done, 4)]} to-teal-500 transition-all`}
                  style={{ width: `${done === 0 ? 5 : (done / 5) * 100}%` }} />

                <div className="p-4 flex-1 flex flex-col">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-xs px-2 py-1 rounded-lg font-semibold"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      {lead.leadNo}
                    </span>
                    <button onClick={() => confirmDelete(lead.leadNo)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400 hover:text-rose-600"
                      title="Delete client">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Name & status */}
                  <h3 className="font-bold text-base leading-snug mb-1 line-clamp-1" style={{ color: 'var(--text)' }}>
                    {lead.clientName}
                  </h3>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit mb-3 ${status.cls}`}>
                    {status.icon} {status.label}
                  </span>

                  {/* Contact */}
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`}
                      className="flex items-center gap-1.5 text-sm mb-1.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                      style={{ color: 'var(--text-muted)' }}>
                      <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-subtle)' }} />
                      {lead.phone}
                    </a>
                  )}

                  {lead.gpsLocation && (
                    <div className="flex items-center gap-1.5 text-xs mb-2 truncate" style={{ color: 'var(--text-subtle)' }}>
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{lead.gpsLocation}</span>
                    </div>
                  )}

                  {/* Scope */}
                  <div className="text-xs space-y-1 mt-auto mb-3" style={{ color: 'var(--text-muted)' }}>
                    {lead.kitchen  && <p><span className="font-semibold" style={{ color: 'var(--text)' }}>Kitchen:</span> {lead.kitchen.substring(0,28)}{lead.kitchen.length > 28 ? '…' : ''}</p>}
                    {lead.wardrobe && <p><span className="font-semibold" style={{ color: 'var(--text)' }}>Wardrobe:</span> {lead.wardrobe.substring(0,26)}{lead.wardrobe.length > 26 ? '…' : ''}</p>}
                    {!lead.kitchen && !lead.wardrobe && <p style={{ color: 'var(--text-subtle)' }}>No scope defined</p>}
                  </div>

                  {/* Progress */}
                  <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{lead.salesPerson || 'Unassigned'}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{done}/5 steps</span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(idx => (
                        <div key={idx}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                            !!lead[`actual${idx}` as keyof Lead]  ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                            !!lead[`planned${idx}` as keyof Lead] ? 'bg-amber-400' : ''
                          }`}
                          style={!lead[`actual${idx}` as keyof Lead] && !lead[`planned${idx}` as keyof Lead] ? { background: 'var(--bg-elevated)' } : {}}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-mono mt-2" style={{ color: 'var(--text-subtle)' }}>
                      {lead.timestamp?.split(' ')[0]}
                    </p>
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
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "16px",
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden modal-content"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}>

            <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Delete Client Record</h3>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Are you sure you want to delete lead <strong className="font-mono text-rose-500 px-1 rounded">{deletingLead}</strong>?
              </p>
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                {syncConfig.mode === 'live'
                  ? 'This will permanently remove the row from your Google Sheet.'
                  : 'This will remove the record from local storage.'}
              </p>

              {errorText && (
                <p className="px-3 py-2.5 rounded-xl text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700">
                  {errorText}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" disabled={loading} onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                  Cancel
                </button>
                <button type="button" disabled={loading} onClick={executeDelete}
                  className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
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
