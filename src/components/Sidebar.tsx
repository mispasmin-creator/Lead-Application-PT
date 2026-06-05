import React from 'react';
import {
  LayoutDashboard, PlusCircle, GitBranch, History,
  Users, Settings, Menu, X, Wifi, WifiOff,
  ChevronRight, LogOut,
} from 'lucide-react';
import { SyncConfig, PageId, ActiveStepId, UserAccount } from '../types';

interface SidebarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  syncConfig: SyncConfig;
  allowedPages: PageId[];
  currentUser: UserAccount;
  onLogout: () => void;
  activeWorkflowTab: ActiveStepId | 'all' | 'history';
  setActiveWorkflowTab: (tab: ActiveStepId | 'all' | 'history') => void;
}

const NAV_ITEMS = [
  { id: 'dashboard' as PageId, label: 'Dashboard',    icon: LayoutDashboard, accent: '#10b981' },
  { id: 'add'       as PageId, label: 'Add Lead',     icon: PlusCircle,      accent: '#6366f1' },
  { id: 'steps'     as PageId, label: 'WorkFlow',     icon: GitBranch,       accent: '#f59e0b' },
  { id: 'logs'      as PageId, label: 'Activity Log', icon: History,         accent: '#06b6d4' },
  { id: 'clients'   as PageId, label: 'Clients',      icon: Users,           accent: '#a855f7' },
  { id: 'settings'  as PageId, label: 'Users',        icon: Settings,        accent: '#64748b' },
];

function Logo() {
  return (
    <div className="relative flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur-sm opacity-50" />
      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="white" strokeWidth="1.8"/>
          <line x1="12" y1="4" x2="12" y2="13" stroke="white" strokeWidth="1.5"/>
          <line x1="3" y1="13" x2="12" y2="13" stroke="white" strokeWidth="1.5"/>
          <path d="M14 10 L16 12 L20 8" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

export default function Sidebar({
  currentPage, setCurrentPage, syncConfig,
  allowedPages, currentUser, onLogout,
}: SidebarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isLive = syncConfig.mode === 'live';
  const visibleNavItems = NAV_ITEMS.filter((item) => allowedPages.includes(item.id));
  const initials = (currentUser.username || currentUser.firmName || 'LF')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'LF';

  const navigate = (id: PageId) => { setCurrentPage(id); setMenuOpen(false); };

  const NavList = ({ compact = false }: { compact?: boolean }) => (
    <nav className={compact ? 'space-y-0.5' : 'space-y-1'}>
      {visibleNavItems.map(({ id, label, icon: Icon, accent }) => {
        const active = currentPage === id;
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative overflow-hidden ${
              active
                ? 'shadow-sm text-slate-900 font-semibold'
                : 'hover:bg-slate-50'
            }`}
            style={active ? { background: `${accent}12`, border: `1px solid ${accent}22` } : { border: '1px solid transparent' }}
          >
            {active && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: accent }} />
            )}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              active ? 'shadow-sm' : 'group-hover:scale-110'
            }`}
              style={active ? { background: `${accent}18` } : {}}
            >
              <Icon className="w-4 h-4 transition-colors" style={{ color: active ? accent : 'var(--text-subtle)' }} />
            </div>
            <span className="flex-1 text-left" style={{ color: active ? 'var(--text)' : 'var(--sidebar-text)' }}>{label}</span>
            {active && <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b transition-colors"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="font-bold text-base tracking-tight" style={{ color: 'var(--text)' }}>Lead Tracker</h1>
            {/* <p className="text-[10px] -mt-0.5" style={{ color: 'var(--text-subtle)' }}>Design Pipeline</p> */}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <nav className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] flex flex-col animate-slideInRight rounded-r-2xl overflow-hidden border-r"
            style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <p className="font-bold text-slate-900 text-base" style={{ color: 'var(--text)' }}>Lead Tracker</p>
                  {/* <p className="text-xs text-slate-500" style={{ color: 'var(--text-muted)' }}>Design Tracker</p> */}
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NavList />
            </div>
            <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                {isLive ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
                <span>{isLive ? 'Live Sync Active' : 'Sandbox Mode'}</span>
              </div>
              <button
                onClick={onLogout}
                className="mt-2 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col shrink-0 w-60 h-screen sticky top-0 border-r"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Logo />
          <div>
            <h1 className="font-bold text-slate-900 text-lg tracking-tight leading-none" style={{ color: 'var(--text)' }}>Lead Tracker</h1>
            {/* <p className="text-[10px] text-slate-500 mt-0.5" style={{ color: 'var(--text-muted)' }}>Design Pipeline</p> */}
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-3 pt-4">
          {/* <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: 'var(--text-subtle)' }}>Navigation</p> */}
          <NavList />
        </div>

        {/* Footer */}
        <div className="p-3 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
          {/* Sync mode */}
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            isLive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {isLive ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            <span>{isLive ? 'Live Sync' : 'Sandbox Mode'}</span>
          </div>

          {/* User profile */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {initials}
              </div>
              <span className="text-xs font-semibold truncate max-w-28" style={{ color: 'var(--text)' }} title={currentUser.username}>
                {currentUser.username}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:bg-slate-100 shrink-0"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t transition-colors"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-around py-1.5 px-1 safe-bottom">
          {visibleNavItems.slice(0, 5).map(({ id, label, icon: Icon, accent }) => {
            const active = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 cursor-pointer min-w-[52px]"
                style={active ? { background: `${accent}15` } : {}}
              >
                <Icon className="w-5 h-5" style={{ color: active ? accent : 'var(--text-subtle)' }} />
                <span className="text-[9px] font-semibold tracking-wide" style={{ color: active ? accent : 'var(--text-subtle)' }}>
                  {label.split(' ')[0]}
                </span>
              </button>
            );
          })}
          {allowedPages.includes('settings') && !visibleNavItems.slice(0, 5).some((item) => item.id === 'settings') && (
            <button
              onClick={() => setCurrentPage('settings')}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 cursor-pointer min-w-[52px]"
              style={currentPage === 'settings' ? { background: '#64748b15' } : {}}
            >
              <Settings className="w-5 h-5" style={{ color: currentPage === 'settings' ? '#64748b' : 'var(--text-subtle)' }} />
              <span className="text-[9px] font-semibold" style={{ color: currentPage === 'settings' ? '#64748b' : 'var(--text-subtle)' }}>
                Users
              </span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
