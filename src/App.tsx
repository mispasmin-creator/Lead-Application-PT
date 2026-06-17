import React from 'react';
import {
  getSyncConfig,
  saveSyncConfig,
  getLeads,
  addLead,
  deleteLead,
  authenticateUser,
  getSavedUser,
  saveAuthUser,
  clearAuthUser
} from './utils/storage';
import { Lead, SyncConfig, PageId, ActiveStepId, UserAccount } from './types';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import LeadForm from './components/LeadForm';
import WorkflowBoard from './components/WorkflowBoard';
import HistoryLog from './components/HistoryLog';
import ClientDirectory from './components/ClientDirectory';
import LoginPage from './components/LoginPage';
import UserManagement from './components/UserManagement';
import {
  Loader2, X, CheckCircle,
  AlertCircle, LogOut,
} from 'lucide-react';

const PAGE_LABELS: Record<PageId, string> = {
  dashboard: 'Dashboard',
  add: 'Add Lead',
  steps: 'Pipeline',
  logs: 'Activity Log',
  clients: 'Clients',
  settings: 'User Management',
};

const ALL_PAGES = Object.keys(PAGE_LABELS) as PageId[];
const PAGE_ACCESS_ALIASES: Record<PageId, string[]> = {
  dashboard: ['dashboard'],
  add: ['add', 'add lead'],
  steps: ['steps', 'pipeline', 'workflow'],
  logs: ['logs', 'activity log', 'history'],
  clients: ['clients', 'client'],
  settings: ['settings', 'users', 'user management'],
};

function getAllowedPages(user: UserAccount | null): PageId[] {
  if (!user) return [];
  const role = user.role.trim().toLowerCase();
  const rawAccess = user.pageAccess.trim();
  if (role === 'admin' || role === 'administrator' || !rawAccess || rawAccess.toLowerCase() === 'all') {
    return ALL_PAGES;
  }

  const tokens = rawAccess
    .split(/[,|;\n]/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  const allowed = ALL_PAGES.filter((page) => {
    const label = PAGE_LABELS[page].toLowerCase();
    return tokens.includes(page.toLowerCase())
      || tokens.includes(label)
      || PAGE_ACCESS_ALIASES[page].some((alias) => tokens.includes(alias));
  });

  return allowed.length > 0 ? allowed : ALL_PAGES;
}

function getInitials(user: UserAccount | null): string {
  const source = user?.username || user?.firmName || 'LF';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'LF';
}

function getInitialRoute(): { page: PageId; tab: ActiveStepId | 'all' | 'history' } {
  const path = window.location.pathname || '/dashboard';
  if (path.startsWith('/pipeline/')) {
    const tab = path.substring('/pipeline/'.length);
    let activeTab: ActiveStepId | 'all' | 'history' = 'all';
    if (tab === 'all') {
      activeTab = 'all';
    } else if (tab === 'history') {
      activeTab = 'history';
    } else {
      const num = parseInt(tab, 10);
      if (num >= 1 && num <= 5) {
        activeTab = num as ActiveStepId;
      }
    }
    return { page: 'steps', tab: activeTab };
  } else if (path === '/pipeline' || path === '/steps') {
    return { page: 'steps', tab: 'all' };
  } else if (path === '/') {
    return { page: 'dashboard', tab: 'all' };
  } else {
    const page = path.substring(1) as PageId;
    const validPages: PageId[] = ['dashboard', 'add', 'steps', 'logs', 'clients', 'settings'];
    if (validPages.includes(page)) {
      return { page, tab: 'all' };
    }
    return { page: 'dashboard', tab: 'all' };
  }
}

export default function App() {
  const [syncConfig, setSyncConfig] = React.useState<SyncConfig>(getSyncConfig());
  const [currentUser, setCurrentUser] = React.useState<UserAccount | null>(getSavedUser());
  const initialRoute = getInitialRoute();
  const [currentPage, setCurrentPage] = React.useState<PageId>(initialRoute.page);
  const [activeWorkflowTab, setActiveWorkflowTab] = React.useState<ActiveStepId | 'all' | 'history'>(initialRoute.tab);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [globalToast, setGlobalToast] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pathname-based URL Routing Effect (URL -> App State)
  React.useEffect(() => {
    const handlePathChange = () => {
      const path = window.location.pathname || '/dashboard';
      if (path.startsWith('/pipeline/')) {
        const tab = path.substring('/pipeline/'.length);
        setCurrentPage('steps');
        if (tab === 'all') {
          setActiveWorkflowTab('all');
        } else if (tab === 'history') {
          setActiveWorkflowTab('history');
        } else {
          const num = parseInt(tab, 10);
          if (num >= 1 && num <= 5) {
            setActiveWorkflowTab(num as ActiveStepId);
          } else {
            setActiveWorkflowTab('all');
          }
        }
      } else if (path === '/pipeline' || path === '/steps') {
        setCurrentPage('steps');
        setActiveWorkflowTab('all');
      } else if (path === '/') {
        setCurrentPage('dashboard');
      } else {
        const page = path.substring(1) as PageId;
        const validPages: PageId[] = ['dashboard', 'add', 'steps', 'logs', 'clients', 'settings'];
        if (validPages.includes(page)) {
          setCurrentPage(page);
        } else {
          setCurrentPage('dashboard');
        }
      }
    };

    handlePathChange();
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  // App State -> URL Path Sync Effect
  React.useEffect(() => {
    let newPath = '';
    if (currentPage === 'steps') {
      newPath = `/pipeline/${activeWorkflowTab}`;
    } else {
      newPath = `/${currentPage}`;
    }
    if (window.location.pathname !== newPath) {
      try {
        window.history.pushState(null, '', newPath);
      } catch (e) {
        console.warn("Could not update URL pathname due to frame restrictions:", e);
      }
    }
  }, [currentPage, activeWorkflowTab]);

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

  const allowedPages = React.useMemo(() => getAllowedPages(currentUser), [currentUser]);

  React.useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    fetchLeadsList();
  }, [currentUser]);

  React.useEffect(() => {
    if (currentUser && !allowedPages.includes(currentPage)) {
      setCurrentPage(allowedPages[0] || 'dashboard');
    }
  }, [allowedPages, currentPage, currentUser]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setGlobalToast({ type, text });
    setTimeout(() => setGlobalToast(null), 4500);
  };

  const handleUpdateConfig = (config: SyncConfig) => {
    saveSyncConfig(config);
    setSyncConfig(config);
  };

  const handleLogin = async (username: string, password: string) => {
    const user = await authenticateUser(username, password, syncConfig);
    saveAuthUser(user);
    setCurrentUser(user);
    setCurrentPage(getAllowedPages(user)[0] || 'dashboard');
    showToast('success', `Welcome, ${user.username}!`);
  };

  const handleLogout = () => {
    clearAuthUser();
    setCurrentUser(null);
    setLeads([]);
    setCurrentPage('dashboard');
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

  const handleOptimisticUpdate = (leadNo: string, updatedFields: Partial<Lead>) => {
    setLeads(prevLeads =>
      prevLeads.map(l => (l.leadNo === leadNo ? { ...l, ...updatedFields } : l))
    );
  };

  const renderPage = () => {
    if (!allowedPages.includes(currentPage)) {
      return <DashboardOverview leads={leads} onNavigate={setCurrentPage} />;
    }

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
            onOptimisticUpdate={handleOptimisticUpdate}
          />
        );
      case 'logs':
        return <HistoryLog leads={leads} />;
      case 'clients':
        return <ClientDirectory leads={leads} onDelete={handleDeleteLead} syncConfig={syncConfig} />;
      case 'settings':
        return currentUser ? <UserManagement syncConfig={syncConfig} currentUser={currentUser} /> : null;
      default:
        return <DashboardOverview leads={leads} onNavigate={setCurrentPage} />;
    }
  };

  const isLive = syncConfig.mode === 'live';

  if (!currentUser) {
    return <LoginPage syncConfig={syncConfig} onLogin={handleLogin} onUpdateConfig={handleUpdateConfig} />;
  }

  return (
    <div className={`flex flex-col lg:flex-row h-screen overflow-hidden font-sans antialiased transition-colors duration-300`}
      style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        syncConfig={syncConfig}
        allowedPages={allowedPages}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeWorkflowTab={activeWorkflowTab}
        setActiveWorkflowTab={setActiveWorkflowTab}
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

            <button
              onClick={handleLogout}
              className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border hover:bg-slate-50 dark:hover:bg-slate-700"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              Logout
            </button>

            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm" title={currentUser.username}>
              {getInitials(currentUser)}
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
