import React from 'react';
import {
  Search, Calendar, ExternalLink, CheckCircle2,
  Hourglass, Clock, Filter, Activity
} from 'lucide-react';
import { Lead, ActiveStepId } from '../types';

interface HistoryLogProps {
  leads: Lead[];
}

interface LogEntry {
  leadNo: string;
  clientName: string;
  stepId: ActiveStepId;
  stepName: string;
  actualTime: string;
  docLink: string;
  statusText: string;
  remarks: string;
}

const STEP_BADGE: Record<ActiveStepId, { cls: string; color: string }> = {
  1: { cls: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',    color: '#a855f7' },
  2: { cls: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700',               color: '#06b6d4' },
  3: { cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',          color: '#f59e0b' },
  4: { cls: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700',                color: '#f43f5e' },
  5: { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700', color: '#10b981' },
};

const STEP_NAMES: Record<ActiveStepId, string> = {
  1: '2D Design', 2: 'RFQ Completed', 3: 'Quotation', 4: 'Request 3D', 5: '3D Design',
};

export default function HistoryLog({ leads }: HistoryLogProps) {
  const [search,       setSearch]       = React.useState('');
  const [selectedStep, setSelectedStep] = React.useState<string>('all');

  const logEntries: LogEntry[] = React.useMemo(() => {
    const list: LogEntry[] = [];
    leads.forEach(lead => {
      if (lead.actual1) list.push({ leadNo: lead.leadNo, clientName: lead.clientName, stepId: 1, stepName: '2D Design', actualTime: lead.actual1, docLink: lead.designCopy, statusText: lead.designStatus || 'Completed', remarks: lead.remarks1 || '' });
      if (lead.actual2) list.push({ leadNo: lead.leadNo, clientName: lead.clientName, stepId: 2, stepName: 'RFQ Completed', actualTime: lead.actual2, docLink: '', statusText: lead.clientStatus1 || 'Completed', remarks: `Response: ${lead.clientResponse1 || '-'}${lead.remarks2 ? ' | ' + lead.remarks2 : ''}` });
      if (lead.actual3) list.push({ leadNo: lead.leadNo, clientName: lead.clientName, stepId: 3, stepName: 'Quotation', actualTime: lead.actual3, docLink: lead.quotCopy, statusText: lead.quotAmount ? `₹${lead.quotAmount}` : 'Completed', remarks: 'Quotation sent to client.' });
      if (lead.actual4) list.push({ leadNo: lead.leadNo, clientName: lead.clientName, stepId: 4, stepName: 'Request 3D', actualTime: lead.actual4, docLink: '', statusText: lead.clientStatus2 || 'Completed', remarks: `Response: ${lead.clientResponse2 || '-'}${lead.remarks3 ? ' | ' + lead.remarks3 : ''}` });
      if (lead.actual5) list.push({ leadNo: lead.leadNo, clientName: lead.clientName, stepId: 5, stepName: '3D Design', actualTime: lead.actual5, docLink: lead.threeDDesignCopy, statusText: lead.threeDStatus || 'Completed', remarks: lead.remarks4 || '' });
    });
    return list.sort((a, b) => new Date(b.actualTime).getTime() - new Date(a.actualTime).getTime());
  }, [leads]);

  const filtered = React.useMemo(() => logEntries.filter(e => {
    const matchSearch =
      e.clientName.toLowerCase().includes(search.toLowerCase()) ||
      e.leadNo.toLowerCase().includes(search.toLowerCase()) ||
      e.remarks.toLowerCase().includes(search.toLowerCase());
    const matchStep = selectedStep === 'all' || e.stepId.toString() === selectedStep;
    return matchSearch && matchStep;
  }), [logEntries, search, selectedStep]);

  const completedLeads  = leads.filter(l => !!l.actual5).length;
  const pendingInFlight = leads.filter(l => [1,2,3,4,5].some(i => l[`planned${i}` as keyof Lead] && !l[`actual${i}` as keyof Lead])).length;

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Activity Log</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Completed milestones sorted by completion date</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Activity,      label: 'Total Milestones',  value: logEntries.length, bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { icon: CheckCircle2,  label: 'Fully Completed',   value: completedLeads,    bg: 'bg-indigo-50 dark:bg-indigo-900/20',   iconColor: 'text-indigo-600 dark:text-indigo-400' },
          { icon: Hourglass,     label: 'Pending In-Flight', value: pendingInFlight,   bg: 'bg-amber-50 dark:bg-amber-900/20',     iconColor: 'text-amber-600 dark:text-amber-400' },
        ].map(({ icon: Icon, label, value, bg, iconColor }) => (
          <div key={label} className="rounded-2xl border p-5 flex items-center gap-4 transition-all hover:shadow-md"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>{label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border p-4 flex flex-col sm:flex-row gap-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
          <input type="text" placeholder="Search by client, lead no, or remarks…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 transition-all"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' }} />
        </div>
        <div className="relative flex items-center shrink-0">
          <Filter className="absolute left-3 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
          <select value={selectedStep} onChange={e => setSelectedStep(e.target.value)}
            className="h-10 pl-10 pr-8 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 appearance-none cursor-pointer"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            <option value="all">All Steps</option>
            <option value="1">S1: 2D Design</option>
            <option value="2">S2: RFQ</option>
            <option value="3">S3: Quotation</option>
            <option value="4">S4: Request 3D</option>
            <option value="5">S5: 3D Design</option>
          </select>
        </div>
      </div>

      {/* Log list */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-elevated)' }}>
              <Clock className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No records found</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Try adjusting your search or filter</p>
          </div>
        ) : (
          <div>
            {filtered.map((entry, index) => {
              const badge = STEP_BADGE[entry.stepId];
              return (
                <div key={`${entry.leadNo}-${entry.stepId}-${index}`}
                  className="px-5 py-4 flex flex-col md:flex-row md:items-start gap-4 border-b transition-colors hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10"
                  style={{ borderColor: 'var(--border-subtle)' }}>

                  {/* Timeline dot */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex flex-col items-center mt-1 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-2" style={{ background: badge.color, ringColor: badge.color + '33', ringOffsetColor: 'var(--bg-card)' }} />
                      {index < filtered.length - 1 && <div className="w-px flex-1 min-h-[24px] mt-1.5" style={{ background: 'var(--border)' }} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-lg font-semibold"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                          {entry.leadNo}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                          {STEP_NAMES[entry.stepId]}
                        </span>
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {entry.statusText}
                        </span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{entry.clientName}</p>
                      {entry.remarks && (
                        <p className="text-xs mt-1 truncate max-w-lg" style={{ color: 'var(--text-muted)' }}>{entry.remarks}</p>
                      )}
                      {entry.docLink && (
                        <a href={entry.docLink} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium mt-1.5 transition-colors">
                          <ExternalLink className="w-3 h-3" /> View attachment
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="md:text-right shrink-0 md:ml-4 pl-6 md:pl-0">
                    <div className="flex items-center md:justify-end gap-1 text-xs" style={{ color: 'var(--text-subtle)' }}>
                      <Calendar className="w-3 h-3" />
                      <span>Completed</span>
                    </div>
                    <p className="text-xs font-mono font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{entry.actualTime}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
