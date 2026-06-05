import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  GitBranch,
  History,
  Users,
  Settings,
  Menu,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { SyncConfig, PageId, ActiveStepId } from '../types';

interface SidebarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  syncConfig: SyncConfig;
  activeWorkflowTab: ActiveStepId | 'all';
  setActiveWorkflowTab: (tab: ActiveStepId | 'all') => void;
}

const NAV_ITEMS = [
  { id: 'dashboard' as PageId, label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'add'       as PageId, label: 'Add Lead',     icon: PlusCircle      },
  { id: 'steps'     as PageId, label: 'Pipeline',     icon: GitBranch       },
  { id: 'logs'      as PageId, label: 'Activity Log', icon: History         },
  { id: 'clients'   as PageId, label: 'Clients',      icon: Users           },
  { id: 'settings'  as PageId, label: 'Settings',     icon: Settings        },
];

function Logo() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur-md opacity-40" />
      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="white" strokeWidth="1.8"/>
          <line x1="12" y1="4" x2="12" y2="13" stroke="white" strokeWidth="1.5"/>
          <line x1="3" y1="13" x2="12" y2="13" stroke="white" strokeWidth="1.5"/>
          <path d="M14 10 L16 12 L20 8" stroke="#bbf7d0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

export default function Sidebar({
  currentPage,
  setCurrentPage,
  syncConfig,
}: SidebarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isLive = syncConfig.mode === 'live';

  const navigate = (id: PageId) => {
    setCurrentPage(id);
    setMenuOpen(false);
  };

  const NavList = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="space-y-1">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = currentPage === id;
        return (
          <button
            key={id}
            onClick={() => { navigate(id); onItemClick?.(); }}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
              active
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${
              active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-500'
            }`} />
            <span className="flex-1 text-left">{label}</span>
            {active && (
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm" />
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="font-bold text-gray-900 text-lg tracking-tight">LeadFlow</h1>
            <p className="text-[11px] text-gray-400 -mt-0.5">Design Pipeline</p>
          </div>
          <span className={`ml-2 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isLive ? 'LIVE' : 'SANDBOX'}
          </span>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <nav className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col rounded-r-2xl animate-slideInRight">
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <p className="font-bold text-gray-900 text-base">LeadFlow</p>
                  <p className="text-xs text-gray-400">Design Tracker</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <NavList onItemClick={() => setMenuOpen(false)} />
            </div>

            <div className="p-5 border-t border-gray-100">
              <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold ${
                isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {isLive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>{isLive ? 'Live Sync Active' : 'Sandbox Mode'}</span>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col shrink-0 bg-white/90 backdrop-blur-sm border-r border-gray-100 w-64 h-screen sticky top-0 shadow-sm">
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-100">
          <Logo />
          <div>
            <h1 className="font-bold text-gray-900 text-xl tracking-tight">LeadFlow</h1>
            <p className="text-[11px] text-gray-400 -mt-0.5">Design Pipeline</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <NavList />
        </div>

        {/* Footer Status */}
        <div className="p-4 border-t border-gray-100">
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            isLive 
              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-100' 
              : 'bg-amber-50 text-amber-700 border border-amber-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {isLive ? (
              <><Wifi className="w-3.5 h-3.5" /><span>Live Sync</span></>
            ) : (
              <><WifiOff className="w-3.5 h-3.5" /><span>Sandbox Mode</span></>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Premium) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-lg rounded-t-2xl">
        <div className="flex items-center justify-around py-2 px-2">
          {NAV_ITEMS.slice(0, 5).map(({ id, label, icon: Icon }) => {
            const active = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  active 
                    ? 'text-emerald-600 bg-emerald-50/80 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'drop-shadow-sm' : ''}`} />
                <span className="text-[10px] font-semibold tracking-wide">{label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage('settings')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
              currentPage === 'settings' 
                ? 'text-emerald-600 bg-emerald-50/80 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Settings</span>
          </button>
        </div>
      </nav>
    </>
  );
}

// Add any missing animations (if not already in global CSS)
// .animate-slideInRight is already defined in previous components