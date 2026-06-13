import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  CheckSquare, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  X,
  AlertCircle,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  adminName: string;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ currentPage, setCurrentPage, adminName, onLogout, isOpen, setIsOpen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard',  label: 'Dashboard',           icon: LayoutDashboard },
    { id: 'customers',  label: 'Customers',            icon: Users           },
    { id: 'loans',      label: 'Payments & Dues',      icon: Wallet          },
    { id: 'payments',   label: 'Repayments Tracker',   icon: CheckSquare     },
    { id: 'delays',     label: 'Delayed Payments',     icon: AlertCircle     },
    { id: 'reports',    label: 'Reports & Analytics',  icon: FileSpreadsheet },
    { id: 'settings',   label: 'Settings',             icon: Settings        },
  ];

  const safeName = adminName || 'Dakshinamurthy';
  const initials = safeName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Backdrop for mobile devices */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col min-h-screen border-r border-primary-light/40 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
        style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #101F30 60%, #0A1622 100%)' }}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-brand/40 shrink-0 shadow-brand">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-[11px] leading-tight tracking-widest">
                DAKSHINAMURTHY
              </h1>
              <p className="text-brand text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">
                Daily Finance · Admin
              </p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

      {/* Nav Label */}
      <p className="px-5 pt-5 pb-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/25">
        Main Navigation
      </p>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'text-primary-dark shadow-brand'
                  : 'text-white/55 hover:text-white hover:bg-white/[0.05]'
              }`}
              style={isActive ? {
                background: 'linear-gradient(135deg, #F0C040 0%, #D4A017 100%)',
              } : {}}
            >
              <Icon
                size={17}
                className={isActive ? 'text-primary-dark' : 'text-white/40 group-hover:text-white/80 transition-colors'}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-dark/50" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Footer */}
      <div className="p-4 border-t border-white/[0.06] mt-4">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div
            className="h-9 w-9 rounded-full border-2 border-brand/50 flex items-center justify-center font-extrabold text-xs shrink-0"
            style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#0D1B2A' }}
          >
            {initials}
          </div>
          <div className="truncate">
            <h4 className="text-sm font-bold text-white truncate">{safeName}</h4>
            <p className="text-[10px] text-brand/70 font-semibold">Administrator</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
            text-red-400 border border-red-900/30 hover:bg-red-950/25 hover:text-red-300
            transition-all duration-150 active:scale-95"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
