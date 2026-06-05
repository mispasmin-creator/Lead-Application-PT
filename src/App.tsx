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
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  const [syncConfig, setSyncConfig] = React.useState<SyncConfig>(getSyncConfig());
  const [currentPage, setCurrentPage] = React.useState<PageId>('dashboard');
  const [activeWorkflowTab, setActiveWorkflowTab] = React.useState<ActiveStepId | 'all'>('all');
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [globalToast, setGlobalToast] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    setTimeout(() => setGlobalToast(null), 4000);
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
    } catch {
      return false;
    }
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
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans antialiased">

      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        syncConfig={syncConfig}
        activeWorkflowTab={activeWorkflowTab}
        setActiveWorkflowTab={setActiveWorkflowTab}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="hidden md:flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 shrink-0 z-10">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 font-medium">LeadFlow</span>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-800 capitalize">{currentPage === 'add' ? 'Add Lead' : currentPage === 'steps' ? 'Pipeline' : currentPage === 'logs' ? 'Activity Log' : currentPage}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isLive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500' : 'bg-amber-400'}`} />
              {isLive ? <><Wifi className="w-3 h-3" /><span>Live</span></> : <><WifiOff className="w-3 h-3" /><span>Sandbox</span></>}
            </div>

            {refreshing && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
                Syncing...
              </span>
            )}

            <button
              onClick={() => fetchLeadsList(syncConfig, true)}
              disabled={loading || refreshing}
              className="h-8 px-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-green-600 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* Toast */}
        {globalToast && (
          <div className="fixed top-4 right-4 z-[60] toast-enter">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg bg-white min-w-[260px] max-w-sm ${
              globalToast.type === 'success' ? 'border-green-200' : 'border-red-200'
            }`}>
              {globalToast.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              }
              <p className="flex-1 text-sm font-medium text-gray-800">{globalToast.text}</p>
              <button onClick={() => setGlobalToast(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-4 md:p-6 pb-20 lg:pb-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-48 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">Loading data...</p>
                  <p className="text-sm text-gray-400 mt-1">Please wait</p>
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
