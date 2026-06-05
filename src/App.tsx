import React from 'react';
import {
  getSyncConfig,
  saveSyncConfig,
  getLeads,
  addLead,
  deleteLead
} from './utils/storage';
import { Lead, SyncConfig, PageId, ActiveStepId } from './types';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import LeadForm from './components/LeadForm';
import WorkflowBoard from './components/WorkflowBoard';
import HistoryLog from './components/HistoryLog';
import ClientDirectory from './components/ClientDirectory';
import SheetsConnect from './components/SheetsConnect';
import {
  Loader2, RefreshCw, Wifi, WifiOff, X, CheckCircle,
  AlertCircle, Bell, Sun, Moon, Search,
} from 'lucide-react';

const PAGE_LABELS: Record<PageId, string> = {
  dashboard: 'Dashboard',
  add: 'Add Lead',
  steps: 'Pipeline',
  logs: 'Activity Log',
  clients: 'Clients',
  settings: 'Settings',
};

export default function App() {
  const [syncConfig, setSyncConfig] = React.useState<SyncConfig>(getSyncConfig());
  const [currentPage, setCurrentPage] = React.useState<PageId>('dashboard');
  const [activeWorkflowTab, setActiveWorkflowTab] = React.useState<ActiveStepId | 'all'>('all');
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [globalToast, setGlobalToast] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [darkMode, setDarkMode] = React.useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const fetchLeadsList = async (config = syncConfig, quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getLeads(config);
      setLeads(data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load leads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => { fetchLeadsList(); }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setGlobalToast({ type, text });
    setTimeout(() => setGlobalToast(null), 4500);
  };

  const handleUpdateConfig = async (newConfig: SyncConfig) => {
    saveSyncConfig(newConfig);
    setSyncConfig(newConfig);
    showToast('success', `Switched to ${newConfig.mode === 'live' ? 'Live Google Sheets' : 'Local Sandbox'}`);
    await fetchLeadsList(newConfig);
  };

  const handleCreateLead = async (newLead: Lead) => {
    await addLead(newLead, syncConfig);
    await fetchLeadsList(syncConfig, true);
    showToast('success', `Lead ${newLead.leadNo} saved successfully!`);
  };

  const handleDeleteLead = async (leadNo: string) => {
    await deleteLead(leadNo, syncConfig);
    await fetchLeadsList(syncConfig, true);
    showToast('success', `Lead ${leadNo} deleted.`);
  };

  const handleTestConnection = async (): Promise<boolean> => {
    if (!syncConfig.appsScriptUrl) return false;
    try {
      const res = await fetch(syncConfig.appsScriptUrl, { method: 'GET', mode: 'cors' });
      if (res.ok) {
        const json = await res.json();
        return json.status === 'success';
      }
      return false;
    } catch { return false; }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview leads={leads} onNavigate={setCurrentPage} />;
      case 'add':
        return <LeadForm onSuccess={handleCreateLead} syncConfig={syncConfig} />;
      case 'steps':
        return (
          <WorkflowBoard
            leads={leads}
            onRefresh={() => fetchLeadsList(syncConfig, true)}
            syncConfig={syncConfig}
            activeTab={activeWorkflowTab}
            setActiveTab={setActiveWorkflowTab}
          />
        );
      case 'logs':
        return <HistoryLog leads={leads} />;
      case 'clients':
        return <ClientDirectory leads={leads} onDelete={handleDeleteLead} syncConfig={syncConfig} />;
      case 'settings':
        return (
          <SheetsConnect
            syncConfig={syncConfig}
            onUpdateConfig={handleUpdateConfig}
            onTestConnection={handleTestConnection}
          />
        );
      default:
        return <DashboardOverview leads={leads} onNavigate={setCurrentPage} />;
    }
  };

  const isLive = syncConfig.mode === 'live';

  return (
    <div className={`flex flex-col lg:flex-row h-screen overflow-hidden font-sans antialiased transition-colors duration-300`}
      style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        syncConfig={syncConfig}
        activeWorkflowTab={activeWorkflowTab}
        setActiveWorkflowTab={setActiveWorkflowTab}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top Bar ───────────────────────────────────────────────────────── */}
        <header className="hidden md:flex items-center justify-between h-14 px-5 shrink-0 z-10 border-b transition-colors duration-300"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium" style={{ color: 'var(--text-subtle)' }}>LeadFlow</span>
            <span style={{ color: 'var(--text-subtle)' }}>/</span>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>{PAGE_LABELS[currentPage]}</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {/* Sync status badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              {isLive ? <><Wifi className="w-3 h-3" /><span>Live</span></> : <><WifiOff className="w-3 h-3" /><span>Sandbox</span></>}
            </div>

            {refreshing && (
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                Syncing…
              </span>
            )}

            {/* Refresh */}
            <button
              onClick={() => fetchLeadsList(syncConfig, true)}
              disabled={loading || refreshing}
              className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
              title="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Notifications */}
            <button
              className="relative h-8 w-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {leads.filter(l => {
                const age = (Date.now() - new Date(l.timestamp).getTime()) / 86_400_000;
                const done = [1,2,3,4,5].filter(i => !!l[`actual${i}` as keyof Lead]).length;
                return age > 7 && done < 2;
              }).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-800" />
              )}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              className="h-8 w-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer">
              LF
            </div>
          </div>
        </header>

        {/* ── Toast notification ─────────────────────────────────────────────── */}
        {globalToast && (
          <div className="fixed top-4 right-4 z-[60] toast-enter">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl min-w-[280px] max-w-sm backdrop-blur-sm ${
              globalToast.type === 'success'
                ? 'bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-700'
                : 'bg-white dark:bg-gray-800 border-rose-200 dark:border-rose-700'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                globalToast.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'
              }`}>
                {globalToast.type === 'success'
                  ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  : <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                }
              </div>
              <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{globalToast.text}</p>
              <button onClick={() => setGlobalToast(null)} className="cursor-pointer p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" style={{ color: 'var(--text-subtle)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Page content ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto p-4 md:p-6 pb-20 lg:pb-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-48 gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg glow-emerald">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <div className="absolute -inset-2 rounded-3xl bg-emerald-500/10 animate-ping" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>Loading your workspace…</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fetching the latest data</p>
                </div>
                {/* Skeleton preview */}
                <div className="w-full max-w-2xl space-y-3 mt-4">
                  {[80, 60, 90, 50].map((w, i) => (
                    <div key={i} className="skeleton h-4 rounded-lg" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                {renderPage()}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
