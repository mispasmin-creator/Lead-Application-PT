import React from 'react';
import {
  LayoutDashboard, PlusCircle, GitBranch, History,
  Users, Settings, Menu, X, Wifi, WifiOff, Sun, Moon,
  ChevronRight,
} from 'lucide-react';
import { SyncConfig, PageId, ActiveStepId } from '../types';

interface SidebarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  syncConfig: SyncConfig;
  activeWorkflowTab: ActiveStepId | 'all';
  setActiveWorkflowTab: (tab: ActiveStepId | 'all') => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard' as PageId, label: 'Dashboard',    icon: LayoutDashboard, accent: '#10b981' },
  { id: 'add'       as PageId, label: 'Add Lead',     icon: PlusCircle,      accent: '#6366f1' },
  { id: 'steps'     as PageId, label: 'Pipeline',     icon: GitBranch,       accent: '#f59e0b' },
  { id: 'logs'      as PageId, label: 'Activity Log', icon: History,         accent: '#06b6d4' },
  { id: 'clients'   as PageId, label: 'Clients',      icon: Users,           accent: '#a855f7' },
  { id: 'settings'  as PageId, label: 'Settings',     icon: Settings,        accent: '#64748b' },
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
  darkMode, onToggleDark,
}: SidebarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isLive = syncConfig.mode === 'live';

  const navigate = (id: PageId) => { setCurrentPage(id); setMenuOpen(false); };

  const NavList = ({ compact = false }: { compact?: boolean }) => (
    <nav className={compact ? 'space-y-0.5' : 'space-y-1'}>
      {NAV_ITEMS.map(({ id, label, icon: Icon, accent }) => {
        const active = currentPage === id;
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative overflow-hidden ${
              active
                ? 'text-white shadow-sm'
                : 'hover:bg-white/5'
            }`}
            style={active ? { background: `${accent}22`, border: `1px solid ${accent}33` } : { border: '1px solid transparent' }}
          >
            {active && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: accent }} />
            )}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              active ? 'shadow-sm' : 'group-hover:scale-110'
            }`}
              style={active ? { background: `${accent}33` } : {}}>
              <Icon className="w-4 h-4 transition-colors" style={{ color: active ? accent : '#94a3b8' }} />
            </div>
            <span className="flex-1 text-left" style={{ color: active ? '#f1f5f9' : '#94a3b8' }}>{label}</span>
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
            <h1 className="font-bold text-base tracking-tight" style={{ color: 'var(--text)' }}>LeadFlow</h1>
            <p className="text-[10px] -mt-0.5" style={{ color: 'var(--text-subtle)' }}>Design Pipeline</p>
          </div>
          <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
            isLive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
          }`}>
            {isLive ? 'Live' : 'Demo'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleDark} className="p-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}>
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
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
          <nav className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] flex flex-col animate-slideInRight rounded-r-2xl overflow-hidden"
            style={{ background: '#0f172a' }}>
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <p className="font-bold text-white text-base">LeadFlow</p>
                  <p className="text-xs text-slate-400">Design Tracker</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NavList />
            </div>
            <div className="p-4 border-t border-white/5">
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                isLive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                {isLive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>{isLive ? 'Live Sync Active' : 'Sandbox Mode'}</span>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col shrink-0 w-60 h-screen sticky top-0 border-r"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'rgba(255,255,255,0.05)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <Logo />
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight leading-none">LeadFlow</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Design Pipeline</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-3 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-3">Navigation</p>
          <NavList />
        </div>

        {/* Footer */}
        <div className="p-3 space-y-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {/* Sync mode */}
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            isLive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isLive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isLive ? 'Live Sync' : 'Sandbox Mode'}</span>
          </div>

          {/* Dark mode toggle + user */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold">
                LF
              </div>
              <span className="text-xs font-medium text-slate-400">LeadFlow Pro</span>
            </div>
            <button
              onClick={onToggleDark}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:bg-white/10"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode
                ? <Sun className="w-3.5 h-3.5 text-amber-400" />
                : <Moon className="w-3.5 h-3.5 text-slate-400" />
              }
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t transition-colors"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-around py-1.5 px-1 safe-bottom">
          {NAV_ITEMS.slice(0, 5).map(({ id, label, icon: Icon, accent }) => {
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
          <button
            onClick={() => setCurrentPage('settings')}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 cursor-pointer min-w-[52px]"
            style={currentPage === 'settings' ? { background: '#64748b15' } : {}}
          >
            <Settings className="w-5 h-5" style={{ color: currentPage === 'settings' ? '#64748b' : 'var(--text-subtle)' }} />
            <span className="text-[9px] font-semibold" style={{ color: currentPage === 'settings' ? '#64748b' : 'var(--text-subtle)' }}>
              Settings
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
