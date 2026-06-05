import React from 'react';
import {
  Users, CheckCircle2, Clock, AlertCircle, TrendingUp,
  ArrowRight, FileSpreadsheet, Phone, Calendar, Briefcase,
  Home, Star, MapPin, BarChart3, Sparkles, Activity,
  ArrowUpRight, Target,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
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
  completed:    { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  'in-progress':{ label: 'In Progress', cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',            icon: <TrendingUp className="w-3 h-3" /> },
  pending:      { label: 'Pending',     cls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/30 dark:text-slate-400 dark:border-slate-600',            icon: <Clock className="w-3 h-3" /> },
  delayed:      { label: 'Delayed',     cls: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700',                   icon: <AlertCircle className="w-3 h-3" /> },
};

const STEP_NAMES: Record<number, string> = {
  1: '2D Design', 2: 'RFQ Ready', 3: 'Quotation', 4: 'Request 3D', 5: '3D Design',
};

/* ─── KPI Card ─────────────────────────────────────────────────────────────── */
interface KpiCardProps {
  title: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  iconColor: string;
  trend?: { value: number; positive: boolean };
  onClick?: () => void;
}

function KpiCard({ title, value, sub, icon: Icon, gradient, iconBg, iconColor, trend, onClick }: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''} border`}
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Background gradient accent */}
      <div className={`absolute top-0 right-0 w-28 h-28 rounded-full -translate-y-1/2 translate-x-1/3 opacity-8 ${gradient}`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend.positive ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30'
            }`}>
              <ArrowUpRight className={`w-3 h-3 ${!trend.positive ? 'rotate-90' : ''}`} />
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-subtle)' }}>{title}</p>
        <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>{value}</p>
        {sub && <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Section header ────────────────────────────────────────────────────────── */
function SectionHeader({ title, icon: Icon, action, onAction }: {
  title: string; icon: React.ElementType;
  action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
      <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Icon className="w-4 h-4 text-emerald-500" />
        {title}
      </h2>
      {action && onAction && (
        <button onClick={onAction}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer transition-colors">
          {action} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ─── Custom tooltip for charts ─────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border px-3 py-2 shadow-lg text-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
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
    .slice(0, 5);

  /* Pipeline chart data */
  const pipelineData = [
    { name: '2D Design',    pending: leads.filter(l => l.planned1 && !l.actual1).length, done: leads.filter(l => !!l.actual1).length },
    { name: 'RFQ',          pending: leads.filter(l => l.planned2 && !l.actual2).length, done: leads.filter(l => !!l.actual2).length },
    { name: 'Quotation',    pending: leads.filter(l => l.planned3 && !l.actual3).length, done: leads.filter(l => !!l.actual3).length },
    { name: 'Request 3D',   pending: leads.filter(l => l.planned4 && !l.actual4).length, done: leads.filter(l => !!l.actual4).length },
    { name: '3D Design',    pending: leads.filter(l => l.planned5 && !l.actual5).length, done: leads.filter(l => !!l.actual5).length },
  ];

  /* Status distribution for donut */
  const statusDist = [
    { name: 'Completed',   value: completed,  color: '#10b981' },
    { name: 'In Progress', value: inProgress, color: '#f59e0b' },
    { name: 'Pending',     value: pending,    color: '#6366f1' },
    { name: 'Delayed',     value: delayed,    color: '#ef4444' },
  ].filter(d => d.value > 0);

  /* Lead sources */
  const sourceCounts = [
    { label: 'Instagram',  count: leads.filter(l => l.leadSource?.includes('Instagram')).length },
    { label: 'Facebook',   count: leads.filter(l => l.leadSource?.includes('Facebook')).length },
    { label: 'Walk-in',    count: leads.filter(l => l.leadSource?.includes('Walk')).length },
    { label: 'Referral',   count: leads.filter(l => l.leadSource?.includes('Reference') || l.leadSource?.includes('Designer')).length },
    { label: 'Google',     count: leads.filter(l => l.leadSource?.includes('Google')).length },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* ── Welcome header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
              <Sparkles className="w-3 h-3" />
              Overview
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {newToday > 0 && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">· {newToday} new lead{newToday > 1 ? 's' : ''} today</span>}
          </p>
        </div>
        <button
          onClick={() => onNavigate('add')}
          className="inline-flex items-center gap-2 h-10 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer hover:shadow-emerald-500/30 hover:-translate-y-0.5"
        >
          <span>+ New Lead</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Leads" value={total} sub={`${newToday} today`}
          icon={Users} gradient="bg-slate-200" iconBg="bg-slate-100 dark:bg-slate-700/50" iconColor="text-slate-600 dark:text-slate-300"
        />
        <KpiCard
          title="Completed" value={completed} sub={`${rate}% success rate`}
          icon={CheckCircle2} gradient="bg-emerald-200" iconBg="bg-emerald-100 dark:bg-emerald-900/40" iconColor="text-emerald-600 dark:text-emerald-400"
          trend={{ value: rate, positive: rate >= 50 }}
          onClick={() => onNavigate('steps')}
        />
        <KpiCard
          title="In Progress" value={inProgress} sub="Active workflow"
          icon={Activity} gradient="bg-amber-200" iconBg="bg-amber-100 dark:bg-amber-900/40" iconColor="text-amber-600 dark:text-amber-400"
          onClick={() => onNavigate('steps')}
        />
        <KpiCard
          title="Pending" value={pending} sub="Not started"
          icon={Clock} gradient="bg-indigo-200" iconBg="bg-indigo-100 dark:bg-indigo-900/40" iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <KpiCard
          title="Delayed" value={delayed} sub="Needs attention"
          icon={AlertCircle} gradient="bg-rose-200" iconBg="bg-rose-100 dark:bg-rose-900/40" iconColor="text-rose-600 dark:text-rose-400"
        />
        <KpiCard
          title="Success Rate" value={`${rate}%`} sub={`${completed} of ${total}`}
          icon={Target} gradient="bg-teal-200" iconBg="bg-teal-100 dark:bg-teal-900/40" iconColor="text-teal-600 dark:text-teal-400"
          trend={{ value: rate, positive: rate >= 60 }}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Pipeline bar chart */}
        <div className="lg:col-span-2 rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <SectionHeader title="Pipeline Progress" icon={BarChart3} action="View Pipeline" onAction={() => onNavigate('steps')} />
          <div className="p-5">
            {total === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pipeline data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pipelineData} barSize={16} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="done"    name="Completed" fill="#10b981" radius={[6,6,0,0]} />
                  <Bar dataKey="pending" name="Pending"   fill="#6366f1" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status donut */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <SectionHeader title="Status Distribution" icon={Activity} />
          <div className="p-5">
            {statusDist.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {statusDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {statusDist.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{d.value}</span>
                        <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                          {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Leads Table */}
        <div className="lg:col-span-2 rounded-2xl border overflow-hidden transition-all hover:shadow-md" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <SectionHeader title="Recent Leads" icon={FileSpreadsheet} action="View all" onAction={() => onNavigate('steps')} />

          {recent.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                <Users className="w-8 h-8" style={{ color: 'var(--text-subtle)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No leads yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Add your first lead to get started</p>
              <button onClick={() => onNavigate('add')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer">
                <span>Create lead</span> <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Lead</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Client</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--text-subtle)' }}>Phone</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-subtle)' }}>Source</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--text-subtle)' }}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((lead, i) => {
                    const status = getLeadStatus(lead);
                    const sc = STATUS_CONFIG[status];
                    const done = getCompletedSteps(lead);
                    return (
                      <tr key={lead.leadNo} className="border-b transition-colors hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 group"
                        style={{ borderColor: 'var(--border-subtle)' }}>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs px-2 py-1 rounded-lg font-semibold"
                            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                            {lead.leadNo}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{lead.clientName}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{lead.salesPerson || 'Unassigned'}</p>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <Phone className="w-3 h-3" style={{ color: 'var(--text-subtle)' }} />
                            {lead.phone}
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                            {lead.leadSource || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.cls}`}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`w-5 h-1.5 rounded-full transition-all ${
                                  !!lead[`actual${i}` as keyof Lead] ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                  !!lead[`planned${i}` as keyof Lead] ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-700'
                                }`} />
                              ))}
                            </div>
                            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{done}/5</span>
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

        {/* Right column */}
        <div className="space-y-5">

          {/* Pending work */}
          <div className="rounded-2xl border overflow-hidden transition-all hover:shadow-md" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <SectionHeader title="Pending Work" icon={Clock} action="View all" onAction={() => onNavigate('steps')} />

            {pendingLeads.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>All caught up!</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>No pending leads</p>
              </div>
            ) : (
              <div>
                {pendingLeads.map(lead => {
                  const status = getLeadStatus(lead);
                  const sc = STATUS_CONFIG[status];
                  const done = getCompletedSteps(lead);
                  const nextStep = [1, 2, 3, 4, 5].find(i => !lead[`actual${i}` as keyof Lead]) || 1;
                  const stepColors = ['bg-purple-100 text-purple-700', 'bg-cyan-100 text-cyan-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-indigo-100 text-indigo-700'];
                  return (
                    <div key={lead.leadNo}
                      className="px-5 py-3.5 flex items-center gap-3 border-b transition-colors hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 cursor-pointer"
                      style={{ borderColor: 'var(--border-subtle)' }}
                      onClick={() => onNavigate('steps')}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${stepColors[nextStep - 1]}`}>
                        {nextStep}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{lead.clientName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{STEP_NAMES[nextStep]} · {done}/5 done</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border shrink-0 ${sc.cls}`}>
                        {sc.icon}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Work distribution */}
          <div className="rounded-2xl border overflow-hidden transition-all hover:shadow-md" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <SectionHeader title="Work Distribution" icon={BarChart3} />
            <div className="p-5 space-y-4">
              {[
                { label: 'Kitchen',  count: leads.filter(l => !!l.kitchen).length,   icon: Home,      color: 'bg-emerald-500' },
                { label: 'Wardrobe', count: leads.filter(l => !!l.wardrobe).length,  icon: Briefcase, color: 'bg-indigo-500' },
                { label: 'Custom',   count: leads.filter(l => !!l.otherWork).length, icon: Star,      color: 'bg-amber-500' },
              ].map(({ label, count, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                    <Icon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: total > 0 ? `${Math.round((count / total) * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t mt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-subtle)' }}>Lead Sources</p>
                <div className="grid grid-cols-2 gap-2">
                  {sourceCounts.map(({ label, count }) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border overflow-hidden transition-all hover:shadow-md" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <SectionHeader title="Recent Activity" icon={Calendar} action="Full log" onAction={() => onNavigate('logs')} />
            <div>
              {leads.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: 'var(--text-subtle)' }}>No recent activity</p>
              ) : (
                [...leads]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 5)
                  .map(lead => (
                    <div key={lead.leadNo}
                      className="px-5 py-3 flex items-center gap-3 border-b transition-colors hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10"
                      style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-900/20">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{lead.clientName}</p>
                        <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                          <Calendar className="w-3 h-3" />
                          <span>{lead.timestamp?.split(' ')[0] || '—'}</span>
                          <span>·</span>
                          <span className="font-mono">{lead.leadNo}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--text-subtle)' }} />
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
