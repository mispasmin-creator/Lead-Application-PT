import React from 'react';
import { Users, Search, Trash2, Phone, AlertTriangle, MapPin } from 'lucide-react';
import { Lead, SyncConfig } from '../types';

interface ClientDirectoryProps {
  leads: Lead[];
  onDelete: (leadNo: string) => Promise<void>;
  syncConfig: SyncConfig;
}

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
    setDeletingLead(leadNo);
    setModalOpen(true);
    setErrorText(null);
  };

  const executeDelete = async () => {
    if (!deletingLead) return;
    setLoading(true);
    try {
      await onDelete(deletingLead);
      setModalOpen(false);
      setDeletingLead(null);
    } catch (err: any) {
      setErrorText(err.message || 'Delete failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (lead: Lead) => {
    let done = 0;
    for (let i = 1; i <= 5; i++) { if (lead[`actual${i}` as keyof Lead]) done++; }
    return done;
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} total clients in your system</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text" placeholder="Search clients…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
          />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-400">No clients found</p>
          <p className="text-xs text-gray-300 mt-0.5">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(lead => {
            const done = getProgress(lead);
            return (
              <div key={lead.leadNo} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col hover:border-green-300 hover:shadow-sm transition-all">

                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-semibold">
                    {lead.leadNo}
                  </span>
                  <button
                    onClick={() => confirmDelete(lead.leadNo)}
                    className="w-7 h-7 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete lead"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Name */}
                <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 line-clamp-1">{lead.clientName}</h3>

                {/* Phone */}
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-sm text-gray-500 mb-1 hover:text-green-600 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    {lead.phone}
                  </a>
                )}

                {/* GPS */}
                {lead.gpsLocation && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 truncate">
                    <MapPin className="w-3 h-3 shrink-0 text-gray-300" />
                    <span className="truncate">{lead.gpsLocation}</span>
                  </div>
                )}

                {/* Scope */}
                <div className="text-xs text-gray-500 space-y-0.5 mt-auto">
                  {lead.kitchen  && <p><span className="font-medium text-gray-700">Kitchen:</span> {lead.kitchen.substring(0,30)}{lead.kitchen.length > 30 ? '…' : ''}</p>}
                  {lead.wardrobe && <p><span className="font-medium text-gray-700">Wardrobe:</span> {lead.wardrobe.substring(0,30)}{lead.wardrobe.length > 30 ? '…' : ''}</p>}
                  {!lead.kitchen && !lead.wardrobe && <p className="text-gray-300">No scope defined</p>}
                </div>

                {/* Progress */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400">{lead.salesPerson || 'Unassigned'}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      done === 5 ? 'bg-green-50 text-green-700' :
                      done > 0   ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'
                    }`}>{done}/5 steps</span>
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(idx => (
                      <div key={idx}
                        className={`h-1.5 flex-1 rounded-full ${
                          !!lead[`actual${idx}` as keyof Lead]  ? 'bg-green-500' :
                          !!lead[`planned${idx}` as keyof Lead] ? 'bg-amber-400' : 'bg-gray-100'
                        }`}
                        title={`Step ${idx}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-300 mt-1.5 font-mono">{lead.timestamp?.split(' ')[0]}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25">
          <div className="relative w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-xl p-5">

            <div className="flex items-center gap-2 text-red-600 mb-4 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <h3 className="font-semibold text-sm">Delete Client Record</h3>
            </div>

            <p className="text-sm text-gray-700 mb-2">
              Are you sure you want to delete lead <strong className="font-mono text-red-600 bg-red-50 px-1 rounded">{deletingLead}</strong>?
            </p>
            <p className="text-xs text-gray-400 mb-4">
              {syncConfig.mode === 'live'
                ? 'This will permanently remove the row from your Google Sheet.'
                : 'This will remove the record from local storage.'
              }
            </p>

            {errorText && (
              <p className="mb-3 px-3 py-2 rounded-lg text-xs font-medium text-red-700 bg-red-50 border border-red-200">{errorText}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button type="button" disabled={loading} onClick={() => setModalOpen(false)}
                className="h-8 px-4 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-colors cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={loading} onClick={executeDelete}
                className="h-8 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
