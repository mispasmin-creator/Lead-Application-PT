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
  1: { cls: 'bg-gray-100 text-gray-700 border-gray-200', color: '#6b7280' },
  2: { cls: 'bg-gray-100 text-gray-700 border-gray-200', color: '#6b7280' },
  3: { cls: 'bg-gray-100 text-gray-700 border-gray-200', color: '#6b7280' },
  4: { cls: 'bg-gray-100 text-gray-700 border-gray-200', color: '#6b7280' },
  5: { cls: 'bg-gray-100 text-gray-700 border-gray-200', color: '#6b7280' },
};

const STEP_NAMES: Record<ActiveStepId, string> = {
  1: '2D Design', 2: 'RFQ Completed', 3: 'Quotation', 4: 'Request 3D', 5: '3D Design',
};

export default function HistoryLog({ leads }: HistoryLogProps) {
  const [search, setSearch] = React.useState('');
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

  const completedLeads = leads.filter(l => !!l.actual5).length;
  const pendingInFlight = leads.filter(l => [1,2,3,4,5].some(i => l[`planned${i}` as keyof Lead] && !l[`actual${i}` as keyof Lead])).length;

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Activity Log</h1>
        <p className="text-sm mt-1 text-gray-500">Completed milestones sorted by completion date</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Activity, label: 'Total Milestones', value: logEntries.length, bg: 'bg-gray-50', iconColor: 'text-gray-700' },
          { icon: CheckCircle2, label: 'Fully Completed', value: completedLeads, bg: 'bg-gray-50', iconColor: 'text-gray-700' },
          { icon: Hourglass, label: 'Pending In-Flight', value: pendingInFlight, bg: 'bg-gray-50', iconColor: 'text-gray-700' },
        ].map(({ icon: Icon, label, value, bg, iconColor }) => (
          <div key={label} className="rounded-2xl border border-gray-200 p-5 flex items-center gap-4 transition-all hover:shadow-md bg-white">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className="text-2xl font-bold mt-0.5 text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 bg-white shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by client, lead no, or remarks…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white text-gray-900 placeholder:text-gray-400" />
        </div>
        <div className="relative flex items-center shrink-0">
          <Filter className="absolute left-3 w-4 h-4 pointer-events-none text-gray-400" />
          <select value={selectedStep} onChange={e => setSelectedStep(e.target.value)}
            className="h-10 pl-10 pr-8 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 appearance-none cursor-pointer bg-white text-gray-900">
            <option value="all">All Steps</option>
            <option value="1">S1: 2D Design</option>
            <option value="2">S2: RFQ</option>
            <option value="3">S3: Quotation</option>
            <option value="4">S4: Request 3D</option>
            <option value="5">S5: 3D Design</option>
          </select>
        </div>
      </div>

      {/* Log table */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gray-50">
              <Clock className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No records found</p>
            <p className="text-xs mt-1 text-gray-400">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '640px' }}>
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-gray-500 w-24 whitespace-nowrap">Lead #</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-gray-500 w-32 whitespace-nowrap">Step</th>
                  <th className="px-5 py-3.5 text-left   text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Client</th>
                  <th className="px-5 py-3.5 text-left   text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Status / Remarks</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-gray-500 w-36 whitespace-nowrap">Completed On</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-gray-500 w-24 whitespace-nowrap">Doc</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, index) => {
                  const badge = STEP_BADGE[entry.stepId];
                  return (
                    <tr key={`${entry.leadNo}-${entry.stepId}-${index}`}
                      className={`border-b border-gray-100 transition-colors hover:bg-gray-50/50 ${index % 2 !== 0 ? 'bg-gray-50/20' : 'bg-white'}`}>

                      <td className="px-5 py-3.5 text-center">
                        <span className="font-mono text-xs px-2 py-1 rounded-lg font-bold bg-gray-100 text-gray-600 whitespace-nowrap">
                          {entry.leadNo}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${badge.cls}`}>
                          {STEP_NAMES[entry.stepId]}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-sm text-gray-900 truncate max-w-[160px]">{entry.clientName}</p>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <CheckCircle2 className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">{entry.statusText}</span>
                        </div>
                        {entry.remarks && (
                          <p className="text-xs text-gray-400 truncate max-w-[240px]">{entry.remarks}</p>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="font-mono font-semibold text-gray-700 whitespace-nowrap">{entry.actualTime}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {entry.docLink ? (
                          <a href={entry.docLink} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                            <ExternalLink className="w-3 h-3" /> View
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}