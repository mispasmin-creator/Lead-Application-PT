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
  { id: 'dashboard' as PageId, label: 'Dashboard',    icon: LayoutDashboard, accent: '#1a1a1a' },
  { id: 'add'       as PageId, label: 'Add Lead',     icon: PlusCircle,      accent: '#4a4a4a' },
  { id: 'steps'     as PageId, label: 'WorkFlow',     icon: GitBranch,       accent: '#666666' },
  { id: 'logs'      as PageId, label: 'Activity Log', icon: History,         accent: '#888888' },
  { id: 'clients'   as PageId, label: 'Clients',      icon: Users,           accent: '#2a2a2a' },
  { id: 'settings'  as PageId, label: 'Users',        icon: Settings,        accent: '#555555' },
];

function Logo() {
  return (
    <div className="relative flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl blur-sm opacity-30" />
      <div className="relative w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="white" strokeWidth="1.8"/>
          <line x1="12" y1="4" x2="12" y2="13" stroke="white" strokeWidth="1.5"/>
          <line x1="3" y1="13" x2="12" y2="13" stroke="white" strokeWidth="1.5"/>
          <path d="M14 10 L16 12 L20 8" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
    <nav className={compact ? 'space-y-0.5' : 'space-y-0.5'}>
      {visibleNavItems.map(({ id, label, icon: Icon }) => {
        const active = currentPage === id;
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer relative ${
              active
                ? 'text-gray-900 font-semibold bg-gray-100 border border-gray-200 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 border border-transparent'
            }`}
          >
            {active && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-gray-900" />
            )}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              active ? 'bg-gray-200' : 'group-hover:bg-gray-100'
            }`}>
              <Icon className="w-4 h-4 transition-colors" style={{ color: active ? '#111827' : '#9ca3af' }} />
            </div>
            <span className="flex-1 text-left leading-none">{label}</span>
            {active && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="font-bold text-base tracking-tight text-gray-900">Lead Tracker</h1>
          </div>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg transition-colors cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <nav className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] flex flex-col animate-slideInRight rounded-r-2xl overflow-hidden border-r border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <p className="font-bold text-gray-900 text-base">Lead Tracker</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NavList />
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50/50">
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                isLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                {isLive ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
                <span>{isLive ? 'Live Sync Active' : 'Sandbox Mode'}</span>
              </div>
              <button
                onClick={onLogout}
                className="mt-2 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 cursor-pointer transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col shrink-0 w-60 h-screen sticky top-0 border-r border-gray-200 bg-white shadow-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200">
          <Logo />
          <div>
            <h1 className="font-bold text-gray-900 text-lg tracking-tight leading-none">Lead Tracker</h1>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-3 pt-4">
          <NavList />
        </div>

        {/* Footer */}
        <div className="p-3 space-y-2 border-t border-gray-200 bg-gray-50/50">
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
              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {initials}
              </div>
              <span className="text-xs font-semibold truncate max-w-28 text-gray-900" title={currentUser.username}>
                {currentUser.username}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:bg-red-50 shrink-0 text-gray-400 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white shadow-lg">
        <div className="flex items-center justify-around py-1.5 px-1 safe-bottom">
          {visibleNavItems.slice(0, 5).map(({ id, label, icon: Icon, accent }) => {
            const active = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 cursor-pointer min-w-[52px]"
              >
                <Icon className="w-5 h-5" style={{ color: active ? '#1a1a1a' : '#9ca3af' }} />
                <span className="text-[9px] font-semibold tracking-wide" style={{ color: active ? '#1a1a1a' : '#9ca3af' }}>
                  {label.split(' ')[0]}
                </span>
                {active && (
                  <div className="w-1 h-1 rounded-full bg-gray-900 mt-0.5" />
                )}
              </button>
            );
          })}
          {allowedPages.includes('settings') && !visibleNavItems.slice(0, 5).some((item) => item.id === 'settings') && (
            <button
              onClick={() => setCurrentPage('settings')}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 cursor-pointer min-w-[52px]"
            >
              <Settings className="w-5 h-5" style={{ color: currentPage === 'settings' ? '#1a1a1a' : '#9ca3af' }} />
              <span className="text-[9px] font-semibold" style={{ color: currentPage === 'settings' ? '#1a1a1a' : '#9ca3af' }}>
                Users
              </span>
              {currentPage === 'settings' && (
                <div className="w-1 h-1 rounded-full bg-gray-900 mt-0.5" />
              )}
            </button>
          )}
        </div>
      </nav>
    </>
  );
}