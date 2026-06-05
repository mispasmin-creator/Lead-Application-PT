import React from 'react';
import {
  Search, Calendar, ExternalLink, CheckCircle2,
  Hourglass, Clock, Filter
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

const STEP_BADGE: Record<ActiveStepId, string> = {
  1: 'bg-purple-50 text-purple-700 border-purple-200',
  2: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  3: 'bg-amber-50 text-amber-700 border-amber-200',
  4: 'bg-rose-50 text-rose-700 border-rose-200',
  5: 'bg-green-50 text-green-700 border-green-200',
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

  const completedLeads  = leads.filter(l => !!l.actual5).length;
  const pendingInFlight = leads.filter(l => [1,2,3,4,5].some(i => l[`planned${i}` as keyof Lead] && !l[`actual${i}` as keyof Lead])).length;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Completed milestones sorted by completion date</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: CheckCircle2, label: 'Total Milestones', value: logEntries.length, color: 'text-green-600 bg-green-50' },
          { icon: CheckCircle2, label: 'Fully Completed',  value: completedLeads,    color: 'text-blue-600 bg-blue-50' },
          { icon: Hourglass,    label: 'Pending In-Flight', value: pendingInFlight,   color: 'text-amber-600 bg-amber-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text" placeholder="Search by client, lead no, or remarks…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
          />
        </div>
        <div className="relative flex items-center shrink-0">
          <Filter className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={selectedStep} onChange={e => setSelectedStep(e.target.value)}
            className="h-9 pl-9 pr-8 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
          >
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-400">No records found</p>
            <p className="text-xs text-gray-300 mt-0.5">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((entry, index) => (
              <div key={`${entry.leadNo}-${entry.stepId}-${index}`}
                className="px-4 py-4 flex flex-col md:flex-row md:items-start gap-3 hover:bg-gray-50 transition-colors">

                {/* Left: timeline dot + info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex flex-col items-center mt-1 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-100" />
                    {index < filtered.length - 1 && <div className="w-px h-8 bg-gray-200 mt-1" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-semibold">
                        {entry.leadNo}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STEP_BADGE[entry.stepId]}`}>
                        {entry.stepName}
                      </span>
                      <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {entry.statusText}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{entry.clientName}</p>
                    {entry.remarks && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-lg">{entry.remarks}</p>}
                    {entry.docLink && (
                      <a href={entry.docLink} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1">
                        <ExternalLink className="w-3 h-3" /> View attachment
                      </a>
                    )}
                  </div>
                </div>

                {/* Right: timestamp */}
                <div className="md:text-right shrink-0 md:ml-4">
                  <div className="flex items-center md:justify-end gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>Completed</span>
                  </div>
                  <p className="text-xs font-mono font-semibold text-gray-700 mt-0.5">{entry.actualTime}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
