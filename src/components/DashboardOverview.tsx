import {
  Users, CheckCircle2, Clock, AlertCircle,
  ArrowRight, FileSpreadsheet, Phone, Activity,
} from 'lucide-react';
import { Lead, PageId } from '../types';

interface DashboardOverviewProps {
  leads: Lead[];
  onNavigate: (page: PageId) => void;
}

type LeadStatus = 'completed' | 'in-progress' | 'pending' | 'delayed';

const getCompletedSteps = (l: Lead) =>
  [1, 2, 3, 4, 5].filter(i => !!l[`actual${i}` as keyof Lead]).length;

const getLeadStatus = (l: Lead): LeadStatus => {
  const done = getCompletedSteps(l);
  if (done === 5) return 'completed';
  const age = (Date.now() - new Date(l.timestamp).getTime()) / 86_400_000;
  if (age > 7 && done < 2) return 'delayed';
  if (done > 0) return 'in-progress';
  return 'pending';
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; cls: string; dot: string }> = {
  completed:     { label: 'Completed',   cls: 'bg-gray-100 text-gray-700 border-gray-200',   dot: 'bg-gray-500'  },
  'in-progress': { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  pending:       { label: 'Pending',     cls: 'bg-gray-50 text-gray-500 border-gray-200',    dot: 'bg-gray-300'  },
  delayed:       { label: 'Delayed',     cls: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-400'   },
};

const STEP_NAMES: Record<number, string> = {
  1: '2D Design', 2: 'RFQ Ready', 3: 'Quotation', 4: 'Request 3D', 5: '3D Design',
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
};

/* ─── Main component ────────────────────────────────────────────────────────── */
export default function DashboardOverview({ leads, onNavigate }: DashboardOverviewProps) {
  const total      = leads.length;
  const completed  = leads.filter(l => getLeadStatus(l) === 'completed').length;
  const inProgress = leads.filter(l => getLeadStatus(l) === 'in-progress').length;
  const pending    = leads.filter(l => getLeadStatus(l) === 'pending').length;
  const delayed    = leads.filter(l => getLeadStatus(l) === 'delayed').length;
  const rate       = total > 0 ? Math.round((completed / total) * 100) : 0;

  const today    = new Date().toDateString();
  const newToday = leads.filter(l => new Date(l.timestamp).toDateString() === today).length;

  const recent = [...leads]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  const pendingLeads = leads
    .filter(l => { const s = getLeadStatus(l); return s === 'pending' || s === 'in-progress'; })
    .slice(0, 6);

  const kpis = [
    { label: 'Total Leads',  value: total,      sub: `${newToday} today`,     icon: Users,         click: undefined           },
    { label: 'Completed',    value: completed,  sub: `${rate}% rate`,         icon: CheckCircle2,  click: () => onNavigate('steps') },
    { label: 'In Progress',  value: inProgress, sub: 'Active',                icon: Activity,      click: () => onNavigate('steps') },
    { label: 'Pending',      value: pending,    sub: 'Not started',           icon: Clock,         click: undefined           },
    { label: 'Delayed',      value: delayed,    sub: 'Needs attention',       icon: AlertCircle,   click: undefined           },
  ];

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Good {greeting()} 👋
          </h1>
          {newToday > 0 && (
            <p className="text-sm mt-0.5 text-gray-500">
              {newToday} new lead{newToday > 1 ? 's' : ''} added today
            </p>
          )}
        </div>
        <button
          onClick={() => onNavigate('add')}
          className="shrink-0 inline-flex items-center gap-2 h-10 px-5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5"
        >
          + New Lead
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(({ label, value, sub, icon: Icon, click }) => (
          <div
            key={label}
            onClick={click}
            className={`rounded-2xl border border-gray-200 bg-white p-4 transition-all ${click ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-gray-600" />
              </div>
              {label === 'Completed' && rate > 0 && (
                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                  {rate}%
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-xs text-gray-400 mt-1.5 truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Leads */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-gray-500" />
              Recent Leads
            </h2>
            <button
              onClick={() => onNavigate('steps')}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gray-50">
                <Users className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-400">No leads yet</p>
              <button
                onClick={() => onNavigate('add')}
                className="mt-3 text-xs font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
              >
                Add your first lead →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '520px' }}>
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 w-24">Lead #</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Client</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 hidden sm:table-cell">Phone</th>
                    <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 w-32">Status</th>
                    <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 w-28 hidden md:table-cell">Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(lead => {
                    const status = getLeadStatus(lead);
                    const sc = STATUS_CONFIG[status];
                    const done = getCompletedSteps(lead);
                    return (
                      <tr
                        key={lead.leadNo}
                        onClick={() => onNavigate('steps')}
                        className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {lead.leadNo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{lead.clientName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{lead.salesPerson || 'Unassigned'}</p>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="w-3 h-3 text-gray-300 shrink-0" />
                            {lead.phone}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(i => (
                                <div key={i} className={`w-4 h-1.5 rounded-full ${
                                  !!lead[`actual${i}` as keyof Lead] ? 'bg-gray-800' :
                                  !!lead[`planned${i}` as keyof Lead] ? 'bg-gray-300' : 'bg-gray-150'
                                }`}
                                style={{ backgroundColor: !lead[`actual${i}` as keyof Lead] && !lead[`planned${i}` as keyof Lead] ? '#f1f1f1' : undefined }}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-mono text-gray-400">{done}/5</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Work */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Pending Work
            </h2>
            <button
              onClick={() => onNavigate('steps')}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingLeads.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gray-50">
                <CheckCircle2 className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-400">All caught up!</p>
              <p className="text-xs text-gray-400 mt-0.5">No pending leads</p>
            </div>
          ) : (
            <div>
              {pendingLeads.map((lead) => {
                const done = getCompletedSteps(lead);
                const nextStep = [1,2,3,4,5].find(i => !lead[`actual${i}` as keyof Lead]) || 1;
                const status = getLeadStatus(lead);
                const sc = STATUS_CONFIG[status];
                return (
                  <div
                    key={lead.leadNo}
                    onClick={() => onNavigate('steps')}
                    className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                      {nextStep}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{lead.clientName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{STEP_NAMES[nextStep]} · {done}/5</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mini stats footer */}
          <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 grid grid-cols-3 gap-3">
            {[
              { label: 'Done', value: completed, color: 'text-gray-900' },
              { label: 'Active', value: inProgress, color: 'text-amber-600' },
              { label: 'Delayed', value: delayed, color: 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Pipeline strip ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-500" />
            Pipeline Overview
          </h2>
          <button
            onClick={() => onNavigate('steps')}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-5 divide-x divide-gray-100">
          {[1,2,3,4,5].map(step => {
            const done    = leads.filter(l => !!l[`actual${step}` as keyof Lead]).length;
            const waiting = leads.filter(l => l[`planned${step}` as keyof Lead] && !l[`actual${step}` as keyof Lead]).length;
            const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={step} className="px-4 py-4 text-center">
                <div className="w-7 h-7 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                  {step}
                </div>
                <p className="text-[11px] font-semibold text-gray-600 truncate">{STEP_NAMES[step]}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{done}</p>
                <div className="w-full h-1 rounded-full bg-gray-100 mt-2">
                  <div
                    className="h-1 rounded-full bg-gray-800 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">{waiting} waiting</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
