import React from 'react';
import {
  Users, CheckCircle2, Clock, AlertCircle, TrendingUp,
  ArrowRight, FileSpreadsheet, Phone, Calendar, Briefcase,
  Home, Star, MapPin, BarChart3, Sparkles
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

const STATUS_CONFIG: Record<LeadStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  completed:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  'in-progress': { label: 'In Progress', cls: 'bg-amber-100 text-amber-800 border-amber-200', icon: <TrendingUp className="w-3 h-3" /> },
  pending:     { label: 'Pending',     cls: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Clock className="w-3 h-3" /> },
  delayed:     { label: 'Delayed',     cls: 'bg-rose-100 text-rose-800 border-rose-200', icon: <AlertCircle className="w-3 h-3" /> },
};

const STEP_NAMES: Record<number, string> = {
  1: '2D Design', 2: 'RFQ Ready', 3: 'Quotation', 4: 'Request 3D', 5: '3D Design',
};

function SummaryCard({
  title, value, sub, icon: Icon, color, trend
}: {
  title: string; value: number | string; sub?: string;
  icon: React.ElementType; color: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
  trend?: { value: number; positive: boolean };
}) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', val: 'text-emerald-700', border: 'border-emerald-100' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   val: 'text-amber-700', border: 'border-amber-100' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    val: 'text-rose-700',  border: 'border-rose-100' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    val: 'text-blue-700',  border: 'border-blue-100' },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-600',   val: 'text-slate-700', border: 'border-slate-100' },
  };
  const c = colorMap[color];
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group`}>
      <div className="flex items-start justify-between">
        <div className={`${c.bg} p-2.5 rounded-xl`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${c.val}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardOverview({ leads, onNavigate }: DashboardOverviewProps) {
  const total     = leads.length;
  const completed = leads.filter(l => getLeadStatus(l) === 'completed').length;
  const inProgress = leads.filter(l => getLeadStatus(l) === 'in-progress').length;
  const pending   = leads.filter(l => getLeadStatus(l) === 'pending').length;
  const delayed   = leads.filter(l => getLeadStatus(l) === 'delayed').length;
  const rate      = total > 0 ? Math.round((completed / total) * 100) : 0;

  const today = new Date().toDateString();
  const newToday = leads.filter(l => new Date(l.timestamp).toDateString() === today).length;

  const recent = [...leads]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  const pendingLeads = leads.filter(l => {
    const s = getLeadStatus(l);
    return s === 'pending' || s === 'in-progress';
  }).slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Overview</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => onNavigate('add')}
          className="inline-flex items-center gap-2 h-11 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-200 cursor-pointer"
        >
          <span>+ New Lead</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard title="Total Leads"   value={total}      sub={`${newToday} today`}       icon={Users}          color="slate" />
        <SummaryCard title="Completed"     value={completed}  sub={`${rate}% completion`}     icon={CheckCircle2}   color="emerald" trend={{ value: rate, positive: rate >= 50 }} />
        <SummaryCard title="In Progress"   value={inProgress} sub="Active workflow"           icon={TrendingUp}     color="amber" />
        <SummaryCard title="Pending"       value={pending}    sub="Not started"               icon={Clock}          color="rose" />
        <SummaryCard title="Delayed"       value={delayed}    sub="Needs attention"           icon={AlertCircle}    color="blue" />
        <SummaryCard title="Success Rate"  value={`${rate}%`} sub={`${completed}/${total}`}   icon={BarChart3}      color="emerald" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Leads Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Recent Leads
            </h2>
            <button
              onClick={() => onNavigate('steps')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium">No leads yet</p>
              <p className="text-xs mt-1">Add your first lead to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Source</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recent.map(lead => {
                    const status = getLeadStatus(lead);
                    const sc = STATUS_CONFIG[status];
                    const done = getCompletedSteps(lead);
                    return (
                      <tr key={lead.leadNo} className="hover:bg-emerald-50/20 transition-colors group">
                        <td className="px-6 py-3">
                          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                            {lead.leadNo}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-semibold text-gray-800 text-sm">{lead.clientName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{lead.salesPerson || 'Unassigned'}</p>
                        </td>
                        <td className="px-6 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Phone className="w-3 h-3 text-gray-300" />
                            {lead.phone}
                          </div>
                        </td>
                        <td className="px-6 py-3 hidden md:table-cell">
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{lead.leadSource || '—'}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${sc.cls}`}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <div
                                  key={i}
                                  className={`w-4 h-1.5 rounded-full transition-all ${
                                    !!lead[`actual${i}` as keyof Lead] ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                    !!lead[`planned${i}` as keyof Lead] ? 'bg-amber-400' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-mono text-gray-500">{done}/5</span>
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

        {/* Right Panel */}
        <div className="space-y-5">

          {/* Pending Work Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Pending Work
              </h2>
              <button
                onClick={() => onNavigate('steps')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingLeads.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-200" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs mt-1">No pending leads</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingLeads.map(lead => {
                  const status = getLeadStatus(lead);
                  const sc = STATUS_CONFIG[status];
                  const done = getCompletedSteps(lead);
                  const nextStep = [1, 2, 3, 4, 5].find(i => !lead[`actual${i}` as keyof Lead]) || 1;
                  return (
                    <div key={lead.leadNo} className="px-5 py-4 flex items-center gap-3 group hover:bg-emerald-50/20 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm ${
                        nextStep === 1 ? 'bg-purple-100 text-purple-700' :
                        nextStep === 2 ? 'bg-cyan-100 text-cyan-700' :
                        nextStep === 3 ? 'bg-amber-100 text-amber-700' :
                        nextStep === 4 ? 'bg-rose-100 text-rose-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        {nextStep}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{lead.clientName}</p>
                        <p className="text-xs text-gray-400">{STEP_NAMES[nextStep]} • {done}/5 done</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border shrink-0 ${sc.cls}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all hover:shadow-md">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Work Distribution
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Kitchen Projects', count: leads.filter(l => !!l.kitchen).length, icon: Home, color: 'bg-emerald-500' },
                { label: 'Wardrobe Units',   count: leads.filter(l => !!l.wardrobe).length, icon: Briefcase, color: 'bg-amber-500' },
                { label: 'Custom Work',      count: leads.filter(l => !!l.otherWork).length, icon: Star, color: 'bg-blue-500' },
              ].map(({ label, count, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold text-gray-800">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: total > 0 ? `${Math.round((count / total) * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lead Sources</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Instagram', count: leads.filter(l => l.leadSource?.includes('Instagram')).length, icon: <TrendingUp className="w-3 h-3" /> },
                  { label: 'Facebook',  count: leads.filter(l => l.leadSource?.includes('Facebook')).length, icon: <Users className="w-3 h-3" /> },
                  { label: 'Walk-in',   count: leads.filter(l => l.leadSource?.includes('Walk')).length, icon: <MapPin className="w-3 h-3" /> },
                  { label: 'Referral',  count: leads.filter(l => l.leadSource?.includes('Reference') || l.leadSource?.includes('Designer')).length, icon: <Star className="w-3 h-3" /> },
                ].map(({ label, count, icon }) => (
                  <div key={label} className="bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">{icon}</span>
                      <span className="text-xs text-gray-600">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {leads.slice(0, 5).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No recent activity</p>
              ) : (
                [...leads]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 5)
                  .map(lead => (
                    <div key={lead.leadNo} className="px-5 py-3 flex items-center gap-3 group hover:bg-emerald-50/20 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{lead.clientName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{lead.timestamp?.split(' ')[0] || '—'}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span>{lead.leadNo}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Ensure animations are in global CSS (already added from previous components)